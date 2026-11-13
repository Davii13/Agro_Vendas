package com.AgroVendas.AgroVendas.controller;



import com.AgroVendas.AgroVendas.dto.EntregaDTO;
import com.AgroVendas.AgroVendas.service.EntregaService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@PreAuthorize("isAuthenticated()")
public class EntregaController {

    private final EntregaService service;

    public EntregaController(EntregaService service) {
        this.service = service;
    }

    @GetMapping("/fornecedores/{id}/entregas")
    public List<EntregaDTO> listar(@PathVariable Long id) {
    return service.listarDTOPorFornecedor(id);
}

    @PostMapping("/fornecedores/{id}/entregas")
    public EntregaDTO criar(@PathVariable Long id, @Valid @RequestBody EntregaDTO dto) {
        return service.salvar(id, dto);
    }

    @DeleteMapping("/entregas/{id}")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

