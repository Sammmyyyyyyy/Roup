package com.backend.Wallet_Svc.Entity;

import com.backend.Wallet_Svc.Enum.ExpertStatus;
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
    @Column(name = "id", nullable = false, updatable = false)
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