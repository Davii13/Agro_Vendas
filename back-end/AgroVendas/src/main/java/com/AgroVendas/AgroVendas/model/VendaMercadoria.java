package com.AgroVendas.AgroVendas.model;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;

@Entity
@Table(name = "venda_mercadorias")
@Getter @Setter
public class VendaMercadoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private Integer qtde;
    private BigDecimal valor;

   @ManyToOne
@JoinColumn(name = "venda_id")
@JsonIgnore
private Venda venda;

}
