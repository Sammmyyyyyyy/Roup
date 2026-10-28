package com.backend.Wallet_Svc.Controller;

import com.backend.Wallet_Svc.Service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }


    @PostMapping("/recharge")
    public ResponseEntity<String> rechargeWallet(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam BigDecimal amount,
            @RequestParam String refId) {

        boolean success = walletService.rechargeWallet(userId, amount, refId);
        if (success) {
            return ResponseEntity.ok("Wallet successfully recharged.");
        } else {
            return ResponseEntity.badRequest().body("Wallet recharge failed.");
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<String> withdrawFunds(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam BigDecimal amount,
            @RequestParam String refId) {

        boolean success = walletService.withdrawFunds(userId, amount, refId);
        if (success) {
            return ResponseEntity.ok("Withdrawal successful.");
        } else {
            return ResponseEntity.badRequest().body("Withdrawal failed: Insufficient unreserved balance.");
        }
    }


    // Called synchronously by Feign client to validate and reserve before queueing the bid
    @PostMapping("/reserve")
    public ResponseEntity<Boolean> reserveFunds(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam BigDecimal amount,
            @RequestParam String refId) {

        boolean success = walletService.reserveFunds(userId, amount, refId);
        return ResponseEntity.ok(success);
    }

    // Called asynchronously when a bid is rejected, cancelled, or outbid
    @PostMapping("/release")
    public ResponseEntity<Boolean> releaseFunds(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam BigDecimal amount,
            @RequestParam String refId) {

        boolean success = walletService.releaseFunds(userId, amount, refId);
        return ResponseEntity.ok(success);
    }

    // Called asynchronously by Orders Service when moving to SETTLEMENT_PENDING/ESCROWED
    @PostMapping("/escrow/deduct")
    public ResponseEntity<Boolean> deductForEscrow(
            @RequestHeader("X-User-Id") String buyerId,
            @RequestParam BigDecimal amount,
            @RequestParam String refId) {

        boolean success = walletService.deductForEscrow(buyerId, amount, refId);
        return ResponseEntity.ok(success);
    }

    // Called asynchronously by Orders Service upon delivery confirmation
    @PostMapping("/escrow/settle")
    public ResponseEntity<Boolean> settleSellerPayment(
            @RequestHeader("X-User-Id") String sellerId,
            @RequestParam BigDecimal amount,
            @RequestParam String refId) {

        boolean success = walletService.settleSellerPayment(sellerId, amount, refId);
        return ResponseEntity.ok(success);
    }
}