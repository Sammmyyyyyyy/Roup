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
    public Subscription fundReleaseSubscription(RedisConnectionFactory factory,DutchBidStreamConsumer consumer) throws UnknownHostException {

        StreamMessageListenerContainer.StreamMessageListenerContainerOptions<String, ObjectRecord<String, DutchBidCommand>> options =
                StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                        .pollTimeout(Duration.ofMillis(100))
                        .targetType(DutchBidCommand.class)
                        .build();

        StreamMessageListenerContainer<String, ObjectRecord<String, DutchBidCommand>> container =StreamMessageListenerContainer.create(factory, options);

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