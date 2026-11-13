package com.AgroVendas.AgroVendas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class MercadoriaDTO {

    @NotBlank(message = "informe o nome da mercadoria")
    @Size(max = 150, message = "nome da mercadoria muito longo")
    private String nome;
}
