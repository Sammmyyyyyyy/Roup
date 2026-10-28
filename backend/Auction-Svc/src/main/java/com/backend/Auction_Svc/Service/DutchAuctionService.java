package com.backend.Auction_Svc.Service;

import com.backend.Auction_Svc.Client.WalletClient;
import com.backend.Auction_Svc.Dto.DutchAuctionCreateRequest;
import com.backend.Auction_Svc.Dto.DutchAuctionResponse;
import com.backend.Auction_Svc.Dto.DutchAuctionUpdateRequest;
import com.backend.Auction_Svc.Dto.DutchBidCommand;
import com.backend.Auction_Svc.Entity.DutchAuction;
import com.backend.Auction_Svc.Repository.DutchAuctionRepository;
import org.springframework.data.redis.connection.stream.ObjectRecord;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

    // --- CREATE ---
    public DutchAuctionResponse createAuction(DutchAuctionCreateRequest request, String sellerId) {
        DutchAuction auction = new DutchAuction();
        auction.setAssetId(request.assetId());
        auction.setSellerId(sellerId); // Extracted securely from auth headers
        auction.setAssetImage(request.assetImage());
        auction.setAssetName(request.assetName());
        auction.setAssetDiscription(request.assetDiscription());

        auction.setStartingPrice(request.startingPrice());
        auction.setCurrentPrice(request.startingPrice());
        auction.setMinimumPrice(request.minimumPrice());
        auction.setDecayAmount(request.decayAmount());
        auction.setDecayIntervalSeconds(request.decayIntervalSeconds());

        auction.setStartTime(request.startTime());
        auction.setEndTime(request.endTime());
        auction.setActive(true);

        DutchAuction saved = repository.save(auction);
        return mapToResponse(saved);
    }

    // --- READ ---
    public DutchAuctionResponse getAuctionById(String auctionId) {
        DutchAuction auction = repository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        return mapToResponse(auction);
    }

    public List<DutchAuctionResponse> getAllActiveAuctions() {
        return repository.findAll().stream()
                .filter(DutchAuction::isActive)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // --- UPDATE ---
    public DutchAuctionResponse updateAuctionDetails(String auctionId, String requesterId, DutchAuctionUpdateRequest request) {
        DutchAuction auction = repository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        validateSeller(auction, requesterId);

        if (request.assetImage() != null) auction.setAssetImage(request.assetImage());
        if (request.assetDiscription() != null) auction.setAssetDiscription(request.assetDiscription());

        return mapToResponse(repository.save(auction));
    }

    // --- END AUCTION (Manual Termination) ---
    public DutchAuctionResponse endAuction(String auctionId, String requesterId) {
        DutchAuction auction = repository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        validateSeller(auction, requesterId);

        if (!auction.isActive()) {
            throw new IllegalStateException("Auction is already closed.");
        }

        auction.setActive(false);
        auction.setEndTime(Instant.now());
        // winnerId remains null indicating an unsold item termination

        return mapToResponse(repository.save(auction));
    }

    //  BID LOGIC
    public boolean submitDutchBid(String auctionId, String userId) {
        DutchAuction auction = repository.findById(auctionId).orElseThrow();

        if (!auction.isActive()) {
            return false;
        }

        BigDecimal priceToAccept = auction.getCurrentPrice();
        String refId = "DUTCH_BID_" + UUID.randomUUID().toString();

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

    // --- SECURITY HELPER ---
    private void validateSeller(DutchAuction auction, String requesterId) {
        if (!auction.getSellerId().equals(requesterId)) {
            throw new SecurityException("Unauthorized: Only the seller of this auction can perform this action.");
        }
    }

    // Helper mapper
    private DutchAuctionResponse mapToResponse(DutchAuction auction) {
        return new DutchAuctionResponse(
                auction.getId(),
                auction.getAssetId(),
                auction.getSellerId(),
                auction.getAssetName(),
                auction.getAssetImage(),
                auction.getAssetDiscription(),
                auction.getCurrentPrice(),
                auction.isActive(),
                auction.getWinnerId(),
                auction.getEndTime()
        );
    }
}