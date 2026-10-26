package com.backend.Auth_Svc.Controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class UnsupportedExchangeController {
    @GetMapping("/api/auctions")
    public Map<String, Object> auctions() {
        return Map.of("available", false, "auctions", List.of(),
                "message", "Auction scheduling and purchase validation are not implemented by the backend.");
    }

    @GetMapping("/api/orders")
    public Map<String, Object> orders() {
        return Map.of("available", false, "orders", List.of(),
                "message", "Order matching, execution, and cancellation are not implemented by the backend.");
    }
}
