package com.backend.Auth_Svc.Repository;

import com.backend.Auth_Svc.Entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    User findByEmailId(String emailId);

    boolean existsByEmailId(@Email @NotBlank String emailId);
}