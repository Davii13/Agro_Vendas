package com.AgroVendas.AgroVendas.security;

import com.AgroVendas.AgroVendas.AbstractIntegrationTest;
import com.AgroVendas.AgroVendas.model.Role;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.repository.RefreshTokenRepository;
import com.AgroVendas.AgroVendas.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Same rules, but over real HTTP against the embedded Tomcat. MockMvc skips the servlet
 * container's error dispatch, which once turned every 403 into a 401 only in a running server;
 * these tests exist to catch that kind of difference.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RealServerSecurityTest {

    @DynamicPropertySource
    static void propriedades(DynamicPropertyRegistry registry) {
        registry.add("jwt.secret", () -> AbstractIntegrationTest.SECRET);
    }

    @LocalServerPort int porta;
    @Autowired UsuarioRepository usuarios;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired ObjectMapper json;

    private final HttpClient http = HttpClient.newHttpClient();

    @BeforeEach
    void limpar() {
        refreshTokens.deleteAll();
        usuarios.deleteAll();
    }

    private Usuario criar(String email, Role role) {
        Usuario u = new Usuario();
        u.setEmail(email);
        u.setNome("Teste");
        u.setSenha(AbstractIntegrationTest.SENHA_FORTE);
        u.setRole(role);
        return usuarios.save(u);
    }

    private HttpResponse<String> enviar(String metodo, String caminho, String token, String corpo) throws Exception {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:" + porta + caminho))
                .header("Content-Type", "application/json")
                .method(metodo, corpo == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(corpo));
        if (token != null) {
            b.header("Authorization", "Bearer " + token);
        }
        return http.send(b.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String login(String email) throws Exception {
        HttpResponse<String> r = enviar("POST", "/api/auth/login", null,
                json.writeValueAsString(java.util.Map.of("email", email, "senha", AbstractIntegrationTest.SENHA_FORTE)));
        JsonNode corpo = json.readTree(r.body());
        return corpo.get("accessToken").asText();
    }

    @Test
    @DisplayName("Em servidor real: anônimo recebe 401 e usuário comum recebe 403 (e não 401) nas rotas de administrador")
    void statusCorretosEmServidorReal() throws Exception {
        criar("admin@teste.com", Role.ADMIN);
        criar("operador@teste.com", Role.OPERADOR);
        String operador = login("operador@teste.com");
        String admin = login("admin@teste.com");

        assertThat(enviar("GET", "/api/usuarios", null, null).statusCode()).isEqualTo(401);
        assertThat(enviar("GET", "/api/vendas", null, null).statusCode()).isEqualTo(401);

        assertThat(enviar("GET", "/api/usuarios", operador, null).statusCode()).isEqualTo(403);
        assertThat(enviar("PUT", "/api/usuarios/1/redefinir-senha", operador, "{\"novaSenha\":\"Invasor2026ok\"}").statusCode()).isEqualTo(403);
        assertThat(enviar("POST", "/api/usuarios", operador, "{\"email\":\"x@y.com\",\"senha\":\"Invasor2026ok\",\"nome\":\"x\"}").statusCode()).isEqualTo(403);

        assertThat(enviar("GET", "/api/vendas", operador, null).statusCode()).isEqualTo(200);
        assertThat(enviar("GET", "/api/usuarios", admin, null).statusCode()).isEqualTo(200);
    }

    @Test
    @DisplayName("Em servidor real: a resposta de erro de autorização é JSON e não expõe detalhes")
    void respostaDeNegacaoNaoVazaDetalhes() throws Exception {
        criar("operador2@teste.com", Role.OPERADOR);
        HttpResponse<String> r = enviar("GET", "/api/usuarios", login("operador2@teste.com"), null);
        assertThat(r.statusCode()).isEqualTo(403);
        assertThat(r.body()).doesNotContain("Exception").doesNotContain("trace").doesNotContain("org.springframework");
    }
}
