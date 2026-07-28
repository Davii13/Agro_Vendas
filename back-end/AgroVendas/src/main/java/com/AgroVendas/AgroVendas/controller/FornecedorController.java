package com.AgroVendas.AgroVendas.controller;


import com.AgroVendas.AgroVendas.dto.FornecedorDTO;
import com.AgroVendas.AgroVendas.model.Fornecedor;
import com.AgroVendas.AgroVendas.service.FornecedorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/fornecedores")
@CrossOrigin(
    origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    },
    allowedHeaders = "*",
    methods = {
        RequestMethod.GET,
        RequestMethod.POST,
        RequestMethod.PUT,
        RequestMethod.DELETE,
        RequestMethod.OPTIONS
    }
)
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
    public Fornecedor criar(@RequestBody FornecedorDTO dto) {
        return service.salvar(dto);
    }

    @PutMapping("/{id}")
    public Fornecedor atualizar(@PathVariable Long id, @RequestBody FornecedorDTO dto) {
        return service.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
