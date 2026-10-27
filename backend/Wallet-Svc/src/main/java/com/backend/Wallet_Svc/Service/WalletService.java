package com.backend.Wallet_Svc.Service;

import com.backend.Wallet_Svc.Entity.LedgerEntry;
import com.backend.Wallet_Svc.Repository.LedgerEntryRepository;
import com.backend.Wallet_Svc.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class WalletService {

    private final UserRepository userRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    public WalletService(UserRepository userRepository, LedgerEntryRepository ledgerEntryRepository) {
        this.userRepository = userRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
    }

    @Transactional
    public boolean rechargeWallet(String userId, BigDecimal amount, String refId) {
        if (ledgerEntryRepository.existsByTransactionRef(refId)) return true; // Idempotency check

        int updatedRows = userRepository.rechargeWallet(userId, amount);
        if (updatedRows == 0) return false;

        // Ledger: Money enters the system from a payment gateway into the user's available balance
        recordLedger(refId, "SYSTEM_PAYMENT_GATEWAY", "USER_UNRESERVED_" + userId, amount);
        return true;
    }

    // Withdraw Funds
    @Transactional
    public boolean withdrawFunds(String userId, BigDecimal amount, String refId) {
        if (ledgerEntryRepository.existsByTransactionRef(refId)) return true; // Idempotency check

        int updatedRows = userRepository.withdrawFromWallet(userId, amount);
        if (updatedRows == 0) return false; // Insufficient funds

        // Ledger: Money leaves the user's available balance to an external bank/withdrawal pool
        recordLedger(refId, "USER_UNRESERVED_" + userId, "SYSTEM_BANK_WITHDRAWAL", amount);
        return true;
    }

    @Transactional
    public boolean reserveFunds(String userId, BigDecimal amount, String refId) {
        if (ledgerEntryRepository.existsByTransactionRef(refId)) return true; // Idempotency check

        int updatedRows = userRepository.reserveFunds(userId, amount);
        if (updatedRows == 0) return false;

        recordLedger(refId, "USER_UNRESERVED_" + userId, "USER_RESERVED_" + userId, amount);
        return true;
    }

    @Transactional
    public boolean releaseFunds(String userId, BigDecimal amount, String refId) {
        if (ledgerEntryRepository.existsByTransactionRef(refId)) return true; // Idempotency check

        int updatedRows = userRepository.releaseReservedFunds(userId, amount);
        if (updatedRows == 0) return false;

        recordLedger(refId, "USER_RESERVED_" + userId, "USER_UNRESERVED_" + userId, amount);
        return true;
    }

    @Transactional
    public boolean deductForEscrow(String buyerId, BigDecimal amount, String refId) {
        if (ledgerEntryRepository.existsByTransactionRef(refId)) return true; // Idempotency check

        int updatedRows = userRepository.deductReservedForEscrow(buyerId, amount);
        if (updatedRows == 0) return false;

        recordLedger(refId, "USER_RESERVED_" + buyerId, "SYSTEM_ESCROW_POOL", amount);
        return true;
    }

    @Transactional
    public boolean settleSellerPayment(String sellerId, BigDecimal amount, String refId) {
        if (ledgerEntryRepository.existsByTransactionRef(refId)) return true; // Idempotency check

        userRepository.creditSellerFunds(sellerId, amount);
        recordLedger(refId, "SYSTEM_ESCROW_POOL", "USER_UNRESERVED_" + sellerId, amount);
        return true;
    }

    private void recordLedger(String refId, String from, String to, BigDecimal amount) {
        LedgerEntry entry = new LedgerEntry();
        entry.setTransactionRef(refId);
        entry.setFromAccount(from);
        entry.setToAccount(to);
        entry.setAmount(amount);
        entry.setCreatedAt(LocalDateTime.now());
        ledgerEntryRepository.save(entry);
    }
}