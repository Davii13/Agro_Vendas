package com.AgroVendas.AgroVendas.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class VendaMercadoriaDTO {

    @NotBlank(message = "informe a mercadoria")
    @Size(max = 150, message = "nome da mercadoria muito longo")
    private String nome;

    @NotNull(message = "informe a quantidade")
    @Min(value = 1, message = "a quantidade deve ser pelo menos 1")
    @Max(value = 100000, message = "quantidade acima do limite")
    private Integer qtde;

    @NotNull(message = "informe o valor unitário")
    @DecimalMin(value = "0.00", message = "o valor unitário não pode ser negativo")
    @DecimalMax(value = "1000000.00", message = "valor unitário acima do limite")
    @Digits(integer = 7, fraction = 2, message = "valor com no máximo 2 casas decimais")
    private BigDecimal valor;
}
