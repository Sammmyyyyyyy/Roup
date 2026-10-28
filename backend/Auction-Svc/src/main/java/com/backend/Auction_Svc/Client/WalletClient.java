package com.backend.Auction_Svc.Client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import java.math.BigDecimal;

@FeignClient(name = "wallet-service", path = "/api/wallet")
public interface WalletClient {

    @PostMapping("/reserve")
    ResponseEntity<Boolean> reserveFunds(@RequestHeader("X-User-Id") String userId, @RequestParam("amount") BigDecimal amount, @RequestParam("refId") String refId);

    @PostMapping("/release")
    ResponseEntity<Boolean> releaseFunds(@RequestHeader("X-User-Id") String userId, @RequestParam("amount") BigDecimal amount, @RequestParam("refId") String refId);
}
