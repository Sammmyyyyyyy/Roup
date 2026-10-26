package com.backend.Wallet_Svc.Service;

import com.backend.Wallet_Svc.Dto.FundReleaseEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.data.redis.connection.stream.ObjectRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class FundReleaseStreamConsumer implements StreamListener<String, ObjectRecord<String, String>> {

    private final WalletService walletService;
    private final ObjectMapper objectMapper;

    public FundReleaseStreamConsumer(WalletService walletService, ObjectMapper objectMapper) {
        this.walletService = walletService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(ObjectRecord<String, String> message) {
        FundReleaseEvent event = objectMapper.readValue(message.getValue(), FundReleaseEvent.class);

        walletService.releaseFunds(
                event.userId(),
                event.amount(),
                event.refId()
        );
    }
}