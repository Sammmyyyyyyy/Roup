package com.backend.Auth_Svc.Entity;

import com.backend.Auth_Svc.Enum.ExpertStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id;

    @Column(nullable = false, unique = true)
    private String emailId;

    private String password;

    private String name;

    private String avatar;
    private ExpertStatus expertStatus;
    private BigDecimal totalBalance;
    private BigDecimal availableBalance;
    private BigDecimal reservedBalance;

    private LocalDateTime createdAt;
}