package com.backend.Auction_Svc.Entity;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Document(collection = "dutch_auctions")
public class DutchAuction {

    @Id
    private String id;

    private String assetId;
    private String sellerId;
    private String assetImage;
    private String assetDiscription;
    private String assetName;

    private BigDecimal startingPrice;
    private BigDecimal minimumPrice;
    private BigDecimal currentPrice;

    private BigDecimal decayAmount;
    private long decayIntervalSeconds;

    private Instant startTime;
    private Instant endTime;

    private String winnerId;

    @Indexed
    private boolean isActive;
}