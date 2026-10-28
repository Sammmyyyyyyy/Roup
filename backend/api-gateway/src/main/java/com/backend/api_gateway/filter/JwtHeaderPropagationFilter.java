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
                        // Extract the custom claim we added in the Auth Service
                        String userId = jwt.getClaimAsString("userId");

                        // Mutate the request to append the exact header your controllers expect
                        ServerWebExchange mutatedExchange = exchange.mutate()
                                .request(r -> r.header("X-User-Id", userId))
                                .build();

                        return chain.filter(mutatedExchange);
                    }
                    return chain.filter(exchange);
                })
                .switchIfEmpty(chain.filter(exchange));
    }
}