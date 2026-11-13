package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.dto.AuthResponseDTO;
import com.AgroVendas.AgroVendas.dto.LoginRequestDTO;
import com.AgroVendas.AgroVendas.dto.UserDTO;
import com.AgroVendas.AgroVendas.exception.AuthException;
import com.AgroVendas.AgroVendas.model.RefreshToken;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.repository.RefreshTokenRepository;
import com.AgroVendas.AgroVendas.repository.UsuarioRepository;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@Transactional
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final String MENSAGEM_LOGIN = "Usuário ou senha inválidos";
    private static final int MAX_CHARS_SENHA_LOGIN = 128;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    /** Compared against when the e-mail is unknown, so a miss costs as much time as a hit. */
    private final String hashFicticio;

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenService tokenService;
    private final LoginRateLimiter rateLimiter;

    public AuthService(UsuarioRepository usuarioRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       TokenService tokenService,
                       LoginRateLimiter rateLimiter) {
        this.usuarioRepository = usuarioRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenService = tokenService;
        this.rateLimiter = rateLimiter;
        byte[] aleatorio = new byte[24];
        new SecureRandom().nextBytes(aleatorio);
        this.hashFicticio = passwordEncoder.encode(Base64.getEncoder().encodeToString(aleatorio));
    }

    public AuthResponseDTO login(LoginRequestDTO request, String ip) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        String senha = request.getSenha();

        rateLimiter.verificar(email, ip);

        if (email.isEmpty() || senha == null || senha.isEmpty() || senha.length() > MAX_CHARS_SENHA_LOGIN) {
            rateLimiter.registrarFalha(email, ip);
            throw new AuthException(MENSAGEM_LOGIN);
        }

        Optional<Usuario> encontrado = usuarioRepository.findByEmail(email);
        boolean senhaConfere = passwordEncoder.matches(senha, encontrado.map(Usuario::getSenhaHash).orElse(hashFicticio));

        if (encontrado.isEmpty() || !senhaConfere || !encontrado.get().estaAtivo()) {
            rateLimiter.registrarFalha(email, ip);
            logger.warn("Falha de autenticação a partir de {}", ip);
            throw new AuthException(MENSAGEM_LOGIN);
        }

        Usuario usuario = encontrado.get();
        rateLimiter.registrarSucesso(email);
        logger.info("Login bem-sucedido do usuário {}", usuario.getId());

        String accessToken = tokenService.gerarAccessToken(usuario);
        String refreshTokenStr = tokenService.gerarRefreshToken(usuario, request.isManterConectado());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUsuario(usuario);
        refreshToken.setTokenHash(hashToken(refreshTokenStr));
        refreshToken.setDataExpiracao(tokenService.obterDataExpiracaoRefreshToken(request.isManterConectado()));
        refreshTokenRepository.save(refreshToken);

        return new AuthResponseDTO(accessToken, refreshTokenStr, UserDTO.fromUsuario(usuario),
                tokenService.obterExpiracaoAccessTokenEmSegundos());
    }

    public AuthResponseDTO refresh(String refreshTokenStr) {
        Claims claims = tokenService.validar(refreshTokenStr, TokenService.TIPO_REFRESH)
                .orElseThrow(() -> new AuthException("Refresh token inválido ou expirado"));

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hashToken(refreshTokenStr))
                .orElseThrow(() -> new AuthException("Refresh token inválido ou expirado"));
        if (!refreshToken.estaValido()) {
            throw new AuthException("Refresh token inválido ou expirado");
        }

        Usuario usuario = refreshToken.getUsuario();
        Integer versao = claims.get("tv", Integer.class);
        if (!usuario.estaAtivo() || versao == null || !versao.equals(usuario.getTokenVersion())) {
            throw new AuthException("Refresh token inválido ou expirado");
        }

        return new AuthResponseDTO(tokenService.gerarAccessToken(usuario), refreshTokenStr, UserDTO.fromUsuario(usuario),
                tokenService.obterExpiracaoAccessTokenEmSegundos());
    }

    /** Always succeeds from the caller's point of view; unknown tokens are simply ignored. */
    public void logout(String refreshTokenStr) {
        refreshTokenRepository.findByTokenHash(hashToken(refreshTokenStr)).ifPresent(token -> {
            token.revogar();
            refreshTokenRepository.save(token);
        });
    }

    /** Changes the caller's own password. Every session of the account, including this one, ends. */
    public void alterarPropriaSenha(Long usuarioId, String senhaAtual, String novaSenha, String ip) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new AuthException("Sessão inválida"));

        rateLimiter.verificar(usuario.getEmail(), ip);
        if (senhaAtual == null || !passwordEncoder.matches(senhaAtual, usuario.getSenhaHash())) {
            rateLimiter.registrarFalha(usuario.getEmail(), ip);
            throw new IllegalArgumentException("Senha atual incorreta");
        }
        PasswordPolicy.validar(novaSenha, usuario.getEmail());
        if (passwordEncoder.matches(novaSenha, usuario.getSenhaHash())) {
            throw new IllegalArgumentException("A nova senha deve ser diferente da atual");
        }

        usuario.setSenha(novaSenha);
        usuario.setAtualizadoEm(LocalDateTime.now());
        usuario.invalidarTokens();
        usuarioRepository.save(usuario);
        refreshTokenRepository.revogarTodosDoUsuario(usuario.getId());
        rateLimiter.registrarSucesso(usuario.getEmail());
        logger.info("Senha alterada pelo próprio usuário {}", usuario.getId());
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Erro ao fazer hash do token", e);
        }
    }
}
