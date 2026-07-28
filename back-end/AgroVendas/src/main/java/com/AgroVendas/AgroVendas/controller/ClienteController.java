package com.AgroVendas.AgroVendas.controller;

import com.AgroVendas.AgroVendas.dto.ClienteDTO;
import com.AgroVendas.AgroVendas.dto.ClienteDetalheDTO;
import com.AgroVendas.AgroVendas.model.Cliente;
import com.AgroVendas.AgroVendas.service.ClienteService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5500", "http://127.0.0.1:5500"})
public class ClienteController {
    private final ClienteService service;
    public ClienteController(ClienteService service) { this.service = service; }
    @GetMapping public List<Cliente> listar(@RequestParam(required = false) String busca) { return service.listar(busca); }
    @GetMapping("/{id}") public ClienteDetalheDTO detalhes(@PathVariable Long id) { return service.detalhes(id); }
    @PostMapping public Cliente criar(@RequestBody ClienteDTO dto) { return service.salvar(dto); }
    @PutMapping("/{id}") public Cliente atualizar(@PathVariable Long id, @RequestBody ClienteDTO dto) { return service.atualizar(id, dto); }
    @DeleteMapping("/{id}") public void excluir(@PathVariable Long id) { service.excluir(id); }
}
