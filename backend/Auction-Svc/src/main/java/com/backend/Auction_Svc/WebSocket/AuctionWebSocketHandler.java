package com.backend.Auction_Svc.WebSocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class AuctionWebSocketHandler extends TextWebSocketHandler {

    private final ConcurrentHashMap<String, CopyOnWriteArrayList<WebSocketSession>> subscriptions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public AuctionWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("New WebSocket connection established: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();

        if (payload.startsWith("SUBSCRIBE:")) {
            String auctionId = payload.split(":")[1];
            subscriptions.computeIfAbsent(auctionId, k -> new CopyOnWriteArrayList<>()).add(session);
            session.sendMessage(new TextMessage("{\"status\":\"Subscribed to " + auctionId + "\"}"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        subscriptions.values().forEach(sessions -> sessions.remove(session));
    }

    public void broadcastUpdate(String auctionId, String type, Object payload) {
        CopyOnWriteArrayList<WebSocketSession> sessions = subscriptions.getOrDefault(auctionId, new CopyOnWriteArrayList<>());

        String jsonUpdate = objectMapper.writeValueAsString(Map.of(
                "type", type,
                "auctionId", auctionId,
                "payload", payload
        ));

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
