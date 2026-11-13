package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.dto.MercadoriaDTO;
import com.AgroVendas.AgroVendas.model.Mercadoria;
import com.AgroVendas.AgroVendas.repository.EntregaMercadoriaRepository;
import com.AgroVendas.AgroVendas.repository.MercadoriaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MercadoriaService {

    private final MercadoriaRepository mercadorias;
    private final EntregaMercadoriaRepository itensEntrega;

    public MercadoriaService(MercadoriaRepository mercadorias, EntregaMercadoriaRepository itensEntrega) {
        this.mercadorias = mercadorias;
        this.itensEntrega = itensEntrega;
    }

    public List<Mercadoria> listar() {
        return mercadorias.findAllByOrderByNomeAsc();
    }

    public Mercadoria criar(MercadoriaDTO dto) {
        String nome = nomeValido(dto);
        if (mercadorias.findByNomeIgnoreCase(nome).isPresent()) {
            throw new IllegalArgumentException("Mercadoria já cadastrada");
        }
        return mercadorias.save(new Mercadoria(null, nome));
    }

    public Mercadoria atualizar(Long id, MercadoriaDTO dto) {
        Mercadoria mercadoria = mercadorias.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mercadoria não encontrada"));
        String nome = nomeValido(dto);
        if (mercadorias.existsByNomeIgnoreCaseAndIdNot(nome, id)) {
            throw new IllegalArgumentException("Mercadoria já cadastrada");
        }
        mercadoria.setNome(nome);
        return mercadorias.save(mercadoria);
    }

    public void excluir(Long id) {
        if (!mercadorias.existsById(id)) {
            throw new IllegalArgumentException("Mercadoria não encontrada");
        }
        if (itensEntrega.existsByMercadoriaId(id)) {
            throw new IllegalArgumentException("Mercadoria já usada em entregas e não pode ser excluída");
        }
        mercadorias.deleteById(id);
    }

    private String nomeValido(MercadoriaDTO dto) {
        if (dto.getNome() == null || dto.getNome().isBlank()) {
            throw new IllegalArgumentException("Nome da mercadoria é obrigatório");
        }
        return dto.getNome().trim();
    }
}
