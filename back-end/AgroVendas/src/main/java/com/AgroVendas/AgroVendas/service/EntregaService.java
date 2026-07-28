package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.dto.EntregaDTO;
import com.AgroVendas.AgroVendas.dto.MercadoriaEntregaDTO;
import com.AgroVendas.AgroVendas.model.*;
import com.AgroVendas.AgroVendas.repository.*;
import org.springframework.stereotype.Service;

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
    public Entrega salvar(Long fornecedorId, EntregaDTO dto) {

        Fornecedor fornecedor = fornecedorRepo.findById(fornecedorId)
                .orElseThrow(() -> new RuntimeException("Fornecedor não encontrado"));

        Entrega entrega = new Entrega();
        if (dto.getId() != null) {
            entrega = entregaRepo.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Entrega não encontrada"));
            entrega.getMercadorias().clear();
        } else {
            entrega.setMercadorias(new ArrayList<>());
        }

        entrega.setData(dto.getData());
        entrega.setFornecedor(fornecedor);

        List<EntregaMercadoria> itens = entrega.getMercadorias();

        for (MercadoriaEntregaDTO m : dto.getMercadorias()) {

            Mercadoria mercadoria = mercadoriaRepo
                    .findByNomeIgnoreCase(m.getNomeMercadoria())
                    .orElseGet(() ->
                            mercadoriaRepo.save(
                                    new Mercadoria(null, m.getNomeMercadoria())
                            )
                    );

            EntregaMercadoria em = new EntregaMercadoria();
            em.setEntrega(entrega);
            em.setMercadoria(mercadoria);
            em.setCaixas6424(m.getQuantidadeCaixa6424());
            em.setCaixasPapelao(m.getQuantidadePapelao());

            itens.add(em);
        }

        entrega.setMercadorias(itens);
        return entregaRepo.save(entrega);
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
        entregaRepo.deleteById(id);
    }

    // ================= CONVERSÃO =================
    private EntregaDTO toDTO(Entrega entrega) {

        EntregaDTO dto = new EntregaDTO();
        dto.setId(entrega.getId());
        dto.setData(entrega.getData());

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
