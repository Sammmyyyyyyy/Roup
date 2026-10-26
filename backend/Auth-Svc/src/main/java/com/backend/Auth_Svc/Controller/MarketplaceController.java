package com.backend.Auth_Svc.Controller;

import com.backend.Auth_Svc.Entity.MarketplaceListing;
import com.backend.Auth_Svc.Service.MarketplaceService;
import com.backend.Auth_Svc.Service.MarketplaceService.ListingRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MarketplaceController {
    private final MarketplaceService marketplace;

    public MarketplaceController(MarketplaceService marketplace) { this.marketplace = marketplace; }

    @GetMapping("/api/marketplace/listings")
    public List<MarketplaceListing> browseListings() { return marketplace.browse(); }

    @GetMapping("/api/marketplace/summary")
    public MarketplaceService.Summary summary() { return marketplace.summary(); }

    @GetMapping("/api/markets")
    public List<MarketplaceListing> markets() { return marketplace.markets(); }

    @GetMapping("/api/markets/{id}")
    public MarketplaceListing marketDetail(@PathVariable String id) { return marketplace.marketDetail(id); }

    @GetMapping("/api/listings/mine")
    public List<MarketplaceListing> myListings(Authentication authentication) { return marketplace.myListings(authentication.getName()); }

    @PostMapping("/api/listings")
    @ResponseStatus(HttpStatus.CREATED)
    public MarketplaceListing createListing(Authentication authentication, @RequestBody ListingRequest request) {
        return marketplace.create(authentication.getName(), request);
    }

    @PutMapping("/api/listings/{id}")
    public MarketplaceListing updateListing(Authentication authentication, @PathVariable String id, @RequestBody ListingRequest request) {
        return marketplace.update(authentication.getName(), id, request);
    }

    @PatchMapping("/api/listings/{id}/status")
    public MarketplaceListing setListingStatus(Authentication authentication, @PathVariable String id, @RequestBody StatusRequest request) {
        return marketplace.setStatus(authentication.getName(), id, request.status());
    }

    public record StatusRequest(String status) { }
}
