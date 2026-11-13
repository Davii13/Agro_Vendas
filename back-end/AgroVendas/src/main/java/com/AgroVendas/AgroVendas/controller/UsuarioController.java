package com.AgroVendas.AgroVendas.controller;

import com.AgroVendas.AgroVendas.dto.UserDTO;
import com.AgroVendas.AgroVendas.model.Role;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Account administration. ADMIN only: enforced in SecurityConfig and again here. */
@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<UserDTO> criar(@RequestBody Map<String, String> request) {
        Role role = lerPapel(request.get("role"));
        Usuario usuario = usuarioService.criarUsuario(request.get("email"), request.get("senha"), request.get("nome"), role);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDTO.fromUsuario(usuario));
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> detalhes(@PathVariable Long id) {
        return ResponseEntity.ok(UserDTO.fromUsuario(usuarioService.buscarPorId(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> atualizar(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Usuario usuario = usuarioService.atualizar(id, request.get("nome"), lerPapel(request.get("role")));
        return ResponseEntity.ok(UserDTO.fromUsuario(usuario));
    }

    @PutMapping("/{id}/desativar")
    public ResponseEntity<?> desativar(@PathVariable Long id) {
        usuarioService.desativar(id, idDeQuemExecuta());
        return ResponseEntity.ok(Map.of("mensagem", "Usuário desativado com sucesso"));
    }

    @PutMapping("/{id}/ativar")
    public ResponseEntity<?> ativar(@PathVariable Long id) {
        usuarioService.ativar(id);
        return ResponseEntity.ok(Map.of("mensagem", "Usuário ativado com sucesso"));
    }

    @PutMapping("/{id}/redefinir-senha")
    public ResponseEntity<?> redefinirSenha(@PathVariable Long id, @RequestBody Map<String, String> request) {
        usuarioService.redefinirSenha(id, request.get("novaSenha"));
        return ResponseEntity.ok(Map.of("mensagem", "Senha redefinida. As sessões do usuário foram encerradas."));
    }

    private Role lerPapel(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return Role.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Papel inválido. Use ADMIN ou OPERADOR");
        }
    }

    private Long idDeQuemExecuta() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ((Usuario) auth.getPrincipal()).getId();
    }
}
