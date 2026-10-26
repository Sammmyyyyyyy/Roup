package com.backend.Auth_Svc.Service;

import com.backend.Auth_Svc.Entity.MarketplaceListing;
import com.backend.Auth_Svc.Entity.User;
import com.backend.Auth_Svc.Repository.MarketplaceListingRepository;
import com.backend.Auth_Svc.Repository.UserRepository;
import com.backend.Auth_Svc.Service.MarketplaceService.ListingRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarketplaceServiceTest {
    @Mock MarketplaceListingRepository listings;
    @Mock UserRepository users;

    private MarketplaceService service;

    @BeforeEach
    void setUp() {
        service = new MarketplaceService(listings, users, new BigDecimal("1.20"));
    }

    @Test
    void rejectsAskingPriceAboveConfiguredResaleCeiling() {
        User seller = new User();
        seller.setId("seller-id");
        when(users.findByEmailId("seller@example.test")).thenReturn(seller);
        ListingRequest request = new ListingRequest("Pass", "Festival", "Festival Pass", "",
                new BigDecimal("100.00"), new BigDecimal("120.01"), 1, true);

        assertThatThrownBy(() -> service.create("seller@example.test", request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("configured resale price ceiling");
        verify(listings, never()).save(any());
    }

    @Test
    void preventsOneAccountFromEditingAnotherSellersListing() {
        User caller = new User();
        caller.setId("caller-id");
        when(users.findByEmailId("caller@example.test")).thenReturn(caller);
        MarketplaceListing listing = new MarketplaceListing();
        listing.setId("listing-id");
        listing.setSellerId("different-owner-id");
        when(listings.findById("listing-id")).thenReturn(Optional.of(listing));

        assertThatThrownBy(() -> service.setStatus("caller@example.test", "listing-id", "REMOVED"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("only manage your own listings");
        verify(listings, never()).save(any());
    }

    @Test
    void rejectsUnattestedSellerInventory() {
        User seller = new User();
        seller.setId("seller-id");
        when(users.findByEmailId("seller@example.test")).thenReturn(seller);
        ListingRequest request = new ListingRequest("Pass", "Festival", "Festival Pass", "",
                new BigDecimal("100.00"), new BigDecimal("100.00"), 1, false);
        assertThatThrownBy(() -> service.create("seller@example.test", request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("authorized to resell");
        verify(listings, never()).save(any());
    }
}
