package com.backend.Auth_Svc.Dto;

import com.backend.Auth_Svc.Enum.ExpertStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {

    private String id;

    private String name;

    private String avatar;

    private String emailId;
    private ExpertStatus expertStatus;
    private double totalBalance;
    private double availableBalance;
    private double reservedBalance;

    private LocalDateTime createdAt;

    private String jwt;
}
