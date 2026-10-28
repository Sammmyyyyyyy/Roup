package com.backend.api_gateway.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    private Mono<ResponseEntity<Map<String, Object>>> buildResponse(String serviceName) {
        return Mono.just(
                ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                        "timestamp", Instant.now().toString(),
                        "status", 503,
                        "error", "Service Unavailable",
                        "message", serviceName + " is currently slow or unavailable. Please retry shortly."
                ))
        );
    }

    @RequestMapping("/auth")
    public Mono<ResponseEntity<Map<String, Object>>> authFallback() {
        return buildResponse("Authentication Service");
    }

    @RequestMapping("/user")
    public Mono<ResponseEntity<Map<String, Object>>> userFallback() {
        return buildResponse("User Service");
    }

    @RequestMapping("/wallet")
    public Mono<ResponseEntity<Map<String, Object>>> walletFallback() {
        return buildResponse("Wallet Service");
    }

    @RequestMapping("/auction")
    public Mono<ResponseEntity<Map<String, Object>>> auctionFallback() {
        return buildResponse("Auction Service");
    }

    @RequestMapping("/orders")
    public Mono<ResponseEntity<Map<String, Object>>> ordersFallback() {
        return buildResponse("Orders Service");
    }
}