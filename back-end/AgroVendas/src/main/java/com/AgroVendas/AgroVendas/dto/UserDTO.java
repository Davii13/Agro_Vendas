package com.AgroVendas.AgroVendas.dto;

import com.AgroVendas.AgroVendas.model.Usuario;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String nome;

    public static UserDTO fromUsuario(Usuario usuario) {
        return new UserDTO(usuario.getId(), usuario.getEmail(), usuario.getNome());
    }
}
