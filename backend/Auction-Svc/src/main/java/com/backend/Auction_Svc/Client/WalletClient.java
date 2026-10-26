package com.backend.Auction_Svc.Client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.math.BigDecimal;

@FeignClient(name = "WALLET-SVC", path = "/api/wallet")
public interface WalletClient {

    @PostMapping("/reserve")
    ResponseEntity<Boolean> reserveFunds(@RequestParam("userId") String userId, @RequestParam("amount") BigDecimal amount, @RequestParam("refId") String refId);

    @PostMapping("/release")
    ResponseEntity<Boolean> releaseFunds(@RequestParam("userId") String userId, @RequestParam("amount") BigDecimal amount, @RequestParam("refId") String refId);
}