package com.backend.Wallet_Svc.Repository;

import com.backend.Wallet_Svc.Entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {
    boolean existsByTransactionRef(String transactionRef);
}