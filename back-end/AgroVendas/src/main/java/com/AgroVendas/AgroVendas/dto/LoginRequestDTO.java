package com.AgroVendas.AgroVendas.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequestDTO {
    private String email;
    private String senha;
    private boolean manterConectado;
}
