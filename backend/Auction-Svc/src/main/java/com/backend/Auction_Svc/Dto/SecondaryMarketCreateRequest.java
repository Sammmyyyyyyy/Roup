package com.backend.Auction_Svc.Dto;
import java.math.BigDecimal;

public record SecondaryMarketCreateRequest(
        String assetId,
        String assetName,
        String assetImage,
        String assetDescription,
        BigDecimal originalFaceValue,
        BigDecimal capMultiplier,
        int totalOriginalQuantity
) {}