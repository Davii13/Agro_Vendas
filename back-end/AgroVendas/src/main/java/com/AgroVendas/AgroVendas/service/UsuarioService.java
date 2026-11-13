package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.dto.UserDTO;
import com.AgroVendas.AgroVendas.exception.ResourceNotFoundException;
import com.AgroVendas.AgroVendas.model.Role;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.repository.RefreshTokenRepository;
import com.AgroVendas.AgroVendas.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/** Account administration. Every method here is reachable only by an ADMIN (see SecurityConfig). */
@Service
@Transactional
public class UsuarioService {

    /**
     * The login does not have to be an e-mail address: someone without one can use a plain user name.
     * Only a safe alphabet is allowed (no spaces, no markup characters).
     */
    private static final Pattern LOGIN = Pattern.compile("^[A-Za-z0-9._@+\\-]{3,150}$");

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public UsuarioService(UsuarioRepository usuarioRepository, RefreshTokenRepository refreshTokenRepository) {
        this.usuarioRepository = usuarioRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public Usuario criarUsuario(String email, String senha, String nome, Role role) {
        String emailLimpo = email == null ? "" : email.trim();
        if (!LOGIN.matcher(emailLimpo).matches()) {
            throw new IllegalArgumentException(
                    "Login inválido: use de 3 a 150 caracteres entre letras, números e . _ - @ + (sem espaços)");
        }
        String nomeLimpo = nome == null ? "" : nome.trim();
        if (nomeLimpo.isEmpty() || nomeLimpo.length() > 150) {
            throw new IllegalArgumentException("Nome é obrigatório e deve ter até 150 caracteres");
        }
        PasswordPolicy.validar(senha, emailLimpo);
        if (usuarioRepository.findByEmailIgnoreCase(emailLimpo).isPresent()) {
            throw new IllegalArgumentException("Já existe um usuário com este login");
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(emailLimpo);
        usuario.setSenha(senha);
        usuario.setNome(nomeLimpo);
        usuario.setAtivo(true);
        usuario.setRole(role == null ? Role.OPERADOR : role);
        usuario.setCriadoEm(LocalDateTime.now());
        usuario.setAtualizadoEm(LocalDateTime.now());
        return usuarioRepository.save(usuario);
    }

    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    public List<UserDTO> listar() {
        return usuarioRepository.findAll().stream().map(UserDTO::fromUsuario).collect(Collectors.toList());
    }

    public Usuario atualizar(Long id, String nome, Role novoPapel) {
        Usuario usuario = buscarPorId(id);
        String nomeLimpo = nome == null ? "" : nome.trim();
        if (nomeLimpo.isEmpty() || nomeLimpo.length() > 150) {
            throw new IllegalArgumentException("Nome é obrigatório e deve ter até 150 caracteres");
        }
        usuario.setNome(nomeLimpo);
        if (novoPapel != null && novoPapel != usuario.getRole()) {
            if (usuario.getRole() == Role.ADMIN) {
                garantirOutroAdminAtivo(usuario);
            }
            usuario.setRole(novoPapel);
        }
        usuario.setAtualizadoEm(LocalDateTime.now());
        return usuarioRepository.save(usuario);
    }

    public void desativar(Long id, Long idQuemExecuta) {
        Usuario usuario = buscarPorId(id);
        if (usuario.getId().equals(idQuemExecuta)) {
            throw new IllegalArgumentException("Você não pode desativar a própria conta");
        }
        if (usuario.getRole() == Role.ADMIN) {
            garantirOutroAdminAtivo(usuario);
        }
        usuario.setAtivo(false);
        usuario.invalidarTokens();
        usuario.setAtualizadoEm(LocalDateTime.now());
        usuarioRepository.save(usuario);
        refreshTokenRepository.revogarTodosDoUsuario(usuario.getId());
    }

    public void ativar(Long id) {
        Usuario usuario = buscarPorId(id);
        usuario.setAtivo(true);
        usuario.setAtualizadoEm(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    /** An administrator sets a new password for someone else. The account's sessions end immediately. */
    public void redefinirSenha(Long id, String novaSenha) {
        Usuario usuario = buscarPorId(id);
        PasswordPolicy.validar(novaSenha, usuario.getEmail());
        usuario.setSenha(novaSenha);
        usuario.invalidarTokens();
        usuario.setAtualizadoEm(LocalDateTime.now());
        usuarioRepository.save(usuario);
        refreshTokenRepository.revogarTodosDoUsuario(usuario.getId());
    }

    private void garantirOutroAdminAtivo(Usuario alvo) {
        boolean existeOutro = usuarioRepository.findAll().stream()
                .anyMatch(u -> !u.getId().equals(alvo.getId()) && u.getRole() == Role.ADMIN && u.estaAtivo());
        if (!existeOutro) {
            throw new IllegalArgumentException("O sistema precisa de pelo menos um administrador ativo");
        }
    }
}
