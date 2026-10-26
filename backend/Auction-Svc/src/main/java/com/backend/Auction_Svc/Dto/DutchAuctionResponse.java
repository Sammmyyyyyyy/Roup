package com.backend.Auction_Svc.Dto;

import java.math.BigDecimal;

public record DutchAuctionResponse(
        String id,
        String assetId,
        BigDecimal currentPrice,
        boolean isActive,
        String winnerId
) {}