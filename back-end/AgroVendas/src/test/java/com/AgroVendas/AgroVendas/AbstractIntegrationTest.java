package com.AgroVendas.AgroVendas;

import com.AgroVendas.AgroVendas.model.Role;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.repository.EntregaRepository;
import com.AgroVendas.AgroVendas.repository.FornecedorRepository;
import com.AgroVendas.AgroVendas.repository.MercadoriaRepository;
import com.AgroVendas.AgroVendas.repository.RefreshTokenRepository;
import com.AgroVendas.AgroVendas.repository.UsuarioRepository;
import com.AgroVendas.AgroVendas.repository.VendaRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Base for tests that run the whole application against an in-memory database. The JWT secret is
 * random for every run, so no secret is ever stored in the source tree.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractIntegrationTest {

    public static final String SECRET = novoSegredo();
    public static final String SENHA_FORTE = "Safra2026ok";

    private static final AtomicInteger SEQUENCIA = new AtomicInteger();

    @DynamicPropertySource
    static void propriedades(DynamicPropertyRegistry registry) {
        registry.add("jwt.secret", () -> SECRET);
    }

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;
    @Autowired protected UsuarioRepository usuarios;
    @Autowired protected RefreshTokenRepository refreshTokens;
    @Autowired protected VendaRepository vendas;
    @Autowired protected EntregaRepository entregas;
    @Autowired protected FornecedorRepository fornecedores;
    @Autowired protected MercadoriaRepository mercadorias;

    @BeforeEach
    void limparBanco() {
        vendas.deleteAll();
        entregas.deleteAll();
        fornecedores.deleteAll();
        mercadorias.deleteAll();
        refreshTokens.deleteAll();
        usuarios.deleteAll();
    }

    private static String novoSegredo() {
        byte[] bytes = new byte[64];
        new SecureRandom().nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }

    protected Usuario criarUsuario(Role role) {
        Usuario usuario = new Usuario();
        usuario.setEmail("usuario" + SEQUENCIA.incrementAndGet() + "@teste.com");
        usuario.setNome("Usuário de teste");
        usuario.setSenha(SENHA_FORTE);
        usuario.setRole(role);
        usuario.setAtivo(true);
        return usuarios.save(usuario);
    }

    protected JsonNode login(String email, String senha) throws Exception {
        MvcResult result = mvc.perform(MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(java.util.Map.of("email", email, "senha", senha))))
                .andReturn();
        if (result.getResponse().getStatus() != 200) {
            throw new IllegalStateException("login falhou: " + result.getResponse().getStatus());
        }
        return json.readTree(result.getResponse().getContentAsString());
    }

    protected String accessToken(Usuario usuario) throws Exception {
        return login(usuario.getEmail(), SENHA_FORTE).get("accessToken").asText();
    }

    protected MockHttpServletRequestBuilder comToken(MockHttpServletRequestBuilder request, String token) {
        return token == null ? request : request.header("Authorization", "Bearer " + token);
    }

    protected MockHttpServletRequestBuilder jsonRequest(MockHttpServletRequestBuilder request, Object body) throws Exception {
        return request.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
    }
}
