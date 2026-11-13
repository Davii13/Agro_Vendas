package com.AgroVendas.AgroVendas.security;

import com.AgroVendas.AgroVendas.AbstractIntegrationTest;
import com.AgroVendas.AgroVendas.model.Role;
import com.AgroVendas.AgroVendas.model.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The login is not required to be an e-mail address: a plain user name works for people without one. */
class LoginNameTest extends AbstractIntegrationTest {

    private int criar(String token, String login, String senha) throws Exception {
        return mvc.perform(comToken(jsonRequest(post("/api/usuarios"),
                        Map.of("email", login, "senha", senha, "nome", "Pessoa")), token))
                .andReturn().getResponse().getStatus();
    }

    @Test
    @DisplayName("Administrador cria usuários que não têm e-mail, só um nome de usuário")
    void criaUsuarioSemEmail() throws Exception {
        String token = accessToken(criarUsuario(Role.ADMIN));

        for (String login : new String[]{"pai", "Maria.Silva", "joao_2", "seu-ze", "a+b", "abc"}) {
            assertThat(criar(token, login, "Colheita2026")).as("login=%s", login).isEqualTo(201);
        }
        assertThat(usuarios.findByEmail("pai")).isPresent();
        // and it can sign in with it
        login("pai", "Colheita2026");
        login("Maria.Silva", "Colheita2026");
    }

    @Test
    @DisplayName("O login ignora maiúsculas e minúsculas (teclado do celular põe a primeira letra maiúscula)")
    void loginIgnoraMaiusculas() throws Exception {
        String token = accessToken(criarUsuario(Role.ADMIN));
        assertThat(criar(token, "seu.manoel", "Colheita2026")).isEqualTo(201);

        login("Seu.Manoel", "Colheita2026");
        login("SEU.MANOEL", "Colheita2026");
        login("  seu.manoel  ", "Colheita2026");

        // an existing e-mail style login behaves the same way
        Usuario comEmail = criarUsuario(Role.OPERADOR);
        login(comEmail.getEmail().toUpperCase(), SENHA_FORTE);
    }

    @Test
    @DisplayName("Não dá para criar dois logins que só mudam na caixa das letras")
    void loginNaoDuplicaPorCaixa() throws Exception {
        String token = accessToken(criarUsuario(Role.ADMIN));
        assertThat(criar(token, "Pai", "Colheita2026")).isEqualTo(201);
        assertThat(criar(token, "pai", "Colheita2026")).isEqualTo(400);
        assertThat(criar(token, "PAI", "Colheita2026")).isEqualTo(400);
        assertThat(usuarios.count()).isEqualTo(2); // the admin and "Pai"
    }

    @Test
    @DisplayName("Logins com espaço, símbolos perigosos, curtos demais ou longos demais são recusados")
    void loginInvalidoEhRecusado() throws Exception {
        String token = accessToken(criarUsuario(Role.ADMIN));
        long antes = usuarios.count();

        for (String ruim : new String[]{"ab", "", "com espaco", "<script>alert(1)</script>", "a'b", "a\"b", "nome;drop", "x".repeat(151), "çao"}) {
            assertThat(criar(token, ruim, "Colheita2026")).as("login=[%s]", ruim).isEqualTo(400);
        }
        assertThat(usuarios.count()).isEqualTo(antes);
    }

    @Test
    @DisplayName("A senha continua obedecendo a política, mesmo sem e-mail")
    void senhaSegueAPoliticaMesmoSemEmail() throws Exception {
        String token = accessToken(criarUsuario(Role.ADMIN));
        assertThat(criar(token, "pessoa.nova", "1234")).isEqualTo(400);
        assertThat(criar(token, "pessoa.nova", "12345678")).isEqualTo(400);
        assertThat(criar(token, "pessoa.nova", "pessoa.nova")).isEqualTo(400);
        assertThat(usuarios.findByEmail("pessoa.nova")).isEmpty();
    }

    @Test
    @DisplayName("Login por nome de usuário também é limitado contra tentativas em excesso")
    void nomeDeUsuarioTambemTemLimiteDeTentativas() throws Exception {
        String token = accessToken(criarUsuario(Role.ADMIN));
        assertThat(criar(token, "limite.teste", "Colheita2026")).isEqualTo(201);
        for (int i = 0; i < 5; i++) {
            mvc.perform(jsonRequest(post("/api/auth/login"), Map.of("email", "Limite.Teste", "senha", "errada" + i + "A")))
                    .andExpect(status().isUnauthorized());
        }
        // different capitalization is the same account, so it is locked too
        mvc.perform(jsonRequest(post("/api/auth/login"), Map.of("email", "limite.teste", "senha", "Colheita2026")))
                .andExpect(status().isTooManyRequests());
    }
}
