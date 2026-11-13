package com.AgroVendas.AgroVendas.repository;

import com.AgroVendas.AgroVendas.model.Mercadoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MercadoriaRepository extends JpaRepository<Mercadoria, Long> {
    Optional<Mercadoria> findByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);

    List<Mercadoria> findAllByOrderByNomeAsc();
}
