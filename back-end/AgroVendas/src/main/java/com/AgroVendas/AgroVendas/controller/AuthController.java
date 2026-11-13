package com.AgroVendas.AgroVendas.controller;

import com.AgroVendas.AgroVendas.dto.AlterarSenhaDTO;
import com.AgroVendas.AgroVendas.dto.AuthResponseDTO;
import com.AgroVendas.AgroVendas.dto.LoginRequestDTO;
import com.AgroVendas.AgroVendas.dto.UserDTO;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Login, token renewal and the caller's own account. There is deliberately no public
 * registration: accounts are created by an administrator through /api/usuarios.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request, HttpServletRequest http) {
        return ResponseEntity.ok(authService.login(request, http.getRemoteAddr()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Refresh token obrigatório"));
        }
        return ResponseEntity.ok(authService.refresh(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken != null && !refreshToken.isEmpty()) {
            authService.logout(refreshToken);
        }
        return ResponseEntity.ok(Map.of("mensagem", "Logout realizado com sucesso"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> me() {
        return ResponseEntity.ok(UserDTO.fromUsuario(usuarioAutenticado()));
    }

    /** Changes the caller's own password. All of the account's sessions end, so the client must log in again. */
    @PutMapping("/me/password")
    public ResponseEntity<?> alterarPropriaSenha(@RequestBody AlterarSenhaDTO request, HttpServletRequest http) {
        authService.alterarPropriaSenha(usuarioAutenticado().getId(), request.getSenhaAtual(),
                request.getNovaSenha(), http.getRemoteAddr());
        return ResponseEntity.ok(Map.of("mensagem", "Senha alterada. Entre novamente."));
    }

    private Usuario usuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (Usuario) auth.getPrincipal();
    }
}
