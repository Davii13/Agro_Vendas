package com.AgroVendas.AgroVendas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class FornecedorDTO {

    @NotBlank(message = "informe o nome do produtor")
    @Size(max = 150, message = "nome muito longo")
    private String nome;

    @Size(max = 100, message = "local no CEASA muito longo")
    private String areaCeasa;
}
