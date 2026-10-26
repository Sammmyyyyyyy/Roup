package com.backend.Auction_Svc.Dto;

import java.math.BigDecimal;

public record FundReleaseEvent(
        String userId,
        BigDecimal amount,
        String refId
) {}