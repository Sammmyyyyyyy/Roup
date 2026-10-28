package com.backend.Auction_Svc.Config;

import com.backend.Auction_Svc.Dto.DutchBidCommand;
import com.backend.Auction_Svc.Service.DutchBidStreamConsumer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.ObjectRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.data.redis.stream.Subscription;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;

@Configuration
public class RedisStreamConfig {

    public static final String STREAM_KEY = "dutch-bids-stream";
    public static final String CONSUMER_GROUP = "auction-matching-group";

    @Bean
    public Subscription fundReleaseSubscription(
            RedisConnectionFactory factory,
            RedisTemplate<String, Object> redisTemplate,
            DutchBidStreamConsumer consumer) throws UnknownHostException {

        // 1. Auto-create stream and consumer group if they don't exist
        prepareStreamAndGroup(redisTemplate);

        // 2. Configure listener container options
        StreamMessageListenerContainer.StreamMessageListenerContainerOptions<String, ObjectRecord<String, DutchBidCommand>> options =
                StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                        .pollTimeout(Duration.ofMillis(100))
                        .targetType(DutchBidCommand.class)
                        .build();

        StreamMessageListenerContainer<String, ObjectRecord<String, DutchBidCommand>> container =StreamMessageListenerContainer.create(factory, options);

        String consumerName = InetAddress.getLocalHost().getHostName();

        // 3. Register subscription
        Subscription subscription = container.receive(
                Consumer.from(CONSUMER_GROUP, consumerName),
                StreamOffset.create(STREAM_KEY, ReadOffset.lastConsumed()),
                consumer
        );

        container.start();
        return subscription;
    }

    private void prepareStreamAndGroup(RedisTemplate<String, Object> redisTemplate) {
        try {
            // Check if stream exists; if not, create group with MKSTREAM (creates stream automatically)
            redisTemplate.opsForStream().createGroup(STREAM_KEY, ReadOffset.latest(), CONSUMER_GROUP);
        } catch (Exception e) {
            // BUSYGROUP Consumer Group name already exists - safe to ignore
            if (e.getMessage() != null && e.getMessage().contains("BUSYGROUP")) {
                // Group already exists, continue normal operation
                return;
            }
            // Some Redis setups require explicit MKSTREAM command if the above throws
            try {
                Boolean hasKey = redisTemplate.hasKey(STREAM_KEY);
                if (Boolean.FALSE.equals(hasKey)) {
                    // Seed the stream or let createGroup run
                    redisTemplate.opsForStream().createGroup(STREAM_KEY, CONSUMER_GROUP);
                }
            } catch (Exception ignored) {
                // Ignore if already established
            }
        }
    }
}