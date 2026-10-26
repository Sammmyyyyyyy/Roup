package com.backend.Auction_Svc.WebSocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final NativeWebSocketHandler nativeWebSocketHandler;

    public WebSocketConfig(NativeWebSocketHandler nativeWebSocketHandler) {
        this.nativeWebSocketHandler = nativeWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(nativeWebSocketHandler, "/ws/auctions")
                .setAllowedOrigins("*"); // In production, restrict this to your API Gateway or frontend domain
    }
}