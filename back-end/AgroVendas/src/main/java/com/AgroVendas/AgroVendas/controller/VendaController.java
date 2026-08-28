package com.AgroVendas.AgroVendas.controller;

import com.AgroVendas.AgroVendas.dto.VendaDTO;
import com.AgroVendas.AgroVendas.model.Venda;
import com.AgroVendas.AgroVendas.service.VendaService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/vendas")
@CrossOrigin(
    origins = {
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.19.224.1:3000"
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
@PreAuthorize("isAuthenticated()")
public class VendaController {

    private final VendaService vendaService;

    public VendaController(VendaService vendaService) {
        this.vendaService = vendaService;
    }

    @PostMapping
    public Venda salvar(@RequestBody VendaDTO dto) {
        return vendaService.salvar(dto);
    }

    @GetMapping
    public List<Venda> listarPorData(@RequestParam(required = false) String data) {
        if (data == null) {
            return vendaService.listarTodas();
        }
        return vendaService.listarPorData(LocalDate.parse(data));
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        vendaService.excluir(id);
    }
}
