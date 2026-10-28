package com.backend.Auction_Svc.WebSocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class MarketWebSocketHandler extends TextWebSocketHandler {

    private final ConcurrentHashMap<String, CopyOnWriteArrayList<WebSocketSession>> subscriptions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("Market WS connection established: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();

        if (payload.startsWith("SUBSCRIBE:")) {
            String marketId = payload.split(":")[1];
            subscriptions.computeIfAbsent(marketId, k -> new CopyOnWriteArrayList<>()).add(session);
            session.sendMessage(new TextMessage("{\"status\":\"Subscribed to order book for " + marketId + "\"}"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        subscriptions.values().forEach(sessions -> sessions.remove(session));
    }

    public void broadcastOrderBook(String marketId, String jsonPayload) {
        CopyOnWriteArrayList<WebSocketSession> sessions = subscriptions.getOrDefault(marketId, new CopyOnWriteArrayList<>());

        String jsonUpdate = String.format("{\"type\":\"ORDER_BOOK_UPDATE\", \"marketId\":\"%s\", \"payload\":%s}", marketId, jsonPayload);

        sessions.forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(jsonUpdate));
                }
            } catch (IOException e) {
                sessions.remove(session);
            }
        });
    }
}