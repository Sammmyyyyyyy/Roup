package com.backend.Auction_Svc.Dto;

import java.util.List;

public record OrderBookSnapshot(
        List<PriceLevel> bids,
        List<PriceLevel> asks
) {}