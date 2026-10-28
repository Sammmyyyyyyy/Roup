package com.backend.Auction_Svc.Repository;

import com.backend.Auction_Svc.Entity.SecondaryMarketPlace;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SecondaryMarketRepository extends MongoRepository<SecondaryMarketPlace, String> {
}