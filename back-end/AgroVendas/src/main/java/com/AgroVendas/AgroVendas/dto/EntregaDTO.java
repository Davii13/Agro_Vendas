package com.AgroVendas.AgroVendas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class EntregaDTO {

    private Long id;

    @NotNull(message = "informe a data da entrega")
    private LocalDate data;

    @DecimalMin(value = "0.00", message = "o valor total não pode ser negativo")
    @DecimalMax(value = "1000000000.00", message = "valor total acima do limite")
    @Digits(integer = 10, fraction = 2, message = "valor com no máximo 2 casas decimais")
    private BigDecimal valorTotal;

    @DecimalMin(value = "0.00", message = "o valor pago não pode ser negativo")
    @DecimalMax(value = "1000000000.00", message = "valor pago acima do limite")
    @Digits(integer = 10, fraction = 2, message = "valor com no máximo 2 casas decimais")
    private BigDecimal valorPago;

    @Min(value = 0, message = "os vales pagos não podem ser negativos")
    @Max(value = 1000000, message = "vales pagos acima do limite")
    private Integer valesPagos;

    @NotEmpty(message = "a entrega precisa ter ao menos uma mercadoria")
    @Size(max = 200, message = "mercadorias demais na mesma entrega")
    @Valid
    private List<MercadoriaEntregaDTO> mercadorias;
}
