package com.AgroVendas.AgroVendas.repository;

import com.AgroVendas.AgroVendas.model.Venda;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface VendaRepository extends JpaRepository<Venda, Long> {

    List<Venda> findByData(LocalDate data);
    List<Venda> findByClienteCadastroIdOrderByDataDesc(Long clienteId);
}
