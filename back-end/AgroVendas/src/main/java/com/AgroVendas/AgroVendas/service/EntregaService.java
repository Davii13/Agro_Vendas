package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.dto.EntregaDTO;
import com.AgroVendas.AgroVendas.dto.MercadoriaEntregaDTO;
import com.AgroVendas.AgroVendas.model.*;
import com.AgroVendas.AgroVendas.repository.*;
import org.springframework.stereotype.Service;

import com.AgroVendas.AgroVendas.exception.ResourceNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class EntregaService {

    private final EntregaRepository entregaRepo;
    private final FornecedorRepository fornecedorRepo;
    private final MercadoriaRepository mercadoriaRepo;

    public EntregaService(
            EntregaRepository entregaRepo,
            FornecedorRepository fornecedorRepo,
            MercadoriaRepository mercadoriaRepo) {
        this.entregaRepo = entregaRepo;
        this.fornecedorRepo = fornecedorRepo;
        this.mercadoriaRepo = mercadoriaRepo;
    }

    // ================= CRIAR/EDITAR ENTREGA =================
    @Transactional
    public EntregaDTO salvar(Long fornecedorId, EntregaDTO dto) {

        Fornecedor fornecedor = fornecedorRepo.findById(fornecedorId)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor não encontrado"));

        BigDecimal valorTotal = dto.getValorTotal() == null ? BigDecimal.ZERO : dto.getValorTotal();
        BigDecimal valorPago = dto.getValorPago() == null ? BigDecimal.ZERO : dto.getValorPago();
        int valesPagos = dto.getValesPagos() == null ? 0 : dto.getValesPagos();
        int totalVales = dto.getMercadorias().stream().mapToInt(MercadoriaEntregaDTO::getQuantidadeCaixa6424).sum();

        // what is paid can never exceed what is owed
        if (valorPago.compareTo(valorTotal) > 0) {
            throw new IllegalArgumentException("O valor pago não pode ser maior que o valor total da entrega");
        }
        if (valesPagos > totalVales) {
            throw new IllegalArgumentException("Os vales pagos não podem ser mais que as caixas 6424 da entrega");
        }
        if (dto.getMercadorias().stream().anyMatch(m -> m.getQuantidadeCaixa6424() + m.getQuantidadePapelao() <= 0)) {
            throw new IllegalArgumentException("Cada mercadoria precisa de pelo menos uma caixa");
        }

        Entrega entrega = new Entrega();
        if (dto.getId() != null) {
            entrega = entregaRepo.findById(dto.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Entrega não encontrada"));
            // an existing delivery stays with its own supplier: it cannot be moved by editing it from another URL
            if (entrega.getFornecedor() == null || !entrega.getFornecedor().getId().equals(fornecedorId)) {
                throw new IllegalArgumentException("Esta entrega pertence a outro fornecedor");
            }
            entrega.getMercadorias().clear();
        } else {
            entrega.setMercadorias(new ArrayList<>());
        }

        entrega.setData(dto.getData());
        entrega.setValorTotal(valorTotal);
        entrega.setValorPago(valorPago);
        entrega.setValesPagos(valesPagos);
        entrega.setFornecedor(fornecedor);

        List<EntregaMercadoria> itens = entrega.getMercadorias();

        for (MercadoriaEntregaDTO m : dto.getMercadorias()) {

            Mercadoria mercadoria = mercadoriaRepo
                    .findByNomeIgnoreCase(m.getNomeMercadoria() == null ? "" : m.getNomeMercadoria().trim())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Mercadoria não cadastrada: " + m.getNomeMercadoria()));

            EntregaMercadoria em = new EntregaMercadoria();
            em.setEntrega(entrega);
            em.setMercadoria(mercadoria);
            em.setCaixas6424(m.getQuantidadeCaixa6424());
            em.setCaixasPapelao(m.getQuantidadePapelao());

            itens.add(em);
        }

        entrega.setMercadorias(itens);
        return toDTO(entregaRepo.save(entrega));
    }

    // ================= LISTAR (ENTIDADE) =================
    public List<Entrega> listarPorFornecedor(Long fornecedorId) {
        return entregaRepo.findByFornecedorId(fornecedorId);
    }

    // ================= LISTAR (DTO - USADO NO FRONT) =================
    public List<EntregaDTO> listarDTOPorFornecedor(Long fornecedorId) {
        List<Entrega> entregas = listarPorFornecedor(fornecedorId);

        return entregas.stream()
                .map(this::toDTO)
                .toList();
    }

    // ================= EXCLUIR =================
    public void excluir(Long id) {
        if (!entregaRepo.existsById(id)) {
            throw new ResourceNotFoundException("Entrega não encontrada");
        }
        entregaRepo.deleteById(id);
    }

    // ================= CONVERSÃO =================
    private EntregaDTO toDTO(Entrega entrega) {

        EntregaDTO dto = new EntregaDTO();
        dto.setId(entrega.getId());
        dto.setData(entrega.getData());
        dto.setValorTotal(entrega.getValorTotal() == null ? BigDecimal.ZERO : entrega.getValorTotal());
        dto.setValorPago(entrega.getValorPago() == null ? BigDecimal.ZERO : entrega.getValorPago());
        dto.setValesPagos(entrega.getValesPagos() == null ? 0 : entrega.getValesPagos());

        List<MercadoriaEntregaDTO> mercadorias = new ArrayList<>();

        for (EntregaMercadoria em : entrega.getMercadorias()) {
            MercadoriaEntregaDTO m = new MercadoriaEntregaDTO();
            m.setNomeMercadoria(em.getMercadoria().getNome());
            m.setQuantidadeCaixa6424(em.getCaixas6424());
            m.setQuantidadePapelao(em.getCaixasPapelao());
            mercadorias.add(m);
        }

        dto.setMercadorias(mercadorias);
        return dto;
    }
}
