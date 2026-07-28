package com.AgroVendas.AgroVendas.dto;

public class MercadoriaEntregaDTO {

    private String nomeMercadoria;
    private int quantidadeCaixa6424;
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
