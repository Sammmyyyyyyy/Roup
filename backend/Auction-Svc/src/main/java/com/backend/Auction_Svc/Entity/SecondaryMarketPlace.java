package com.backend.Auction_Svc.Entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "secondary_markets")
public class SecondaryMarketPlace {

    @Id
    private String marketId;

    private String assetClassId;

    private BigDecimal originalFaceValue;
    private BigDecimal capMultiplier;
    private BigDecimal maximumResalePrice;

    private boolean isTradingActive;

    private int totalOriginalQuantity;

    private Map<String, Integer> purchasedUserIds = new HashMap<>();

    public SecondaryMarketPlace(String assetClassId, BigDecimal originalFaceValue, BigDecimal capMultiplier, int totalOriginalQuantity) {
        this.assetClassId = assetClassId;
        this.originalFaceValue = originalFaceValue;
        this.capMultiplier = capMultiplier;
        this.maximumResalePrice = originalFaceValue.multiply(capMultiplier);
        this.isTradingActive = true;
        this.totalOriginalQuantity = totalOriginalQuantity;
    }

    public void recordPurchase(String userId, int quantity) {
        this.purchasedUserIds.put(userId,purchasedUserIds.getOrDefault(userId,0)+quantity);
    }
}