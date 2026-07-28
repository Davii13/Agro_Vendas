package com.AgroVendas.AgroVendas.dto;

import com.AgroVendas.AgroVendas.model.Cliente;
import com.AgroVendas.AgroVendas.model.Venda;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter
public class ClienteDetalheDTO {
    private Cliente cliente;
    private List<Venda> vendas;

    public ClienteDetalheDTO(Cliente cliente, List<Venda> vendas) {
        this.cliente = cliente;
        this.vendas = vendas;
    }
}
