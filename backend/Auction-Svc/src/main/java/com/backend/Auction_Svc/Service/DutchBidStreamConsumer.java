package com.backend.Auction_Svc.Service;

import com.backend.Auction_Svc.Dto.DutchBidCommand;
import com.backend.Auction_Svc.Dto.FundReleaseEvent;
import com.backend.Auction_Svc.Entity.DutchAuction;
import com.backend.Auction_Svc.Repository.DutchAuctionRepository;
import com.backend.Auction_Svc.WebSocket.AuctionWebSocketHandler;
import tools.jackson.databind.ObjectMapper;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ObjectRecord;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class DutchBidStreamConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final DutchAuctionRepository repository;
    private final RedisTemplate<String, String> redisTemplate;
    private final AuctionWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    private static final String FUND_RELEASE_STREAM = "fund-release-stream";

    public DutchBidStreamConsumer(
            DutchAuctionRepository repository,
            RedisTemplate<String, String> redisTemplate,
            AuctionWebSocketHandler webSocketHandler,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
        this.webSocketHandler = webSocketHandler;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(MapRecord<String, String, String> message) {
        Map<String, String> f = message.getValue();
        DutchBidCommand command = new DutchBidCommand(
                f.get("auctionId"),
                f.get("userId"),
                new BigDecimal(f.get("bidAmount")),
                f.get("refId"));

        DutchAuction auction = repository.findById(command.auctionId()).orElse(null);

        if (auction != null && auction.isActive()) {
            auction.setActive(false);
            auction.setWinnerId(command.userId());
            repository.save(auction);

            // Broadcast the winner
            webSocketHandler.broadcastUpdate(auction.getId(), "AUCTION_CLOSED_WINNER", command);
        } else {
            // Asynchronously release the unused reservation back to the available balance
            FundReleaseEvent releaseEvent = new FundReleaseEvent(
                    command.userId(),
                    command.bidAmount(),
                    command.refId() + "_REFUND"
            );

            String jsonPayload = objectMapper.writeValueAsString(releaseEvent);

            ObjectRecord<String, String> record = StreamRecords.newRecord()
                    .in(FUND_RELEASE_STREAM)
                    .ofObject(jsonPayload);

            redisTemplate.opsForStream().add(record);

            webSocketHandler.broadcastUpdate(command.auctionId(), "BID_REJECTED", command.userId());
        }
    }
}