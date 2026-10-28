package com.backend.Auction_Svc.Dto;

import java.math.BigDecimal;

public record PriceLevel(
        BigDecimal price,
        int volume
) {}