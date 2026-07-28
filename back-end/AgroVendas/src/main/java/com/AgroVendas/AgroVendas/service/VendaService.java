package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.dto.VendaDTO;
import com.AgroVendas.AgroVendas.dto.VendaMercadoriaDTO;
import com.AgroVendas.AgroVendas.model.Venda;
import com.AgroVendas.AgroVendas.model.VendaMercadoria;
import com.AgroVendas.AgroVendas.repository.VendaRepository;
import com.AgroVendas.AgroVendas.repository.ClienteRepository;
import com.AgroVendas.AgroVendas.model.Cliente;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class VendaService {

    private final VendaRepository vendaRepo;
    private final ClienteRepository clienteRepo;

    public VendaService(VendaRepository vendaRepo, ClienteRepository clienteRepo) {
        this.vendaRepo = vendaRepo;
        this.clienteRepo = clienteRepo;
    }

    public Venda salvar(VendaDTO dto) {

        Venda venda = new Venda();

        // EDITAR
        if (dto.getId() != null) {
            venda = vendaRepo.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Venda não encontrada"));
            venda.getMercadorias().clear(); // orphanRemoval = true resolve no banco
        }

        venda.setData(dto.getData());
        if (dto.getClienteId() != null) {
            Cliente cliente = clienteRepo.findById(dto.getClienteId())
                    .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
            venda.setClienteCadastro(cliente);
            venda.setCliente(cliente.getNome());
        } else {
            venda.setClienteCadastro(null);
            venda.setCliente(dto.getCliente() == null || dto.getCliente().isBlank()
                    ? "Cliente desconhecido" : dto.getCliente().trim());
        }
        venda.setModeloCaixa(dto.getModeloCaixa());
        venda.setQtdeCaixas6424(dto.getQtdeCaixas6424());
        venda.setCaixasPagasVale(dto.getCaixasPagasVale());
        venda.setCaixasDevendoVale(dto.getCaixasDevendoVale());
        venda.setPagamentoVerduras(dto.getPagamentoVerduras());
        venda.setValorPago(dto.getValorPago());

        for (VendaMercadoriaDTO m : dto.getMercadorias()) {
            VendaMercadoria vm = new VendaMercadoria();
            vm.setNome(m.getNome());
            vm.setQtde(m.getQtde());
            vm.setValor(m.getValor());
            vm.setVenda(venda);

            venda.getMercadorias().add(vm);
        }

        return vendaRepo.save(venda);
    }

    public List<Venda> listarPorData(LocalDate data) {
        return vendaRepo.findByData(data);
    }

    public void excluir(Long id) {
        vendaRepo.deleteById(id);
    }
}
