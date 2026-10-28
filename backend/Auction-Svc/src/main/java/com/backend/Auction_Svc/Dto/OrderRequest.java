package com.backend.Auction_Svc.Dto;

import java.math.BigDecimal;

public record OrderRequest(
        String assetId,
        String userId,
        String side, // "BUY" or "SELL"
        BigDecimal price,
        int quantity
) {}