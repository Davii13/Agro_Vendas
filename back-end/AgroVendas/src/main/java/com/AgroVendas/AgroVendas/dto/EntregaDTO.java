package com.AgroVendas.AgroVendas.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class EntregaDTO {

    private Long id; // 👈 NECESSÁRIO
    private LocalDate data;
    private List<MercadoriaEntregaDTO> mercadorias;
}
