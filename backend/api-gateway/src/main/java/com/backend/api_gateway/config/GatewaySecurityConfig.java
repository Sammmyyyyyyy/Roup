package com.backend.api_gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import reactor.core.publisher.Mono;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebFluxSecurity
public class GatewaySecurityConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(ServerHttpSecurity.CorsSpec::disable) // Handled by Spring Cloud Gateway global cors
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(
                                "/api/signup/**",
                                "/api/signin/**",
                                "/api/oauth-signin",
                                "/api/oauth-signup",
                                "/oauth2/**",
                                "/login/**",
                                "/ws/**",
                                "/fallback/**"
                        ).permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtDecoder(jwtDecoder())));

        return http.build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        SecretKeySpec secretKeySpec = new SecretKeySpec(keyBytes, "HmacSHA256");
        return NimbusReactiveJwtDecoder.withSecretKey(secretKeySpec).build();
    }

    @Bean
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> exchange.getPrincipal()
                .map(java.security.Principal::getName)
                .switchIfEmpty(Mono.defer(() -> {
                    String clientIp = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
                    if (clientIp == null || clientIp.isBlank()) {
                        if (exchange.getRequest().getRemoteAddress() != null) {
                            clientIp = exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
                        } else {
                            clientIp = "anonymous";
                        }
                    } else {
                        // Extract original client IP when multiple proxies append addresses
                        clientIp = clientIp.split(",")[0].trim();
                    }
                    return Mono.just(clientIp);
                }));
    }
}
