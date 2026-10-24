package com.backend.Auth_Svc.Config;

import com.backend.Auth_Svc.Entity.User;
import com.backend.Auth_Svc.Enum.ExpertStatus;
import com.backend.Auth_Svc.Repository.UserRepository;
import com.backend.Auth_Svc.Service.JWTService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JWTService jwtService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String avatar = oAuth2User.getAttribute("picture");

        User user = userRepository.findByEmailId(email);

        if (user == null) {

            user = new User();
            user.setEmailId(email);
            user.setName(name);
            user.setAvatar(avatar);
            user.setExpertStatus(ExpertStatus.NOT_REGISTERED);
            user.setTotalBalance(0.0);
            user.setAvailableBalance(0.0);
            user.setReservedBalance(0.0);
            user.setCreatedAt(LocalDateTime.now());

            userRepository.save(user);
        }

        String token = jwtService.generateToken(email);

        String targetUrl = "https://khushi-2006yadav.github.io/Arovia/oauth-success?token=" + token; // Yaha se frontend me token ko extract karns hoga
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}