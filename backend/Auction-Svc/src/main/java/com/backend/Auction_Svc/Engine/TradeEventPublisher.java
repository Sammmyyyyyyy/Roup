package com.backend.Auction_Svc.Engine;

import java.math.BigDecimal;

public interface TradeEventPublisher {
    void publishTradeEvent(String assetId, String buyerId, String sellerId, BigDecimal price, int quantity);
}