package com.AgroVendas.AgroVendas.config;

import com.AgroVendas.AgroVendas.repository.UsuarioRepository;
import com.AgroVendas.AgroVendas.service.TokenService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Authenticates a request from its Bearer access token. The user is reloaded from the database
 * on every request, so the role, the active flag and the token version are always current:
 * deactivating an account or changing its password takes effect immediately.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UsuarioRepository usuarioRepository;

    public JwtFilter(TokenService tokenService, UsuarioRepository usuarioRepository) {
        this.tokenService = tokenService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extrairToken(request);
        if (token != null) {
            tokenService.validar(token, TokenService.TIPO_ACCESS).ifPresent(this::autenticar);
        }
        filterChain.doFilter(request, response);
    }

    private void autenticar(Claims claims) {
        try {
            Long usuarioId = Long.parseLong(claims.getSubject());
            Integer versao = claims.get("tv", Integer.class);
            usuarioRepository.findById(usuarioId)
                    .filter(usuario -> usuario.estaAtivo())
                    .filter(usuario -> versao != null && versao.equals(usuario.getTokenVersion()))
                    .ifPresent(usuario -> {
                        var auth = new UsernamePasswordAuthenticationToken(
                                usuario, null, List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRole().name())));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
        } catch (RuntimeException e) {
            logger.debug("Token ignorado por claims inválidos");
        }
    }

    private String extrairToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        return null;
    }
}
