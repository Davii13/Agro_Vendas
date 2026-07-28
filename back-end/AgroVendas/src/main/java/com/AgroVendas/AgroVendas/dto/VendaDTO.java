package com.AgroVendas.AgroVendas.dto;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;


@Getter @Setter
public class VendaDTO {

    private Long id;
    private LocalDate data;
    private String cliente;
    private Long clienteId;

    private String modeloCaixa;
    private Integer qtdeCaixas6424;
    private Integer caixasPagasVale;
    private Integer caixasDevendoVale;

    private String pagamentoVerduras;
    private BigDecimal valorPago;

    private List<VendaMercadoriaDTO> mercadorias;
}
