package com.backend.Auth_Svc.Controller;


import com.backend.Auth_Svc.Dto.SigninDto;
import com.backend.Auth_Svc.Dto.SignupDto;
import com.backend.Auth_Svc.Dto.UserResponseDto;
import com.backend.Auth_Svc.Service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@AllArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    public void userSignup(@RequestBody SignupDto signupDto)
    {
        userService.addUser(signupDto);
    }

    @PostMapping("/signin")
    public UserResponseDto userSignin(@RequestBody SigninDto signinDto)
    {
        return userService.loginUser(signinDto);
    }

    @PostMapping("/oauth-signin")
    public UserResponseDto oauthSignin(@RequestBody Map<String, String> request) {
        return userService.oauthLoginUser(request.get("token"));
    }

    @PostMapping("/oauth-signup")
    public UserResponseDto oauthSignup(@RequestBody String oAuthToken)
    {
        return userService.oauthAddUser(oAuthToken);
    }

}
