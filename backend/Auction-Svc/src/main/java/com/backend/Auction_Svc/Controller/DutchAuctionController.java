package com.backend.Auction_Svc.Controller;

import com.backend.Auction_Svc.Dto.DutchPurchaseRequest;
import com.backend.Auction_Svc.Service.DutchAuctionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class DutchAuctionController {

    private final DutchAuctionService service;

    public DutchAuctionController(DutchAuctionService service) {
        this.service = service;
    }

    @PostMapping("/auctions/{auctionId}/accept")
    public ResponseEntity<String> acceptAuctionPrice(
            @PathVariable String auctionId,
            @RequestBody DutchPurchaseRequest request) {

        // This validates balance and pushes to the stream[cite: 4]
        boolean queued = service.submitDutchBid(auctionId, request.userId());

        if (queued) {
            return ResponseEntity.accepted().body("Bid queued for processing.");
        } else {
            return ResponseEntity.badRequest().body("Purchase failed: Insufficient funds or auction closed.");
        }
    }
}