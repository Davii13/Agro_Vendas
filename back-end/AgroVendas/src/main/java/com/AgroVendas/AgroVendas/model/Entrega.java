package com.AgroVendas.AgroVendas.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Entrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate data;

    /** Valor em dinheiro combinado com o produtor por esta entrega. */
    private BigDecimal valorTotal = BigDecimal.ZERO;

    /** Quanto desse valor já foi pago em dinheiro. */
    private BigDecimal valorPago = BigDecimal.ZERO;

    /** Quantidade de vales de caixas plásticas (6424) já pagos ao produtor. */
    private Integer valesPagos = 0;

    @ManyToOne
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    @OneToMany(mappedBy = "entrega", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EntregaMercadoria> mercadorias;
}
