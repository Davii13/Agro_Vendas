package com.AgroVendas.AgroVendas.controller;

import com.AgroVendas.AgroVendas.dto.MercadoriaDTO;
import com.AgroVendas.AgroVendas.model.Mercadoria;
import com.AgroVendas.AgroVendas.service.MercadoriaService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mercadorias")
@PreAuthorize("isAuthenticated()")
public class MercadoriaController {

    private final MercadoriaService service;

    public MercadoriaController(MercadoriaService service) {
        this.service = service;
    }

    @GetMapping
    public List<Mercadoria> listar() {
        return service.listar();
    }

    @PostMapping
    public Mercadoria criar(@Valid @RequestBody MercadoriaDTO dto) {
        return service.criar(dto);
    }

    @PutMapping("/{id}")
    public Mercadoria atualizar(@PathVariable Long id, @Valid @RequestBody MercadoriaDTO dto) {
        return service.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}
