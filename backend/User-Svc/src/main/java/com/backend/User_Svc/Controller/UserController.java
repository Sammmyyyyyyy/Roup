package com.backend.User_Svc.Controller;

import com.backend.User_Svc.UserService.UserService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@AllArgsConstructor
@RestController
@RequestMapping("/api/u")
public class UserController {
    private final UserService userService;



}
