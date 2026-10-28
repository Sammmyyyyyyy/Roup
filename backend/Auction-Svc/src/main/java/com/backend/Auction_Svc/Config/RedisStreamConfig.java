package com.backend.Auction_Svc.Config;

import com.backend.Auction_Svc.Service.DutchBidStreamConsumer;
import io.lettuce.core.RedisBusyException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
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

    public static final String STREAM_KEY = "dutch-bids-stream";
    public static final String CONSUMER_GROUP = "auction-matching-group";

    // Container is its own bean, so Spring starts/stops it with the app
    @Bean
    public StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamContainer(
            RedisConnectionFactory factory) {
        return StreamMessageListenerContainer.create(factory,
                StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                        .pollTimeout(Duration.ofMillis(100))
                        .build());
    }

    @Bean
    public Subscription dutchBidSubscription(
            StreamMessageListenerContainer<String, MapRecord<String, String, String>> container,
            StringRedisTemplate redisTemplate,
            DutchBidStreamConsumer consumer) throws UnknownHostException {

        prepareStreamAndGroup(redisTemplate);

        String consumerName = InetAddress.getLocalHost().getHostName();

        return container.receiveAutoAck(
                Consumer.from(CONSUMER_GROUP, consumerName),
                StreamOffset.create(STREAM_KEY, ReadOffset.lastConsumed()),
                consumer
        );
    }

    private void prepareStreamAndGroup(StringRedisTemplate redisTemplate) {
        try {
            redisTemplate.execute((RedisCallback<Void>) connection -> {
                connection.streamCommands().xGroupCreate(
                        STREAM_KEY.getBytes(),
                        CONSUMER_GROUP,
                        ReadOffset.from("0-0"),
                        true
                );
                return null;
            });
        } catch (RedisSystemException e) {
            Throwable rootCause = NestedExceptionUtils.getRootCause(e);
            String message = rootCause != null ? rootCause.getMessage() : e.getMessage();
            if (e.getCause() instanceof RedisBusyException
                    || (message != null && message.contains("BUSYGROUP"))) {
                return;
            }
            throw e;
        }
    }
}