package com.backend.Order_Svc.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.data.redis.stream.Subscription;
import io.lettuce.core.RedisBusyException;
import java.time.Duration;

@Configuration
public class RedisStreamConsumerConfig {

    @Bean
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            StringRedisTemplate redisTemplate,
            TradeEventConsumer streamListener) {

        initializeConsumerGroup(redisTemplate);

        StreamMessageListenerContainer.StreamMessageListenerContainerOptions<String, MapRecord<String, String, String>> options =
                StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                        .pollTimeout(Duration.ofMillis(100))
                        .build();

        StreamMessageListenerContainer<String, MapRecord<String, String, String>> container =
                StreamMessageListenerContainer.create(connectionFactory, options);

        container.receiveAutoAck(
                org.springframework.data.redis.connection.stream.Consumer.from("order-svc-group", "consumer-1"),
                StreamOffset.create("trade-events-stream", ReadOffset.lastConsumed()),
                streamListener
        );

        container.start();
        return container;
    }

    private void initializeConsumerGroup(StringRedisTemplate redisTemplate) {
        try {
            redisTemplate.execute((RedisCallback<Void>) connection -> {
                connection.streamCommands().xGroupCreate(
                        "trade-events-stream".getBytes(),
                        "order-svc-group",
                        ReadOffset.from("0-0"),
                        true
                );
                return null;
            });
        } catch (RedisSystemException e) {
            Throwable rootCause = NestedExceptionUtils.getRootCause(e);
            String message = rootCause != null ? rootCause.getMessage() : e.getMessage();
            if (e.getCause() instanceof RedisBusyException || (message != null && message.contains("BUSYGROUP"))) {
                return;
            }
            throw e;
        }
    }
}
