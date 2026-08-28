package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.dto.AuthResponseDTO;
import com.AgroVendas.AgroVendas.dto.LoginRequestDTO;
import com.AgroVendas.AgroVendas.dto.UserDTO;
import com.AgroVendas.AgroVendas.exception.AuthException;
import com.AgroVendas.AgroVendas.model.RefreshToken;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.repository.RefreshTokenRepository;
import com.AgroVendas.AgroVendas.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@Transactional
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenService tokenService;

    public AuthService(UsuarioRepository usuarioRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       TokenService tokenService) {
        this.usuarioRepository = usuarioRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenService = tokenService;
    }

    public AuthResponseDTO login(LoginRequestDTO request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Usuário ou senha inválidos"));

        if (!usuario.verificarSenha(request.getSenha())) {
            throw new AuthException("Usuário ou senha inválidos");
        }

        if (!usuario.getAtivo()) {
            throw new AuthException("Usuário inativo");
        }

        String accessToken = tokenService.gerarAccessToken(usuario);
        String refreshTokenStr = tokenService.gerarRefreshToken(usuario);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUsuario(usuario);
        refreshToken.setTokenHash(hashToken(refreshTokenStr));
        refreshToken.setDataExpiracao(tokenService.obterDataExpiracaoRefreshToken());
        refreshTokenRepository.save(refreshToken);

        return new AuthResponseDTO(
                accessToken,
                refreshTokenStr,
                UserDTO.fromUsuario(usuario),
                tokenService.obterExpiracaoAccessTokenEmSegundos()
        );
    }

    public AuthResponseDTO refresh(String refreshTokenStr) {
        if (!tokenService.validarToken(refreshTokenStr)) {
            throw new AuthException("Refresh token inválido ou expirado");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hashToken(refreshTokenStr))
                .orElseThrow(() -> new AuthException("Refresh token não encontrado"));

        if (!refreshToken.estaValido()) {
            throw new AuthException("Refresh token revogado ou expirado");
        }

        Usuario usuario = refreshToken.getUsuario();

        String novoAccessToken = tokenService.gerarAccessToken(usuario);

        return new AuthResponseDTO(
                novoAccessToken,
                refreshTokenStr,
                UserDTO.fromUsuario(usuario),
                tokenService.obterExpiracaoAccessTokenEmSegundos()
        );
    }

    public void logout(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hashToken(refreshTokenStr))
                .orElseThrow(() -> new AuthException("Refresh token não encontrado"));

        refreshToken.revogar();
        refreshTokenRepository.save(refreshToken);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erro ao fazer hash do token", e);
        }
    }
}
