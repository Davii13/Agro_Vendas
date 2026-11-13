package com.AgroVendas.AgroVendas.controller;


import com.AgroVendas.AgroVendas.dto.FornecedorDTO;
import com.AgroVendas.AgroVendas.model.Fornecedor;
import com.AgroVendas.AgroVendas.service.FornecedorService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/fornecedores")
@PreAuthorize("isAuthenticated()")
public class FornecedorController {

    private final FornecedorService service;

    public FornecedorController(FornecedorService service) {
        this.service = service;
    }

    @GetMapping
    public List<Fornecedor> listar() {
        return service.listar();
    }

    @PostMapping
    public Fornecedor criar(@Valid @RequestBody FornecedorDTO dto) {
        return service.salvar(dto);
    }

    @PutMapping("/{id}")
    public Fornecedor atualizar(@PathVariable Long id, @Valid @RequestBody FornecedorDTO dto) {
        return service.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
