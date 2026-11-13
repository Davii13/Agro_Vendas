package com.AgroVendas.AgroVendas.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    private static final PasswordEncoder ENCODER = new BCryptPasswordEncoder();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 255)
    private String senhaHash;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.OPERADOR;

    /**
     * Bumped whenever the account's credentials or status change (password change or reset,
     * deactivation). Every token carries the version it was issued under, so bumping it
     * invalidates all outstanding access and refresh tokens at once.
     */
    @Column(name = "token_version", nullable = false)
    private Integer tokenVersion = 0;

    @Column(name = "criado_em")
    private LocalDateTime criadoEm = LocalDateTime.now();

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    public void setSenha(String senha) {
        this.senhaHash = ENCODER.encode(senha);
    }

    public boolean estaAtivo() {
        return Boolean.TRUE.equals(ativo);
    }

    public void invalidarTokens() {
        this.tokenVersion = (tokenVersion == null ? 0 : tokenVersion) + 1;
    }
}
