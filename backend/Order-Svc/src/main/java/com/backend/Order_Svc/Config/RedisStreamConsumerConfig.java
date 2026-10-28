package com.backend.Order_Svc.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.data.redis.stream.Subscription;
import java.time.Duration;

@Configuration
public class RedisStreamConsumerConfig {

    @Bean
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            TradeEventConsumer streamListener) {

        StreamMessageListenerContainer.StreamMessageListenerContainerOptions<String, MapRecord<String, String, String>> options =
                StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                        .pollTimeout(Duration.ofMillis(100))
                        .build();

        StreamMessageListenerContainer<String, MapRecord<String, String, String>> container =
                StreamMessageListenerContainer.create(connectionFactory, options);

        // Ensure consumer group exists (ideally done via CLI or a startup init script)
        // Consume messages from the group.
        container.receive(
                org.springframework.data.redis.connection.stream.Consumer.from("order-svc-group", "consumer-1"),
                StreamOffset.create("trade-events-stream", ReadOffset.lastConsumed()),
                streamListener
        );

        container.start();
        return container;
    }
}