package com.backend.Auction_Svc.Controller;

import com.backend.Auction_Svc.Dto.DutchAuctionCreateRequest;
import com.backend.Auction_Svc.Dto.DutchAuctionResponse;
import com.backend.Auction_Svc.Dto.DutchAuctionUpdateRequest;
import com.backend.Auction_Svc.Dto.DutchPurchaseRequest;
import com.backend.Auction_Svc.Service.DutchAuctionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dutch-auctions")
public class DutchAuctionController {

    private final DutchAuctionService service;

    public DutchAuctionController(DutchAuctionService service) {
        this.service = service;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<DutchAuctionResponse> createAuction(
            @RequestHeader("X-User-Id") String sellerId,
            @RequestBody DutchAuctionCreateRequest request) {
        return ResponseEntity.ok(service.createAuction(request, sellerId));
    }

    // READ (Publicly available to all users/buyers)
    @GetMapping
    public ResponseEntity<List<DutchAuctionResponse>> getActiveAuctions() {
        return ResponseEntity.ok(service.getAllActiveAuctions());
    }

    // READ SINGLE
    @GetMapping("/{auctionId}")
    public ResponseEntity<DutchAuctionResponse> getAuction(@PathVariable String auctionId) {
        return ResponseEntity.ok(service.getAuctionById(auctionId));
    }

    // UPDATE (Secured: Seller only)
    @PutMapping("/{auctionId}")
    public ResponseEntity<DutchAuctionResponse> updateAuction(
            @PathVariable String auctionId,
            @RequestHeader("X-User-Id") String requesterId,
            @RequestBody DutchAuctionUpdateRequest request) {
        return ResponseEntity.ok(service.updateAuctionDetails(auctionId, requesterId, request));
    }

    // END AUCTION (Secured: Seller only)
    @PostMapping("/{auctionId}/end")
    public ResponseEntity<DutchAuctionResponse> endAuction(
            @PathVariable String auctionId,
            @RequestHeader("X-User-Id") String requesterId) {
        return ResponseEntity.ok(service.endAuction(auctionId, requesterId));
    }

    // ACCEPT BID (Your existing endpoint)
    @PostMapping("/{auctionId}/accept")
    public ResponseEntity<String> acceptAuctionPrice(
            @PathVariable String auctionId,
            @RequestBody DutchPurchaseRequest request) {

        boolean queued = service.submitDutchBid(auctionId, request.userId());

        if (queued) {
            return ResponseEntity.accepted().body("Bid queued for processing.");
        } else {
            return ResponseEntity.badRequest().body("Purchase failed: Insufficient funds or auction closed.");
        }
    }
}