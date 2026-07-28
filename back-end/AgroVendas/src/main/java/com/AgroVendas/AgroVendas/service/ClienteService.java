package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.dto.ClienteDTO;
import com.AgroVendas.AgroVendas.dto.ClienteDetalheDTO;
import com.AgroVendas.AgroVendas.model.Cliente;
import com.AgroVendas.AgroVendas.model.Venda;
import com.AgroVendas.AgroVendas.repository.ClienteRepository;
import com.AgroVendas.AgroVendas.repository.VendaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ClienteService {
    private final ClienteRepository clientes;
    private final VendaRepository vendas;

    public ClienteService(ClienteRepository clientes, VendaRepository vendas) {
        this.clientes = clientes;
        this.vendas = vendas;
    }

    public List<Cliente> listar(String busca) {
        return busca == null || busca.isBlank() ? clientes.findAll() : clientes.findTop20ByNomeContainingIgnoreCaseOrderByNomeAsc(busca.trim());
    }

    public Cliente salvar(ClienteDTO dto) { return clientes.save(preencher(new Cliente(), dto)); }

    public Cliente atualizar(Long id, ClienteDTO dto) {
        return clientes.save(preencher(encontrar(id), dto));
    }

    public ClienteDetalheDTO detalhes(Long id) {
        Cliente cliente = encontrar(id);
        return new ClienteDetalheDTO(cliente, vendas.findByClienteCadastroIdOrderByDataDesc(id));
    }

    @Transactional
    public void excluir(Long id) {
        Cliente cliente = encontrar(id);
        List<Venda> historico = vendas.findByClienteCadastroIdOrderByDataDesc(id);
        historico.forEach(venda -> venda.setClienteCadastro(null));
        vendas.saveAll(historico); // preserves the customer name snapshot on each sale
        clientes.delete(cliente);
    }

    private Cliente encontrar(Long id) {
        return clientes.findById(id).orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
    }

    private Cliente preencher(Cliente cliente, ClienteDTO dto) {
        if (dto.getNome() == null || dto.getNome().isBlank()) throw new IllegalArgumentException("Nome do cliente é obrigatório");
        String documento = vazioParaNulo(dto.getCpfCnpj());
        boolean documentoEmUso = documento != null && (cliente.getId() == null ? clientes.existsByCpfCnpj(documento) : clientes.existsByCpfCnpjAndIdNot(documento, cliente.getId()));
        if (documentoEmUso) throw new IllegalArgumentException("CPF/CNPJ já cadastrado");
        cliente.setNome(dto.getNome().trim());
        cliente.setTelefone(vazioParaNulo(dto.getTelefone()));
        cliente.setCpfCnpj(documento);
        cliente.setEmail(vazioParaNulo(dto.getEmail()));
        cliente.setObservacoes(vazioParaNulo(dto.getObservacoes()));
        return cliente;
    }

    private String vazioParaNulo(String valor) { return valor == null || valor.isBlank() ? null : valor.trim(); }
}
