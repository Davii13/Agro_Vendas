package com.AgroVendas.AgroVendas.dto;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class VendaMercadoriaDTO {
    private String nome;
    private Integer qtde;
    private BigDecimal valor;
}
