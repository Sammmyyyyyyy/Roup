package com.backend.Auction_Svc.WebSocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final AuctionWebSocketHandler auctionWebSocketHandler;
    private final MarketWebSocketHandler marketWebSocketHandler;

    public WebSocketConfig(AuctionWebSocketHandler auctionWebSocketHandler, MarketWebSocketHandler marketWebSocketHandler) {
        this.auctionWebSocketHandler = auctionWebSocketHandler;
        this.marketWebSocketHandler = marketWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(auctionWebSocketHandler, "/ws/auctions")
                .setAllowedOrigins("*"); // In production, restrict this to your API Gateway or frontend domain

        registry.addHandler(marketWebSocketHandler, "/ws/markets")
                .setAllowedOrigins("*");
    }

}