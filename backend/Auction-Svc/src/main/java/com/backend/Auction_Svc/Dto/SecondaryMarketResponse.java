package com.backend.Auction_Svc.Dto;

import java.math.BigDecimal;

public record SecondaryMarketResponse(
        String assetId,
        String assetName,
        String assetImage,
        String assetDescription,
        BigDecimal originalFaceValue,
        BigDecimal capMultiplier,
        BigDecimal maximumResalePrice,
        int totalOriginalQuantity,
        boolean isTradingActive
) {}