package com.AgroVendas.AgroVendas.service;



import com.AgroVendas.AgroVendas.dto.FornecedorDTO;
import com.AgroVendas.AgroVendas.model.Fornecedor;
import com.AgroVendas.AgroVendas.repository.FornecedorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FornecedorService {

    private final FornecedorRepository repository;

    public FornecedorService(FornecedorRepository repository) {
        this.repository = repository;
    }

    public Fornecedor salvar(FornecedorDTO dto) {
        Fornecedor f = new Fornecedor();
        f.setNome(dto.getNome());
        f.setAreaCeasa(dto.getAreaCeasa());
        return repository.save(f);
    }

    public Fornecedor atualizar(Long id, FornecedorDTO dto) {
        Fornecedor f = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));
        f.setNome(dto.getNome());
        f.setAreaCeasa(dto.getAreaCeasa());
        return repository.save(f);
    }

    public List<Fornecedor> listar() {
        return repository.findAll();
    }

    public void excluir(Long id) {
        repository.deleteById(id);
    }
}

