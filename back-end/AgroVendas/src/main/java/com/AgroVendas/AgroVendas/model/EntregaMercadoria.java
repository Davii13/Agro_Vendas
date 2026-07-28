package com.AgroVendas.AgroVendas.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class EntregaMercadoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Entrega entrega;

    @ManyToOne
    private Mercadoria mercadoria;

    private Integer caixas6424;
    private Integer caixasPapelao;
}
