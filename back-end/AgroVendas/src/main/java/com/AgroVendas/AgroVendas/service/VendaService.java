package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.dto.VendaDTO;
import com.AgroVendas.AgroVendas.dto.VendaMercadoriaDTO;
import com.AgroVendas.AgroVendas.exception.ResourceNotFoundException;
import com.AgroVendas.AgroVendas.model.Cliente;
import com.AgroVendas.AgroVendas.model.Mercadoria;
import com.AgroVendas.AgroVendas.model.Venda;
import com.AgroVendas.AgroVendas.model.VendaMercadoria;
import com.AgroVendas.AgroVendas.repository.ClienteRepository;
import com.AgroVendas.AgroVendas.repository.MercadoriaRepository;
import com.AgroVendas.AgroVendas.repository.VendaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class VendaService {

    private static final String PAPELAO = "Papelão";
    private static final String MISTO = "Misto";

    private final VendaRepository vendaRepo;
    private final ClienteRepository clienteRepo;
    private final MercadoriaRepository mercadoriaRepo;

    public VendaService(VendaRepository vendaRepo, ClienteRepository clienteRepo, MercadoriaRepository mercadoriaRepo) {
        this.vendaRepo = vendaRepo;
        this.clienteRepo = clienteRepo;
        this.mercadoriaRepo = mercadoriaRepo;
    }

    /**
     * Saves a sale. The money rules live here and nowhere else:
     * the total is the sum of quantity x unit price (a sale may be saved without prices and priced
     * later), the amount paid follows from the payment choice, the stored status is derived from
     * those two numbers, and the boxes still owed are boxes sold minus boxes paid. Whatever the
     * client sends for those derived fields is ignored.
     */
    @Transactional
    public Venda salvar(VendaDTO dto) {

        Venda venda = new Venda();

        // EDITAR
        if (dto.getId() != null) {
            venda = vendaRepo.findById(dto.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Venda não encontrada"));
            venda.getMercadorias().clear(); // orphanRemoval = true resolve no banco
        }

        venda.setData(dto.getData());
        if (dto.getClienteId() != null) {
            Cliente cliente = clienteRepo.findById(dto.getClienteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado"));
            venda.setClienteCadastro(cliente);
            venda.setCliente(cliente.getNome());
        } else {
            venda.setClienteCadastro(null);
            venda.setCliente(dto.getCliente() == null || dto.getCliente().isBlank()
                    ? "Cliente desconhecido" : dto.getCliente().trim());
        }
        venda.setModeloCaixa(dto.getModeloCaixa());

        // items and total (the unit price is optional: a missing price counts as zero)
        BigDecimal total = BigDecimal.ZERO;
        int totalCaixas = 0;
        for (VendaMercadoriaDTO m : dto.getMercadorias()) {
            Mercadoria mercadoria = mercadoriaRepo.findByNomeIgnoreCase(m.getNome().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Mercadoria não cadastrada: " + m.getNome()));
            BigDecimal valor = m.getValor() == null ? BigDecimal.ZERO : m.getValor();

            VendaMercadoria vm = new VendaMercadoria();
            vm.setNome(mercadoria.getNome());
            vm.setQtde(m.getQtde());
            vm.setValor(valor);
            vm.setVenda(venda);
            venda.getMercadorias().add(vm);

            total = total.add(valor.multiply(BigDecimal.valueOf(m.getQtde())));
            totalCaixas += m.getQtde();
        }
        total = total.setScale(2, RoundingMode.HALF_UP);

        // boxes: with the 6424 model every box sold is a 6424 box, so the count comes from the items;
        // "Misto" mixes cardboard and 6424, so the count is given but can never exceed the boxes sold
        int vendidas;
        int pagas;
        if (PAPELAO.equals(dto.getModeloCaixa())) {
            vendidas = 0;
            pagas = 0;
        } else {
            if (MISTO.equals(dto.getModeloCaixa())) {
                vendidas = dto.getQtdeCaixas6424();
                if (vendidas > totalCaixas) {
                    throw new IllegalArgumentException("As caixas 6424 não podem ser mais que o total de caixas da venda");
                }
            } else {
                vendidas = totalCaixas;
            }
            pagas = dto.getCaixasPagasVale();
        }
        if (pagas > vendidas) {
            throw new IllegalArgumentException("As caixas pagas com vale não podem ser mais que as caixas 6424 vendidas");
        }
        venda.setQtdeCaixas6424(vendidas);
        venda.setCaixasPagasVale(pagas);
        venda.setCaixasDevendoVale(vendidas - pagas);

        // payment: without a price there is nothing to pay yet, so the sale stays as "Devendo";
        // otherwise the choice decides the amount and the amount decides the stored status
        BigDecimal pago = total.signum() == 0 ? BigDecimal.ZERO.setScale(2) : valorPago(dto, total);
        venda.setValorPago(pago);
        venda.setPagamentoVerduras(total.signum() == 0 ? "Devendo" : situacao(pago, total));

        return vendaRepo.save(venda);
    }

    private BigDecimal valorPago(VendaDTO dto, BigDecimal total) {
        switch (dto.getPagamentoVerduras()) {
            case "Pago":
                return total;
            case "Devendo":
                return BigDecimal.ZERO.setScale(2);
            default: {
                BigDecimal informado = dto.getValorPago() == null ? BigDecimal.ZERO : dto.getValorPago();
                if (informado.signum() <= 0 || informado.compareTo(total) >= 0) {
                    throw new IllegalArgumentException(
                            "No pagamento parcial, o valor pago deve ser maior que zero e menor que o total da venda");
                }
                return informado.setScale(2, RoundingMode.HALF_UP);
            }
        }
    }

    private String situacao(BigDecimal pago, BigDecimal total) {
        if (pago.compareTo(total) >= 0) {
            return "Pago";
        }
        return pago.signum() == 0 ? "Devendo" : "Parcial";
    }

    public List<Venda> listarPorData(LocalDate data) {
        return vendaRepo.findByData(data);
    }

    public List<Venda> listarTodas() {
        return vendaRepo.findAll();
    }

    public void excluir(Long id) {
        if (!vendaRepo.existsById(id)) {
            throw new ResourceNotFoundException("Venda não encontrada");
        }
        vendaRepo.deleteById(id);
    }
}
