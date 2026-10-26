package com.backend.Wallet_Svc.Config;

import com.backend.Wallet_Svc.Service.FundReleaseStreamConsumer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.ObjectRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
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
    public Subscription fundReleaseSubscription(RedisConnectionFactory factory,FundReleaseStreamConsumer consumer) throws UnknownHostException {

        StreamMessageListenerContainer.StreamMessageListenerContainerOptions<String, ObjectRecord<String, String>> options =
                StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                        .pollTimeout(Duration.ofMillis(100))
                        .targetType(String.class)
                        .build();

        StreamMessageListenerContainer<String, ObjectRecord<String, String>> container =StreamMessageListenerContainer.create(factory, options);

        String consumerName = InetAddress.getLocalHost().getHostName();

        Subscription subscription = container.receive(
                Consumer.from(CONSUMER_GROUP, consumerName),
                StreamOffset.create(STREAM_KEY, ReadOffset.lastConsumed()),
                consumer
        );

        container.start();
        return subscription;
    }
}