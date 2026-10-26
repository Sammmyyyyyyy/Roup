package com.backend.Auth_Svc.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "marketplace_listings", indexes = {
        @Index(name = "idx_listing_status", columnList = "status"),
        @Index(name = "idx_listing_seller", columnList = "seller_id")
})
public class MarketplaceListing {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 120)
    private String itemName;
    @Column(nullable = false, length = 140)
    private String eventName;
    @Column(nullable = false, length = 40)
    private String category;
    @Column(length = 1200)
    private String description;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal faceValue;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal askingPrice;
    @Column(nullable = false)
    private int quantity;
    @Column(nullable = false, length = 40)
    private String status;
    @Column(nullable = false, length = 80)
    @JsonIgnore
    private String sellerId;
    @Column(nullable = false)
    private boolean demo;
    @Column(nullable = false)
    private boolean sellerAttested;
    @Column(nullable = false)
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
