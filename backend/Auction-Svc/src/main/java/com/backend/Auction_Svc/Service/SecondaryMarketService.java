package com.backend.Auction_Svc.Service;

import com.backend.Auction_Svc.Client.WalletClient;
import com.backend.Auction_Svc.Dto.OrderRequest;
import com.backend.Auction_Svc.Dto.SecondaryMarketCreateRequest;
import com.backend.Auction_Svc.Dto.SecondaryMarketResponse;
import com.backend.Auction_Svc.Dto.SecondaryMarketUpdateRequest;
import com.backend.Auction_Svc.Engine.Order;
import com.backend.Auction_Svc.Engine.OrderSide;
import com.backend.Auction_Svc.Entity.SecondaryMarketPlace;
import com.backend.Auction_Svc.Repository.SecondaryMarketRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SecondaryMarketService {

    private final SecondaryMarketRepository repository;
    private final MarketManager marketManager;
    private final WalletClient walletClient;

    public SecondaryMarketService(SecondaryMarketRepository repository, MarketManager marketManager,WalletClient walletClient ) {
        this.repository = repository;
        this.walletClient = walletClient;
        this.marketManager = marketManager;
    }

    public SecondaryMarketResponse createMarket(SecondaryMarketCreateRequest request) {
        if (repository.existsById(request.assetId())) {
            throw new IllegalArgumentException("Market for this asset already exists.");
        }

        SecondaryMarketPlace market = new SecondaryMarketPlace(
                request.assetId(),
                request.assetName(),
                request.assetImage(),
                request.assetDescription(),
                request.originalFaceValue(),
                request.capMultiplier(),
                request.totalOriginalQuantity()
        );

        return mapToResponse(repository.save(market));
    }

    public SecondaryMarketResponse getMarketById(String assetId) {
        SecondaryMarketPlace market = repository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Secondary market not found"));
        return mapToResponse(market);
    }

    public List<SecondaryMarketResponse> getAllActiveMarkets() {
        return repository.findAll().stream()
                .filter(SecondaryMarketPlace::isTradingActive)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SecondaryMarketResponse updateMarketConfig(String assetId, SecondaryMarketUpdateRequest request) {
        SecondaryMarketPlace market = repository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Secondary market not found"));

        if (request.capMultiplier() != null) {
            if (request.capMultiplier().compareTo(market.getCapMultiplier()) < 0) {
                throw new IllegalArgumentException("The cap multiplier can only be increased, it cannot be decreased.");
            }
            market.setCapMultiplier(request.capMultiplier());
            market.setMaximumResalePrice(market.getOriginalFaceValue().multiply(request.capMultiplier()));
        }

        if (request.isTradingActive() != null) {
            market.setTradingActive(request.isTradingActive());
        }

        if (request.assetName() != null) {
            market.setAssetName(request.assetName());
        }

        if (request.assetImage() != null) {
            market.setAssetImage(request.assetImage());
        }

        if (request.assetDescription() != null) {
            market.setAssetDescription(request.assetDescription());
        }

        return mapToResponse(repository.save(market));
    }

    public String placeBuyOrder(OrderRequest request) {
        validateOrder(request);
        SecondaryMarketPlace market = validateAndGetActiveMarket(request.assetId());

        Order order = new Order(
                UUID.randomUUID().toString(),
                request.userId(),
                OrderSide.BUY,
                request.price(),
                request.quantity()
        );
        String refId = "SECONDARY_MARKET_BID_" + UUID.randomUUID().toString();

        Boolean isReserved = walletClient.reserveFunds(request.userId(), request.price().multiply(BigDecimal.valueOf(request.quantity())), refId).getBody();

        if(Boolean.FALSE.equals(isReserved))
            throw new RuntimeException("Couldn't reserve the bid amount");

        marketManager.getOrCreateEngine(request.assetId()).submitOrder(order);
        return order.getOrderId();
    }

    public String placeSellOrder(OrderRequest request) {
        validateOrder(request);
        SecondaryMarketPlace market = validateAndGetActiveMarket(request.assetId());

        if (request.price().compareTo(market.getMaximumResalePrice()) > 0) {
            throw new IllegalArgumentException("Sell price exceeds the maximum allowed resale cap for this asset.");
        }

        // Note: Call Asset/Inventory-Svc here to lock the actual NFT/Asset before placing the order

        Order order = new Order(
                UUID.randomUUID().toString(),
                request.userId(),
                OrderSide.SELL,
                request.price(),
                request.quantity()
        );

        marketManager.getOrCreateEngine(request.assetId()).submitOrder(order);
        return order.getOrderId();
    }

    private SecondaryMarketPlace validateAndGetActiveMarket(String assetId) {
        SecondaryMarketPlace market = repository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Secondary market not found"));

        if (!market.isTradingActive()) {
            throw new IllegalStateException("Trading is currently suspended for this market.");
        }
        return market;
    }

    private void validateOrder(OrderRequest request) {
        if (request.price() == null || request.price().signum() <= 0 || request.quantity() <= 0) {
            throw new IllegalArgumentException("Order price and quantity must be greater than zero.");
        }
    }

    private SecondaryMarketResponse mapToResponse(SecondaryMarketPlace market) {
        return new SecondaryMarketResponse(
                market.getAssetId(),
                market.getAssetName(),
                market.getAssetImage(),
                market.getAssetDescription(),
                market.getOriginalFaceValue(),
                market.getCapMultiplier(),
                market.getMaximumResalePrice(),
                market.getTotalOriginalQuantity(),
                market.isTradingActive()
        );
    }
}
