package com.AgroVendas.AgroVendas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * What the client may say about a sale. Totals, the amount actually paid and the number of boxes
 * still owed are decided by the server (see VendaService), never taken from here as facts.
 */
@Getter @Setter
public class VendaDTO {

    private Long id;

    @NotNull(message = "informe a data da venda")
    private LocalDate data;

    @Size(max = 150, message = "nome do cliente muito longo")
    private String cliente;
    private Long clienteId;

    @NotNull(message = "informe o modelo de caixa")
    @Pattern(regexp = "Papelão|6424|Misto", message = "modelo de caixa inválido")
    private String modeloCaixa;

    @NotNull(message = "informe a quantidade de caixas 6424")
    @Min(value = 0, message = "a quantidade de caixas não pode ser negativa")
    @Max(value = 100000, message = "quantidade de caixas acima do limite")
    private Integer qtdeCaixas6424;

    @NotNull(message = "informe as caixas pagas com vale")
    @Min(value = 0, message = "as caixas pagas não podem ser negativas")
    @Max(value = 100000, message = "quantidade de caixas acima do limite")
    private Integer caixasPagasVale;

    /** Ignored: the server computes how many boxes are still owed. Kept so existing clients keep working. */
    private Integer caixasDevendoVale;

    @NotNull(message = "informe a situação do pagamento")
    @Pattern(regexp = "Pago|Parcial|Devendo", message = "situação de pagamento inválida")
    private String pagamentoVerduras;

    @DecimalMin(value = "0.00", message = "o valor pago não pode ser negativo")
    @DecimalMax(value = "1000000000.00", message = "valor pago acima do limite")
    @Digits(integer = 10, fraction = 2, message = "valor com no máximo 2 casas decimais")
    private BigDecimal valorPago;

    @NotEmpty(message = "a venda precisa ter ao menos uma mercadoria")
    @Size(max = 200, message = "mercadorias demais na mesma venda")
    @Valid
    private List<VendaMercadoriaDTO> mercadorias;
}
