package com.AgroVendas.AgroVendas.controller;

import com.AgroVendas.AgroVendas.dto.AuthResponseDTO;
import com.AgroVendas.AgroVendas.dto.LoginRequestDTO;
import com.AgroVendas.AgroVendas.dto.UserDTO;
import com.AgroVendas.AgroVendas.exception.AuthException;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.service.AuthService;
import com.AgroVendas.AgroVendas.service.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://172.19.224.1:3000", "http://localhost:5500", "http://127.0.0.1:5500"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        try {
            AuthResponseDTO response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (AuthException e) {
            return ResponseEntity.status(401).body(Map.of("erro", e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Refresh token obrigatório"));
            }

            AuthResponseDTO response = authService.refresh(refreshToken);
            return ResponseEntity.ok(response);
        } catch (AuthException e) {
            return ResponseEntity.status(401).body(Map.of("erro", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Refresh token obrigatório"));
            }

            authService.logout(refreshToken);
            return ResponseEntity.ok(Map.of("mensagem", "Logout realizado com sucesso"));
        } catch (AuthException e) {
            return ResponseEntity.status(401).body(Map.of("erro", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof Usuario)) {
            return ResponseEntity.status(401).build();
        }

        Usuario usuario = (Usuario) auth.getPrincipal();
        return ResponseEntity.ok(UserDTO.fromUsuario(usuario));
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<?> handleAuthException(AuthException e) {
        Map<String, String> erro = new HashMap<>();
        erro.put("erro", e.getMessage());
        return ResponseEntity.status(401).body(erro);
    }
}
