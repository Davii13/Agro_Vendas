package com.AgroVendas.AgroVendas.repository;

import com.AgroVendas.AgroVendas.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findTop20ByNomeContainingIgnoreCaseOrderByNomeAsc(String busca);
    boolean existsByCpfCnpjAndIdNot(String cpfCnpj, Long id);
    boolean existsByCpfCnpj(String cpfCnpj);
}
