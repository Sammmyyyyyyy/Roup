package com.backend.Auction_Svc.Service;

import com.backend.Auction_Svc.Dto.FundReleaseEvent;
import org.springframework.data.redis.connection.stream.ObjectRecord;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RefundPublisherService {

    private final RedisTemplate<String, Object> redisTemplate;
    public static final String STREAM_KEY = "fund-release-stream";

    public RefundPublisherService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publishRefund(FundReleaseEvent event) {
        ObjectRecord<String, FundReleaseEvent> record = StreamRecords.newRecord()
                .in(STREAM_KEY)
                .ofObject(event);

        redisTemplate.opsForStream().add(record);
    }
}