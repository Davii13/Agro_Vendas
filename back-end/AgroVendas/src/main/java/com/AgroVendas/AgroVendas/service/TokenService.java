package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class TokenService {

    @Value("${jwt.secret:SuaChaveSecretaMuitoForteComPeloMenos256BitsParaHMACSHA256SuaChaveSecretaMuitoForteComPeloMenos256Bits}")
    private String jwtSecret;

    @Value("${jwt.expiration.access:900}")
    private long accessTokenExpiration;

    @Value("${jwt.expiration.refresh:604800}")
    private long refreshTokenExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String gerarAccessToken(Usuario usuario) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", usuario.getEmail());
        claims.put("nome", usuario.getNome());

        return criarToken(claims, usuario.getId().toString(), accessTokenExpiration);
    }

    public String gerarRefreshToken(Usuario usuario) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tipo", "refresh");

        return criarToken(claims, usuario.getId().toString(), refreshTokenExpiration);
    }

    private String criarToken(Map<String, Object> claims, String subject, long expirationSeconds) {
        Date agora = new Date();
        Date dataExpiracao = new Date(agora.getTime() + expirationSeconds * 1000);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(agora)
                .expiration(dataExpiracao)
                .signWith(getSigningKey())
                .compact();
    }

    public Long extrairUsuarioId(String token) {
        Claims claims = extrairClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    public String extrairEmail(String token) {
        Claims claims = extrairClaims(token);
        return claims.get("email", String.class);
    }

    public boolean validarToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public LocalDateTime obterDataExpiracaoRefreshToken() {
        return LocalDateTime.now().plusSeconds(refreshTokenExpiration);
    }

    public long obterExpiracaoAccessTokenEmSegundos() {
        return accessTokenExpiration;
    }
}
