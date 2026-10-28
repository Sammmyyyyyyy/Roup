package com.backend.Auction_Svc.Controller;

import com.backend.Auction_Svc.Dto.OrderRequest;
import com.backend.Auction_Svc.Dto.SecondaryMarketCreateRequest;
import com.backend.Auction_Svc.Dto.SecondaryMarketResponse;
import com.backend.Auction_Svc.Dto.SecondaryMarketUpdateRequest;
import com.backend.Auction_Svc.Service.SecondaryMarketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/secondary-markets")
public class SecondaryMarketController {

    private final SecondaryMarketService service;

    public SecondaryMarketController(SecondaryMarketService service) {
        this.service = service;
    }

    @PostMapping("/create")
    public ResponseEntity<SecondaryMarketResponse> createMarket(@RequestBody SecondaryMarketCreateRequest request) {
        return ResponseEntity.ok(service.createMarket(request));
    }

    @GetMapping("/active-markets")
    public ResponseEntity<List<SecondaryMarketResponse>> getActiveMarkets() {
        return ResponseEntity.ok(service.getAllActiveMarkets());
    }

    @GetMapping("/{assetId}")
    public ResponseEntity<SecondaryMarketResponse> getMarket(@PathVariable String assetId) {
        return ResponseEntity.ok(service.getMarketById(assetId));
    }

    @PutMapping("/{assetId}")
    public ResponseEntity<SecondaryMarketResponse> updateMarketConfig(
            @PathVariable String assetId,
            @RequestBody SecondaryMarketUpdateRequest request) {
        return ResponseEntity.ok(service.updateMarketConfig(assetId, request));
    }

    @PostMapping("/buy")
    public ResponseEntity<String> placeBuyOrder(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody OrderRequest request) {
        String orderId = service.placeBuyOrder(withVerifiedUserId(request, userId));
        return ResponseEntity.accepted().body("Buy order queued for execution. Order ID: " + orderId);
    }

    @PostMapping("/sell")
    public ResponseEntity<String> placeSellOrder(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody OrderRequest request) {
        String orderId = service.placeSellOrder(withVerifiedUserId(request, userId));
        return ResponseEntity.accepted().body("Sell order queued for execution. Order ID: " + orderId);
    }

    private OrderRequest withVerifiedUserId(OrderRequest request, String userId) {
        return new OrderRequest(
                request.assetId(), userId, request.side(), request.price(), request.quantity());
    }
}
