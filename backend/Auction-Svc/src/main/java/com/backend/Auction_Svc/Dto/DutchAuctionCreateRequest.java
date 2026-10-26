package com.backend.Auction_Svc.Dto;

import java.math.BigDecimal;
import java.time.Instant;

public record DutchAuctionCreateRequest(
        String assetId,
        String sellerId,
        BigDecimal startingPrice,
        BigDecimal minimumPrice,
        BigDecimal decayAmount,
        long decayIntervalSeconds,
        Instant startTime,
        Instant endTime
) {}