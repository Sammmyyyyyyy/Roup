package com.backend.Auth_Svc.Dto;

import com.backend.Auth_Svc.Enum.ExpertStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class UserResponseDto {

    private String id;

    private String name;

    private String avatar;

    private String emailId;
    private ExpertStatus expertStatus;
    private BigDecimal totalBalance;
    private BigDecimal availableBalance;
    private BigDecimal reservedBalance;

    private LocalDateTime createdAt;

    private String jwt;
}
