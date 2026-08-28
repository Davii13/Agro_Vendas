package com.AgroVendas.AgroVendas.controller;

import com.AgroVendas.AgroVendas.dto.UserDTO;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://172.19.224.1:3000", "http://localhost:5500", "http://127.0.0.1:5500"})
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<UserDTO> criar(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String senha = request.get("senha");
        String nome = request.get("nome");

        if (email == null || senha == null || nome == null) {
            return ResponseEntity.badRequest().build();
        }

        Usuario usuario = usuarioService.criarUsuario(email, senha, nome);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDTO.fromUsuario(usuario));
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> detalhes(@PathVariable Long id) {
        Usuario usuario = usuarioService.buscarPorId(id);
        return ResponseEntity.ok(UserDTO.fromUsuario(usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> atualizar(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String nome = request.get("nome");

        if (nome == null || nome.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Usuario usuario = usuarioService.atualizar(id, nome);
        return ResponseEntity.ok(UserDTO.fromUsuario(usuario));
    }

    @PutMapping("/{id}/desativar")
    public ResponseEntity<?> desativar(@PathVariable Long id) {
        usuarioService.desativar(id);
        return ResponseEntity.ok(Map.of("mensagem", "Usuário desativado com sucesso"));
    }

    @PutMapping("/{id}/ativar")
    public ResponseEntity<?> ativar(@PathVariable Long id) {
        usuarioService.ativar(id);
        return ResponseEntity.ok(Map.of("mensagem", "Usuário ativado com sucesso"));
    }

    @PutMapping("/{id}/alterar-senha")
    public ResponseEntity<?> alterarSenha(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String novaSenha = request.get("novaSenha");

        if (novaSenha == null || novaSenha.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Nova senha obrigatória"));
        }

        usuarioService.alterarSenha(id, novaSenha);
        return ResponseEntity.ok(Map.of("mensagem", "Senha alterada com sucesso"));
    }
}
