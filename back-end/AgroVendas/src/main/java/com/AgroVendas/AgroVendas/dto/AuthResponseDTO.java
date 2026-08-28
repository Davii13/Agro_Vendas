package com.AgroVendas.AgroVendas.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
@AllArgsConstructor
public class AuthResponseDTO {
    private String accessToken;
    private String refreshToken;
    private UserDTO usuario;
    private Long expiracaoEmSegundos;
}
