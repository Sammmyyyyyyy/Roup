package com.backend.Auction_Svc.Engine;

import com.backend.Auction_Svc.Dto.OrderBookSnapshot;
import com.backend.Auction_Svc.Dto.PriceLevel;
import com.backend.Auction_Svc.WebSocket.MarketWebSocketHandler;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

public class MatchingEngine implements Runnable {
    private final String assetId;

    // Bids prioritized by descending price
    private final NavigableMap<BigDecimal, Queue<Order>> bids = new TreeMap<>(Collections.reverseOrder());
    // Asks prioritized by ascending price
    private final NavigableMap<BigDecimal, Queue<Order>> asks = new TreeMap<>();

    // Command queue for single-writer deterministic processing
    private final BlockingQueue<Order> commandQueue = new LinkedBlockingQueue<>();
    private final TradeEventPublisher tradePublisher;
    private final MarketWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    public MatchingEngine(String assetId,TradeEventPublisher tradePublisher,MarketWebSocketHandler webSocketHandler,ObjectMapper objectMapper) {
        this.assetId = assetId;
        this.tradePublisher = tradePublisher;
        this.webSocketHandler = webSocketHandler;
        this.objectMapper = objectMapper;
    }

    // Concurrent HTTP threads call this to queue orders safely
    public void submitOrder(Order order) {
        commandQueue.offer(order);
    }

    @Override
    public void run() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                // Consumes threads one at a time[cite: 2]
                Order incoming = commandQueue.take();
                matchOrder(incoming);
                broadcastOrderBook();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private void matchOrder(Order incoming) {
        NavigableMap<BigDecimal, Queue<Order>> oppositeBook = (incoming.side == OrderSide.BUY) ? asks : bids;
        NavigableMap<BigDecimal, Queue<Order>> sameBook = (incoming.side == OrderSide.BUY) ? bids : asks;

        Iterator<Map.Entry<BigDecimal, Queue<Order>>> iterator = oppositeBook.entrySet().iterator();

        while (iterator.hasNext() && incoming.remainingQuantity > 0) {
            Map.Entry<BigDecimal, Queue<Order>> entry = iterator.next();
            BigDecimal restingPrice = entry.getKey();

            // A buy matches when its limit is >= best sell; a sell matches when its limit is <= best buy[cite: 2]
            if ((incoming.side == OrderSide.BUY && incoming.price.compareTo(restingPrice) < 0) ||
                    (incoming.side == OrderSide.SELL && incoming.price.compareTo(restingPrice) > 0)) {
                break; // No match possible
            }

            Queue<Order> restingOrders = entry.getValue();
            while (!restingOrders.isEmpty() && incoming.remainingQuantity > 0) {
                Order resting = restingOrders.peek();

                // Calculate minimum of incoming and resting quantities[cite: 2]
                int fillQty = Math.min(incoming.remainingQuantity, resting.remainingQuantity);

                incoming.remainingQuantity -= fillQty;
                resting.remainingQuantity -= fillQty;

                // Push TRADE_EXECUTED to Redis Streams for async Orders Service processing
                tradePublisher.publishTradeEvent(assetId, incoming.userId, resting.userId, restingPrice, fillQty);

                if (resting.remainingQuantity == 0) {
                    restingOrders.poll(); // Remove fully filled resting order
                }
            }

            if (restingOrders.isEmpty()) {
                iterator.remove(); // Clean up empty price levels
            }
        }

        // If unfilled, rest in book[cite: 2]
        if (incoming.remainingQuantity > 0) {
            sameBook.computeIfAbsent(incoming.price, k -> new LinkedList<>()).add(incoming);
        }
    }
    private void broadcastOrderBook() {
        try {
            // Aggregate volume at each price level
            List<PriceLevel> currentBids = bids.entrySet().stream()
                    .map(e -> new PriceLevel(e.getKey(), e.getValue().stream().mapToInt(o -> o.remainingQuantity).sum()))
                    .limit(20) // Only send the top 20 levels to save client memory
                    .toList();

            List<PriceLevel> currentAsks = asks.entrySet().stream()
                    .map(e -> new PriceLevel(e.getKey(), e.getValue().stream().mapToInt(o -> o.remainingQuantity).sum()))
                    .limit(20)
                    .toList();

            OrderBookSnapshot snapshot = new OrderBookSnapshot(currentBids, currentAsks);
            String jsonPayload = objectMapper.writeValueAsString(snapshot);

            // Delegate direct broadcasting to the WebSocket handler
            webSocketHandler.broadcastOrderBook(assetId, jsonPayload);

        } catch (Exception e) {
            System.err.println("Failed to broadcast order book for market " + assetId + ": " + e.getMessage());
        }
    }
}