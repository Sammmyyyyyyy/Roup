package com.backend.Auth_Svc.Repository;

import com.backend.Auth_Svc.Entity.MarketplaceListing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketplaceListingRepository extends JpaRepository<MarketplaceListing, String> {
    List<MarketplaceListing> findByStatusAndDemoFalseOrderByCreatedAtDesc(String status);
    List<MarketplaceListing> findByStatusAndDemoTrueOrderByCreatedAtDesc(String status);
    List<MarketplaceListing> findBySellerIdAndDemoFalseOrderByCreatedAtDesc(String sellerId);
    long countByStatusAndDemoFalse(String status);
}
