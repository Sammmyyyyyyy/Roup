package com.backend.Auction_Svc.Repository;

import com.backend.Auction_Svc.Entity.DutchAuction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DutchAuctionRepository extends MongoRepository<DutchAuction, String> {
}