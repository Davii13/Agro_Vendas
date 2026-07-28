package com.AgroVendas.AgroVendas.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.util.ArrayList;

import lombok.Getter;
import lombok.Setter;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
@Entity
@Table(name = "vendas")
@Getter @Setter
public class Venda {

    @JsonProperty("clienteId")
    public Long getClienteId() {
        return clienteCadastro == null ? null : clienteCadastro.getId();
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate data;

    private String cliente;

    /** Optional: old and anonymous sales remain valid without a customer. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    @JsonIgnore
    private Cliente clienteCadastro;

    private String modeloCaixa;

    private Integer qtdeCaixas6424;
    private Integer caixasPagasVale;
    private Integer caixasDevendoVale;

    private String pagamentoVerduras; // Pago | Devendo | Parcial
    private BigDecimal valorPago;

    @OneToMany(mappedBy = "venda", cascade = CascadeType.ALL, orphanRemoval = true)
@JsonManagedReference
private List<VendaMercadoria> mercadorias = new ArrayList<>();

}
