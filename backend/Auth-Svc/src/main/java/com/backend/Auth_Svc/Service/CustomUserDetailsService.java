package com.backend.Auth_Svc.Service;

import com.backend.Auth_Svc.Entity.User;
import com.backend.Auth_Svc.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        User user = userRepository.findByEmailId(email);

        if (user != null) {

            return org.springframework.security.core.userdetails.User.builder()
                    .username(user.getEmailId())
                    .password(user.getPassword())
                    .build();
        }

        throw new UsernameNotFoundException("User not found with email: " + email);
    }
}