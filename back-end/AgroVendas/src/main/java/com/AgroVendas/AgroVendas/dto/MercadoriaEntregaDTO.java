package com.AgroVendas.AgroVendas.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MercadoriaEntregaDTO {

    @NotBlank(message = "informe a mercadoria")
    @Size(max = 150, message = "nome da mercadoria muito longo")
    private String nomeMercadoria;
    @Min(value = 0, message = "a quantidade de caixas não pode ser negativa")
    @Max(value = 100000, message = "quantidade de caixas acima do limite")
    private int quantidadeCaixa6424;
    @Min(value = 0, message = "a quantidade de papelão não pode ser negativa")
    @Max(value = 100000, message = "quantidade de papelão acima do limite")
    private int quantidadePapelao;

    public MercadoriaEntregaDTO() {
    }

    public MercadoriaEntregaDTO(String nomeMercadoria, int quantidadeCaixa6424, int quantidadePapelao) {
        this.nomeMercadoria = nomeMercadoria;
        this.quantidadeCaixa6424 = quantidadeCaixa6424;
        this.quantidadePapelao = quantidadePapelao;
    }

    public String getNomeMercadoria() {
        return nomeMercadoria;
    }

    public void setNomeMercadoria(String nomeMercadoria) {
        this.nomeMercadoria = nomeMercadoria;
    }

    public int getQuantidadeCaixa6424() {
        return quantidadeCaixa6424;
    }

    public void setQuantidadeCaixa6424(int quantidadeCaixa6424) {
        this.quantidadeCaixa6424 = quantidadeCaixa6424;
    }

    public int getQuantidadePapelao() {
        return quantidadePapelao;
    }

    public void setQuantidadePapelao(int quantidadePapelao) {
        this.quantidadePapelao = quantidadePapelao;
    }
}
