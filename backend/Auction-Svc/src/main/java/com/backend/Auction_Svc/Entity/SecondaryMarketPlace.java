package com.backend.Auction_Svc.Entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "secondary_markets")
public class SecondaryMarketPlace {

    @Id
    private String assetId;
    private String assetName;
    private String assetImage;
    private String assetDescription;

    private BigDecimal originalFaceValue;
    private BigDecimal capMultiplier;
    private BigDecimal maximumResalePrice;

    private int totalOriginalQuantity;
    private boolean isTradingActive;

    public SecondaryMarketPlace(String assetId, String assetName, String assetImage, String assetDescription,
                                BigDecimal originalFaceValue, BigDecimal capMultiplier, int totalOriginalQuantity) {
        this.assetId = assetId;
        this.assetName = assetName;
        this.assetImage = assetImage;
        this.assetDescription = assetDescription;
        this.originalFaceValue = originalFaceValue;
        this.capMultiplier = capMultiplier;
        this.maximumResalePrice = originalFaceValue.multiply(capMultiplier);
        this.isTradingActive = true;
        this.totalOriginalQuantity = totalOriginalQuantity;
    }
}