package com.AgroVendas.AgroVendas.model;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

@Entity
public class Fornecedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String areaCeasa;

    public Fornecedor() {}

    public Fornecedor(Long id, String nome, String areaCeasa) {
        this.id = id;
        this.nome = nome;
        this.areaCeasa = areaCeasa;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getAreaCeasa() {
        return areaCeasa;
    }

    public void setAreaCeasa(String areaCeasa) {
        this.areaCeasa = areaCeasa;
    }
}
