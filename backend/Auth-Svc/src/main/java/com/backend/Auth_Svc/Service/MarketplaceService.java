package com.backend.Auth_Svc.Service;

import com.backend.Auth_Svc.Entity.MarketplaceListing;
import com.backend.Auth_Svc.Entity.User;
import com.backend.Auth_Svc.Repository.MarketplaceListingRepository;
import com.backend.Auth_Svc.Repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class MarketplaceService {
    private static final List<String> ALLOWED_CATEGORIES = List.of(
            "Festival Pass", "Festival Passes", "VIP Pass", "VIP Passes",
            "Merchandise", "Collectible", "Event Ticket"
    );
    private final MarketplaceListingRepository listings;
    private final UserRepository users;
    private final BigDecimal resaleMultiplier;

    public MarketplaceService(
            MarketplaceListingRepository listings,
            UserRepository users,
            @Value("${roup.market.max-resale-multiplier:1.2}") BigDecimal resaleMultiplier
    ) {
        this.listings = listings;
        this.users = users;
        this.resaleMultiplier = resaleMultiplier;
    }

    public List<MarketplaceListing> browse() {
        List<MarketplaceListing> result = new ArrayList<>(listings.findByStatusAndDemoTrueOrderByCreatedAtDesc("ACTIVE"));
        result.addAll(listings.findByStatusAndDemoFalseOrderByCreatedAtDesc("ACTIVE"));
        return result;
    }

    public List<MarketplaceListing> myListings(String email) {
        return listings.findBySellerIdAndDemoFalseOrderByCreatedAtDesc(requireUser(email).getId());
    }

    public List<MarketplaceListing> markets() {
        return browse();
    }

    public MarketplaceListing marketDetail(String id) {
        MarketplaceListing item = listings.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Market not found."));
        if (!item.getStatus().equals("ACTIVE")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Market not found.");
        }
        return item;
    }

    public record Summary(long availableMarkets, long activeListings, Long completedTrades,
                          BigDecimal maxResaleMultiplier) { }

    public Summary summary() {
        List<MarketplaceListing> active = browse();
        long markets = active.stream().map(item -> item.getEventName() + "|" + item.getItemName()).distinct().count();
        long liveListings = active.stream().filter(item -> !item.isDemo()).count();
        return new Summary(markets, liveListings, null, resaleMultiplier);
    }

    @Transactional
    public MarketplaceListing create(String email, ListingRequest request) {
        User owner = requireUser(email);
        validate(request);
        MarketplaceListing listing = new MarketplaceListing();
        listing.setItemName(clean(request.itemName()));
        listing.setEventName(clean(request.eventName()));
        listing.setCategory(clean(request.category()));
        listing.setDescription(cleanNullable(request.description()));
        listing.setFaceValue(money(request.faceValue()));
        listing.setAskingPrice(money(request.askingPrice()));
        listing.setQuantity(request.quantity());
        listing.setStatus("ACTIVE");
        listing.setSellerId(owner.getId());
        listing.setDemo(false);
        listing.setSellerAttested(true);
        listing.setCreatedAt(LocalDateTime.now());
        listing.setUpdatedAt(listing.getCreatedAt());
        return listings.save(listing);
    }

    @Transactional
    public MarketplaceListing update(String email, String id, ListingRequest request) {
        MarketplaceListing listing = owned(email, id);
        if (!listing.getStatus().equals("ACTIVE") && !listing.getStatus().equals("PAUSED")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active or paused listings can be edited.");
        }
        validate(request);
        listing.setItemName(clean(request.itemName()));
        listing.setEventName(clean(request.eventName()));
        listing.setCategory(clean(request.category()));
        listing.setDescription(cleanNullable(request.description()));
        listing.setFaceValue(money(request.faceValue()));
        listing.setAskingPrice(money(request.askingPrice()));
        listing.setQuantity(request.quantity());
        listing.setUpdatedAt(LocalDateTime.now());
        return listings.save(listing);
    }

    @Transactional
    public MarketplaceListing setStatus(String email, String id, String status) {
        MarketplaceListing listing = owned(email, id);
        if (!List.of("ACTIVE", "PAUSED", "REMOVED").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported listing status.");
        }
        if (listing.getStatus().equals("REMOVED")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Removed listings cannot be reopened.");
        }
        listing.setStatus(status);
        listing.setUpdatedAt(LocalDateTime.now());
        return listings.save(listing);
    }

    private User requireUser(String email) {
        User user = users.findByEmailId(email);
        if (user == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated account was not found.");
        return user;
    }

    private MarketplaceListing owned(String email, String id) {
        User user = requireUser(email);
        MarketplaceListing listing = listings.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found."));
        if (listing.isDemo() || !listing.getSellerId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own listings.");
        }
        return listing;
    }

    private void validate(ListingRequest request) {
        if (request == null || blank(request.itemName()) || request.itemName().length() > 120
                || blank(request.eventName()) || request.eventName().length() > 140
                || blank(request.category()) || request.category().length() > 40) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item name, event, and category are required.");
        }
        if (request.description() != null && request.description().length() > 1200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description must be 1,200 characters or fewer.");
        }
        if (!ALLOWED_CATEGORIES.contains(request.category().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a supported marketplace category.");
        }
        if (!request.authorizedToResell()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confirm that you are authorized to resell this item.");
        }
        if (request.faceValue() == null || request.askingPrice() == null
                || request.faceValue().signum() <= 0 || request.askingPrice().signum() <= 0
                || request.faceValue().scale() > 2 || request.askingPrice().scale() > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prices must be positive amounts with at most two decimal places.");
        }
        if (request.quantity() < 1 || request.quantity() > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be between 1 and 20.");
        }
        if (request.askingPrice().compareTo(request.faceValue().multiply(resaleMultiplier)) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Asking price exceeds the configured resale price ceiling.");
        }
    }

    private static boolean blank(String value) { return value == null || value.isBlank(); }
    private static String clean(String value) { return value.trim(); }
    private static String cleanNullable(String value) { return blank(value) ? null : value.trim(); }
    private static BigDecimal money(BigDecimal value) { return value.setScale(2, java.math.RoundingMode.UNNECESSARY); }

    public record ListingRequest(String itemName, String eventName, String category, String description,
                                 BigDecimal faceValue, BigDecimal askingPrice, int quantity,
                                 boolean authorizedToResell) { }
}
