package com.AgroVendas.AgroVendas.repository;

import com.AgroVendas.AgroVendas.model.EntregaMercadoria;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntregaMercadoriaRepository extends JpaRepository<EntregaMercadoria, Long> {
    boolean existsByMercadoriaId(Long mercadoriaId);
}
