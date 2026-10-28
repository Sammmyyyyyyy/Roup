package com.backend.api_gateway.filter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Configuration
public class JwtHeaderPropagationFilter implements GlobalFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
                .filter(c -> c.getAuthentication() != null)
                .flatMap(c -> {
                    Object principal = c.getAuthentication().getPrincipal();
                    if (principal instanceof Jwt jwt) {
                        // 1. Extract the authentic ID from the cryptographically verified JWT payload
                        String trustedUserId = jwt.getClaimAsString("userId");

                        // 2. Mutate the request: strip whatever the client sent, then write the verified ID
                        ServerWebExchange mutatedExchange = exchange.mutate()
                                .request(r -> r
                                        .headers(h -> h.remove("X-User-Id"))
                                        // Injects extracted strictly from the token
                                        .header("X-User-Id", trustedUserId)
                                )
                                .build();

                        return chain.filter(mutatedExchange);
                    }
                    return chain.filter(exchange);
                })
                .switchIfEmpty(chain.filter(exchange));
    }
}