package com.AgroVendas.AgroVendas.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ClienteDTO {

    @Size(max = 150, message = "nome muito longo")
    private String nome;

    @Size(max = 30, message = "telefone muito longo")
    private String telefone;

    @Size(max = 18, message = "CPF/CNPJ muito longo")
    private String cpfCnpj;

    @Size(max = 150, message = "localização muito longa")
    private String localizacao;

    @Size(max = 2000, message = "observações muito longas")
    private String observacoes;
}
