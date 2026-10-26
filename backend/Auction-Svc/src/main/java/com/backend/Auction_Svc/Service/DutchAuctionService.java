package com.backend.Auction_Svc.Service;

import com.backend.Auction_Svc.Client.WalletClient;
import com.backend.Auction_Svc.Dto.DutchBidCommand;
import com.backend.Auction_Svc.Entity.DutchAuction;
import com.backend.Auction_Svc.Repository.DutchAuctionRepository;
import org.springframework.data.redis.connection.stream.ObjectRecord;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.UUID;

@Service
public class DutchAuctionService {

    private final DutchAuctionRepository repository;
    private final WalletClient walletClient;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String DUTCH_BID_STREAM = "dutch-bids-stream";

    public DutchAuctionService(DutchAuctionRepository repository, WalletClient walletClient, RedisTemplate<String, Object> redisTemplate) {
        this.repository = repository;
        this.walletClient = walletClient;
        this.redisTemplate = redisTemplate;
    }

    public boolean submitDutchBid(String auctionId, String userId) {
        DutchAuction auction = repository.findById(auctionId).orElseThrow();

        if (!auction.isActive()) {
            return false;
        }

        BigDecimal priceToAccept = auction.getCurrentPrice();
        String refId = "DUTCH_BID_" + UUID.randomUUID().toString();

        // 1. Immediate Synchronous Reservation via Feign
        Boolean isReserved = walletClient.reserveFunds(userId, priceToAccept, refId).getBody();

        if (Boolean.TRUE.equals(isReserved)) {
            ObjectRecord<String, DutchBidCommand> record = StreamRecords.newRecord()
                    .in(DUTCH_BID_STREAM)
                    .ofObject(new DutchBidCommand(auctionId, userId, priceToAccept, refId));

            redisTemplate.opsForStream().add(record);
            return true;
        }

        return false;
    }
}