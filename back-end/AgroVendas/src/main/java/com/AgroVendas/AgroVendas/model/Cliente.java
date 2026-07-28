package com.AgroVendas.AgroVendas.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "clientes")
@Getter @Setter
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 30)
    private String telefone;

    @Column(name = "cpf_cnpj", length = 18, unique = true)
    private String cpfCnpj;

    @Column(length = 150)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String observacoes;
}
