package com.backend.Auction_Svc.Dto;

import java.math.BigDecimal;

public record DutchBidCommand(
        String auctionId,
        String userId,
        BigDecimal bidAmount,
        String refId
) {}