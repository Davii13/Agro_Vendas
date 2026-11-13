package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

/**
 * Issues and validates the two kinds of JWT the API uses. An access token authenticates
 * requests; a refresh token can only be exchanged for a new access token. The kind is a signed
 * claim, so one can never be used as the other.
 */
@Service
public class TokenService {

    public static final String TIPO_ACCESS = "access";
    public static final String TIPO_REFRESH = "refresh";

    private static final String ISSUER = "agrovendas-api";
    private static final String AUDIENCE = "agrovendas-web";
    private static final int MIN_SECRET_BYTES = 64;

    private final SecretKey signingKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;
    private final long refreshTokenExpirationExtended;

    public TokenService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration.access:900}") long accessTokenExpiration,
            @Value("${jwt.expiration.refresh:604800}") long refreshTokenExpiration,
            @Value("${jwt.expiration.refresh.extended:2592000}") long refreshTokenExpirationExtended) {
        this.signingKey = chaveValida(secret);
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.refreshTokenExpirationExtended = refreshTokenExpirationExtended;
    }

    private static SecretKey chaveValida(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET não configurado. Defina uma chave aleatória de pelo menos "
                    + MIN_SECRET_BYTES + " bytes.");
        }
        // The key that used to ship as the default is public (it lives in the repository history),
        // so it must never be accepted again, whatever the environment says.
        if (secret.startsWith("SuaChaveSecreta")) {
            throw new IllegalStateException("JWT_SECRET usa o valor padrão que foi publicado no repositório. "
                    + "Gere uma nova chave aleatória.");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("JWT_SECRET muito curto: use pelo menos " + MIN_SECRET_BYTES + " bytes.");
        }
        return Keys.hmacShaKeyFor(bytes);
    }

    public String gerarAccessToken(Usuario usuario) {
        return criarToken(usuario, TIPO_ACCESS, accessTokenExpiration);
    }

    public String gerarRefreshToken(Usuario usuario, boolean manterConectado) {
        return criarToken(usuario, TIPO_REFRESH, manterConectado ? refreshTokenExpirationExtended : refreshTokenExpiration);
    }

    private String criarToken(Usuario usuario, String tipo, long expirationSeconds) {
        Date agora = new Date();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(ISSUER)
                .audience().add(AUDIENCE).and()
                .subject(usuario.getId().toString())
                .claim("tipo", tipo)
                .claim("tv", usuario.getTokenVersion())
                .issuedAt(agora)
                .expiration(new Date(agora.getTime() + expirationSeconds * 1000))
                .signWith(signingKey)
                .compact();
    }

    /** Returns the claims only when signature, expiry, issuer, audience and token kind all check out. */
    public Optional<Claims> validar(String token, String tipoEsperado) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .requireIssuer(ISSUER)
                    .requireAudience(AUDIENCE)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            if (!tipoEsperado.equals(claims.get("tipo", String.class))) {
                return Optional.empty();
            }
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public LocalDateTime obterDataExpiracaoRefreshToken(boolean manterConectado) {
        return LocalDateTime.now().plusSeconds(manterConectado ? refreshTokenExpirationExtended : refreshTokenExpiration);
    }

    public long obterExpiracaoAccessTokenEmSegundos() {
        return accessTokenExpiration;
    }
}
