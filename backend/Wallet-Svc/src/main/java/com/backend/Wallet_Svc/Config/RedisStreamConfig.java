package com.backend.Wallet_Svc.Config;

import com.backend.Wallet_Svc.Service.FundReleaseStreamConsumer;
import io.lettuce.core.RedisBusyException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.ObjectRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.data.redis.stream.Subscription;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;

@Configuration
public class RedisStreamConfig {

    public static final String STREAM_KEY = "fund-release-stream";
    public static final String CONSUMER_GROUP = "wallet-consumer-group";

    @Bean
    public Subscription fundReleaseSubscription(
            RedisConnectionFactory factory,
            StringRedisTemplate redisTemplate,
            FundReleaseStreamConsumer consumer
    ) throws UnknownHostException {

        initializeConsumerGroup(redisTemplate);

        StreamMessageListenerContainer.StreamMessageListenerContainerOptions<String, ObjectRecord<String, String>> options =
                StreamMessageListenerContainer.StreamMessageListenerContainerOptions
                        .<String, ObjectRecord<String, String>>builder()
                        .pollTimeout(Duration.ofMillis(100))
                        .targetType(String.class)
                        .build();

        StreamMessageListenerContainer<String, ObjectRecord<String, String>> container =
                StreamMessageListenerContainer.create(factory, options);

        String consumerName = InetAddress.getLocalHost().getHostName();

        Subscription subscription = container.receiveAutoAck(
                Consumer.from(CONSUMER_GROUP, consumerName),
                StreamOffset.create(STREAM_KEY, ReadOffset.lastConsumed()),
                consumer
        );

        container.start();

        return subscription;
    }

    private void initializeConsumerGroup(StringRedisTemplate redisTemplate) {
        try {
            redisTemplate.execute((RedisCallback<Void>) connection -> {
                connection.streamCommands().xGroupCreate(
                        STREAM_KEY.getBytes(),
                        CONSUMER_GROUP,
                        ReadOffset.from("0-0"),
                        true // MKSTREAM = true: auto-creates the stream key cleanly
                );
                return null;
            });
        } catch (RedisSystemException e) {
            Throwable rootCause = NestedExceptionUtils.getRootCause(e);
            String message = (rootCause != null && rootCause.getMessage() != null)
                    ? rootCause.getMessage()
                    : (e.getMessage() != null ? e.getMessage() : "");

            // If the group already exists, safely ignore and continue
            if (e.getCause() instanceof RedisBusyException || message.contains("BUSYGROUP")) {
                return;
            }
            throw e;
        }
    }
}
