package com.backend.Auction_Svc.Dto;

import java.math.BigDecimal;
import java.time.Instant;

public record DutchAuctionResponse(
        String id,
        String assetId,
        String sellerId,
        String assetImage,
        String assetDiscription,
        String assetName,
        BigDecimal currentPrice,
        boolean isActive,
        String winnerId,
        Instant endTime
) {}