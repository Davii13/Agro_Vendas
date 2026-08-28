package com.AgroVendas.AgroVendas.controller;

import com.AgroVendas.AgroVendas.dto.AuthResponseDTO;
import com.AgroVendas.AgroVendas.dto.LoginRequestDTO;
import com.AgroVendas.AgroVendas.dto.UserDTO;
import com.AgroVendas.AgroVendas.exception.AuthException;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.repository.UsuarioRepository;
import com.AgroVendas.AgroVendas.service.AuthService;
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
    private final UsuarioRepository usuarioRepository;

    public AuthController(AuthService authService, UsuarioRepository usuarioRepository) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
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

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String senha = request.get("senha");
            String nome = request.get("nome");

            if (email == null || email.isEmpty() || senha == null || senha.isEmpty() || nome == null || nome.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Email, senha e nome são obrigatórios"));
            }

            if (usuarioRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Email já cadastrado"));
            }

            Usuario usuario = new Usuario();
            usuario.setEmail(email);
            usuario.setSenha(senha);
            usuario.setNome(nome);
            usuario.setAtivo(true);

            usuarioRepository.save(usuario);

            return ResponseEntity.status(201).body(UserDTO.fromUsuario(usuario));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erro", "Erro ao registrar: " + e.getMessage()));
        }
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<?> handleAuthException(AuthException e) {
        Map<String, String> erro = new HashMap<>();
        erro.put("erro", e.getMessage());
        return ResponseEntity.status(401).body(erro);
    }
}
