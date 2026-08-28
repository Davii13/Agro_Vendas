package com.AgroVendas.AgroVendas.controller;



import com.AgroVendas.AgroVendas.dto.EntregaDTO;
import com.AgroVendas.AgroVendas.model.Entrega;
import com.AgroVendas.AgroVendas.service.EntregaService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(
        origins = {
                "http://127.0.0.1:5500",
                "http://localhost:5500",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://172.19.224.1:3000"
        }
)
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
    public Entrega criar(@PathVariable Long id, @RequestBody EntregaDTO dto) {
        return service.salvar(id, dto);
    }

    @DeleteMapping("/entregas/{id}")
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }
}

