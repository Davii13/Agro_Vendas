package com.AgroVendas.AgroVendas.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ClienteDTO {
    private String nome;
    private String telefone;
    private String cpfCnpj;
    private String email;
    private String observacoes;
}
