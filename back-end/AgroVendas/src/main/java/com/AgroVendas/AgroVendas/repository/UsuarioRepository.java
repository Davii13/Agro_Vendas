package com.AgroVendas.AgroVendas.repository;

import com.AgroVendas.AgroVendas.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);

    /** The login is compared ignoring case: phone keyboards capitalize the first letter. */
    Optional<Usuario> findByEmailIgnoreCase(String email);
}
