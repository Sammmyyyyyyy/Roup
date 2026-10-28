package com.backend.Auction_Svc.Dto;

import java.math.BigDecimal;

public record SecondaryMarketUpdateRequest(
        BigDecimal capMultiplier,
        Boolean isTradingActive,
        String assetDescription,
        String assetImage,
        String assetName
) {}
