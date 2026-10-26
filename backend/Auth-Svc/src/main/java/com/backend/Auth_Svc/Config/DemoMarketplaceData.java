package com.backend.Auth_Svc.Config;

import com.backend.Auth_Svc.Entity.MarketplaceListing;
import com.backend.Auth_Svc.Repository.MarketplaceListingRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
@Profile("local")
public class DemoMarketplaceData {
    @Bean
    CommandLineRunner loadDemoListings(MarketplaceListingRepository repository) {
        return args -> {
            if (!repository.findByStatusAndDemoTrueOrderByCreatedAtDesc("ACTIVE").isEmpty()) return;
            LocalDateTime now = LocalDateTime.now();
            List<MarketplaceListing> examples = List.of(
                    example("3-Day Festival Pass", "North Shore Sessions", "Festival Passes", "240", "284", 1, now.minusDays(6)),
                    example("Artist Access Pass", "Solstice: High Desert", "VIP Pass", "280", "320", 2, now.minusDays(5)),
                    example("City Lights VIP", "Afterhours: City Lights", "VIP Pass", "185", "202", 1, now.minusDays(4)),
                    example("Afterglow Art Print", "Objects for the Afters", "Collectible", "85", "112", 1, now.minusDays(3)),
                    example("Night Garden Edition", "North Shore Sessions", "Collectible", "120", "138", 1, now.minusDays(2)),
                    example("Field Notes Tote", "Solstice: High Desert", "Merchandise", "48", "54", 3, now.minusDays(1))
            );
            repository.saveAll(examples);
        };
    }

    private MarketplaceListing example(String name, String event, String category, String faceValue,
                                       String askingPrice, int quantity, LocalDateTime listedAt) {
        MarketplaceListing item = new MarketplaceListing();
        item.setItemName(name);
        item.setEventName(event);
        item.setCategory(category);
        item.setDescription("Illustrative local development listing. This is not a live offer.");
        item.setFaceValue(new BigDecimal(faceValue));
        item.setAskingPrice(new BigDecimal(askingPrice));
        item.setQuantity(quantity);
        item.setStatus("ACTIVE");
        item.setSellerId("__demo_catalog__");
        item.setDemo(true);
        item.setCreatedAt(listedAt);
        item.setUpdatedAt(listedAt);
        return item;
    }
}
