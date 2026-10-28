package com.backend.Auth_Svc.Service;

import com.backend.Auth_Svc.Dto.SigninDto;
import com.backend.Auth_Svc.Dto.SignupDto;
import com.backend.Auth_Svc.Dto.UserResponseDto;
import com.backend.Auth_Svc.Entity.User;
import com.backend.Auth_Svc.Enum.ExpertStatus;
import com.backend.Auth_Svc.Repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JWTService jwtService;

    public void addUser(SignupDto signupDto) {
        if (userRepository.existsByEmailId(signupDto.getEmailId())) {
            log.error("Account already exists for email id : {}", signupDto.getEmailId());
            throw new BadCredentialsException("Email Id already registered");
        }

        User user = new User();
        user.setName(signupDto.getName());
        user.setEmailId(signupDto.getEmailId());
        user.setPassword(bCryptPasswordEncoder.encode(signupDto.getPassword()));

        user.setExpertStatus(ExpertStatus.NOT_REGISTERED);
        user.setTotalBalance(BigDecimal.valueOf(0.0));
        user.setAvailableBalance(BigDecimal.valueOf(0.0));
        user.setReservedBalance(BigDecimal.valueOf(0.0));
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);
    }

    public UserResponseDto loginUser(SigninDto signinDto) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(signinDto.getEmailId(), signinDto.getPassword())
        );

        User user = userRepository.findByEmailId(signinDto.getEmailId());

        return mapToUserResponseDto(user, jwtService.generateToken(signinDto.getEmailId(), user.getId()));
    }

    public UserResponseDto oauthLoginUser(String token) {
        String emailId = jwtService.extractUsername(token);
        User user = userRepository.findByEmailId(emailId);

        if (user == null) {
            log.error("Account doesn't exist for email id : {}", emailId);
            throw new BadCredentialsException("User not found");
        }

        return mapToUserResponseDto(user, token);
    }

    public UserResponseDto oauthAddUser(String oAuthToken) {
        String emailId = jwtService.extractUsername(oAuthToken);
        User user = userRepository.findByEmailId(emailId);

        if (user == null) {
            log.error("Account doesn't exist for email id : {}", emailId);
            throw new BadCredentialsException("Email Id not registered");
        }

        userRepository.save(user);

        return mapToUserResponseDto(user, oAuthToken);
    }

    private UserResponseDto mapToUserResponseDto(User user, String token) {
        UserResponseDto response = new UserResponseDto();

        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmailId(user.getEmailId());
        response.setAvatar(user.getAvatar());
        response.setExpertStatus(user.getExpertStatus());
        response.setTotalBalance(user.getTotalBalance());
        response.setAvailableBalance(user.getAvailableBalance());
        response.setReservedBalance(user.getReservedBalance());
        response.setCreatedAt(user.getCreatedAt());
        response.setJwt(token);

        return response;
    }
}