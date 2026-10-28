package com.backend.Auction_Svc.Service;

import com.backend.Auction_Svc.Engine.MatchingEngine;
import com.backend.Auction_Svc.Engine.TradeEventPublisher;
import com.backend.Auction_Svc.WebSocket.MarketWebSocketHandler;
import org.springframework.stereotype.Service;
import jakarta.annotation.PreDestroy;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class MarketManager {
    private final Map<String, MatchingEngine> engines = new ConcurrentHashMap<>();
    private final TradeEventPublisher tradePublisher;
    private final MarketWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    // Virtual threads are ideal here if using Java 21, otherwise a cached thread pool
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public MarketManager(TradeEventPublisher tradePublisher, MarketWebSocketHandler webSocketHandler, ObjectMapper objectMapper) {
        this.tradePublisher = tradePublisher;
        this.webSocketHandler = webSocketHandler;
        this.objectMapper = objectMapper;
    }

    public MatchingEngine getOrCreateEngine(String marketId) {
        return engines.computeIfAbsent(marketId, id -> {
            MatchingEngine engine = new MatchingEngine(id, tradePublisher, webSocketHandler, objectMapper);
            executor.submit(engine); // Start the engine loop
            return engine;
        });
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdownNow();
    }
}