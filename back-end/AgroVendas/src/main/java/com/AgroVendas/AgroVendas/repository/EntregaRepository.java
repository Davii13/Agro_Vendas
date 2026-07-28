package com.AgroVendas.AgroVendas.repository;

import com.AgroVendas.AgroVendas.model.Entrega;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EntregaRepository extends JpaRepository<Entrega, Long> {
    List<Entrega> findByFornecedorId(Long fornecedorId);
}
