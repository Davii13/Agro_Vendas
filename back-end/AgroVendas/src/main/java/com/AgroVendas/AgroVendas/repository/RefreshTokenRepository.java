package com.AgroVendas.AgroVendas.repository;

import com.AgroVendas.AgroVendas.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update RefreshToken r set r.revogado = true where r.usuario.id = :usuarioId and r.revogado = false")
    int revogarTodosDoUsuario(@Param("usuarioId") Long usuarioId);
}
