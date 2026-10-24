package com.backend.Auth_Svc.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SigninDto {
    private String emailId;
    private String password;
}
