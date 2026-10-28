package com.backend.Auction_Svc.Engine;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Collections;

@Service
public class RedisTradeEventPublisher implements TradeEventPublisher {

    // Injecting your existing RedisTemplate<String, String> bean
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private static final String STREAM_KEY = "trade-events-stream";

    public RedisTradeEventPublisher(RedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void publishTradeEvent(String assetId, String buyerId, String sellerId, BigDecimal price, int quantity) {
        try {
            TradeEvent event = new TradeEvent(assetId, buyerId, sellerId, price, quantity, System.currentTimeMillis());

            // Serialize the entire event object into a plain JSON string to avoid Jackson @class mapping issues
            String jsonPayload = objectMapper.writeValueAsString(event);

            // Push to Redis Stream with a single "payload" field containing the JSON
            redisTemplate.opsForStream().add(
                    STREAM_KEY,
                    Collections.singletonMap("payload", jsonPayload)
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize and publish trade event", e);
        }
    }
}