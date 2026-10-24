package com.backend.Auth_Svc.Service;


import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public  class JWTService {
    private  final String SECRET =
            "ThisIsASuperSecretKeyForJwtAuthentication123456";
    private  SecretKey getSignKey()
    {
//        byte[] keyBytes = Decoders.BASE64.decode(SECRET);
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    public String generateToken(String email)
    {
        return Jwts
                .builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60*10))
                .signWith(getSignKey())
                .compact();
    }

    public  String extractUsername(String token)
    {
        return Jwts
                .parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public Date extractExpiration(String token)
    {
        return Jwts
                .parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
    }

    public boolean isTokenExpired(String token)
    {
        return extractExpiration(token)
                .before(new Date());
    }

    public  boolean validateToken(String token,UserDetails userDetails)
    {
        String username =extractUsername(token);

        return username.equals(userDetails.getUsername())&&!isTokenExpired(token);
    }


}
