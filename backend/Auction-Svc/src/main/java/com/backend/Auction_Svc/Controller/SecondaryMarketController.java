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
    public ResponseEntity<String> placeBuyOrder(@RequestBody OrderRequest request) {
        String orderId = service.placeBuyOrder(request);
        return ResponseEntity.accepted().body("Buy order queued for execution. Order ID: " + orderId);
    }

    @PostMapping("/sell")
    public ResponseEntity<String> placeSellOrder(@RequestBody OrderRequest request) {
        String orderId = service.placeSellOrder(request);
        return ResponseEntity.accepted().body("Sell order queued for execution. Order ID: " + orderId);
    }
}