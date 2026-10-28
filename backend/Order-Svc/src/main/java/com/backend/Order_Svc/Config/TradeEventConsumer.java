package com.backend.Order_Svc.Config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class TradeEventConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final ObjectMapper objectMapper;

    public TradeEventConsumer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(MapRecord<String, String, String> message) {
        try {
            // Extract the raw JSON string from the "payload" map key
            String jsonPayload = message.getValue().get("payload");

            // Deserialize back to DTO
            TradeEventDto event = objectMapper.readValue(jsonPayload, TradeEventDto.class);

            // Execute double-entry ledger logic, update balances, write to PostgreSQL
            System.out.println("Processing trade execution: " + event);

        } catch (Exception e) {
            // Send to Dead Letter Queue or log failure
            System.err.println("Failed to process stream message: " + e.getMessage());
        }
    }
}

// Local DTO in Order-Svc
record TradeEventDto(String marketId, String buyerId, String sellerId, BigDecimal price, int quantity, long timestamp) {}