package com.backend.Auction_Svc.Engine;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class Order {
    String orderId;
    String userId;
    OrderSide side;
    BigDecimal price;
    int remainingQuantity;
    long timestamp;

    public Order(String orderId, String userId, OrderSide side, BigDecimal price, int quantity) {
        this.orderId = orderId;
        this.userId = userId;
        this.side = side;
        this.price = price;
        this.remainingQuantity = quantity;
        this.timestamp = System.nanoTime(); // Ascending acceptance sequence[cite: 2]
    }
}
