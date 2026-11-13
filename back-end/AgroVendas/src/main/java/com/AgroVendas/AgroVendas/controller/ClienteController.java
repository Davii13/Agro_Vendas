package com.AgroVendas.AgroVendas.controller;

import com.AgroVendas.AgroVendas.dto.ClienteDTO;
import com.AgroVendas.AgroVendas.dto.ClienteDetalheDTO;
import com.AgroVendas.AgroVendas.model.Cliente;
import com.AgroVendas.AgroVendas.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@PreAuthorize("isAuthenticated()")
public class ClienteController {
    private final ClienteService service;
    public ClienteController(ClienteService service) { this.service = service; }
    @GetMapping public List<Cliente> listar(@RequestParam(required = false) String busca) { return service.listar(busca); }
    @GetMapping("/{id}") public ClienteDetalheDTO detalhes(@PathVariable Long id) { return service.detalhes(id); }
    @PostMapping public Cliente criar(@Valid @RequestBody ClienteDTO dto) { return service.salvar(dto); }
    @PutMapping("/{id}") public Cliente atualizar(@PathVariable Long id, @Valid @RequestBody ClienteDTO dto) { return service.atualizar(id, dto); }
    @DeleteMapping("/{id}") public void excluir(@PathVariable Long id) { service.excluir(id); }
}
