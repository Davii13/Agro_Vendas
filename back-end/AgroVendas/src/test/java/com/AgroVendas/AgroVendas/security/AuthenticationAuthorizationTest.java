package com.AgroVendas.AgroVendas.security;

import com.AgroVendas.AgroVendas.AbstractIntegrationTest;
import com.AgroVendas.AgroVendas.model.Role;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.fasterxml.jackson.databind.JsonNode;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthenticationAuthorizationTest extends AbstractIntegrationTest {

    /** The secret that used to be the built-in default. It is public, so it must never validate anything. */
    private static final String SEGREDO_ANTIGO =
            "SuaChaveSecretaMuitoForteComPeloMenos256BitsParaHMACSHA256SuaChaveSecretaMuitoForteComPeloMenos256Bits";

    // ------------------------------------------------------------------ anonymous access

    @Test
    @DisplayName("Usuário anônimo não acessa nenhum endpoint protegido")
    void anonimoNaoAcessaEndpointsProtegidos() throws Exception {
        for (String caminho : List.of("/api/vendas", "/api/clientes", "/api/fornecedores", "/api/mercadorias",
                "/api/usuarios", "/api/auth/me")) {
            mvc.perform(get(caminho)).andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/vendas").contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/vendas/1")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/clientes/1")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Não existe cadastro público: /api/auth/register exige autenticação e não cria conta")
    void cadastroPublicoNaoExiste() throws Exception {
        mvc.perform(jsonRequest(post("/api/auth/register"),
                        Map.of("email", "invasor@teste.com", "senha", "Invasor2026ok", "nome", "Invasor")))
                .andExpect(status().isUnauthorized());
        assertThat(usuarios.findByEmail("invasor@teste.com")).isEmpty();
    }

    // ------------------------------------------------------------------ administrative access

    @Test
    @DisplayName("Usuário comum não executa operações administrativas")
    void operadorNaoAcessaOperacoesAdministrativas() throws Exception {
        Usuario operador = criarUsuario(Role.OPERADOR);
        Usuario outro = criarUsuario(Role.OPERADOR);
        String token = accessToken(operador);

        mvc.perform(comToken(get("/api/usuarios"), token)).andExpect(status().isForbidden());
        mvc.perform(comToken(get("/api/usuarios/" + outro.getId()), token)).andExpect(status().isForbidden());
        mvc.perform(comToken(jsonRequest(post("/api/usuarios"),
                        Map.of("email", "novo@teste.com", "senha", "Novo2026ok", "nome", "Novo")), token))
                .andExpect(status().isForbidden());
        mvc.perform(comToken(jsonRequest(put("/api/usuarios/" + outro.getId()), Map.of("nome", "X")), token))
                .andExpect(status().isForbidden());
        mvc.perform(comToken(put("/api/usuarios/" + outro.getId() + "/desativar"), token)).andExpect(status().isForbidden());
        mvc.perform(comToken(put("/api/usuarios/" + outro.getId() + "/ativar"), token)).andExpect(status().isForbidden());
        mvc.perform(comToken(jsonRequest(put("/api/usuarios/" + outro.getId() + "/redefinir-senha"),
                        Map.of("novaSenha", "Invasor2026ok")), token))
                .andExpect(status().isForbidden());

        assertThat(usuarios.findByEmail("novo@teste.com")).isEmpty();
        assertThat(usuarios.findById(outro.getId()).orElseThrow().estaAtivo()).isTrue();
    }

    @Test
    @DisplayName("Usuário não consegue alterar a senha de terceiros")
    void usuarioNaoAlteraSenhaDeTerceiros() throws Exception {
        Usuario admin = criarUsuario(Role.ADMIN);
        Usuario operador = criarUsuario(Role.OPERADOR);
        String token = accessToken(operador);

        // the old, unprotected route is gone and the new one is admin-only
        mvc.perform(comToken(jsonRequest(put("/api/usuarios/" + admin.getId() + "/alterar-senha"),
                        Map.of("novaSenha", "Invasor2026ok")), token))
                .andExpect(status().isForbidden());
        mvc.perform(comToken(jsonRequest(put("/api/usuarios/" + admin.getId() + "/redefinir-senha"),
                        Map.of("novaSenha", "Invasor2026ok")), token))
                .andExpect(status().isForbidden());

        // the administrator's password is unchanged
        login(admin.getEmail(), SENHA_FORTE);
    }

    @Test
    @DisplayName("Administrador cria usuários, mas a senha precisa seguir a política")
    void adminCriaUsuarioComPoliticaDeSenha() throws Exception {
        String token = accessToken(criarUsuario(Role.ADMIN));

        mvc.perform(comToken(jsonRequest(post("/api/usuarios"),
                        Map.of("email", "fraca@teste.com", "senha", "1234", "nome", "Fraca")), token))
                .andExpect(status().isBadRequest());
        mvc.perform(comToken(jsonRequest(post("/api/usuarios"),
                        Map.of("email", "fraca@teste.com", "senha", "12345678", "nome", "Fraca")), token))
                .andExpect(status().isBadRequest());
        assertThat(usuarios.findByEmail("fraca@teste.com")).isEmpty();

        mvc.perform(comToken(jsonRequest(post("/api/usuarios"),
                        Map.of("email", "forte@teste.com", "senha", "Colheita2026", "nome", "Forte")), token))
                .andExpect(status().isCreated());
        Usuario criado = usuarios.findByEmail("forte@teste.com").orElseThrow();
        assertThat(criado.getRole()).isEqualTo(Role.OPERADOR);
        login("forte@teste.com", "Colheita2026");
    }

    @Test
    @DisplayName("O papel vem do banco a cada requisição: quem perde o ADMIN perde o acesso na hora")
    void rebaixarAdminTemEfeitoImediato() throws Exception {
        Usuario a = criarUsuario(Role.ADMIN);
        Usuario b = criarUsuario(Role.ADMIN);
        String tokenA = accessToken(a);
        String tokenB = accessToken(b);

        mvc.perform(comToken(jsonRequest(put("/api/usuarios/" + a.getId()), Map.of("nome", "A", "role", "OPERADOR")), tokenB))
                .andExpect(status().isOk());

        mvc.perform(comToken(get("/api/usuarios"), tokenA)).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("O sistema nunca fica sem administrador ativo")
    void ultimoAdminNaoPodeSerRemovido() throws Exception {
        Usuario admin = criarUsuario(Role.ADMIN);
        String token = accessToken(admin);

        mvc.perform(comToken(put("/api/usuarios/" + admin.getId() + "/desativar"), token)).andExpect(status().isBadRequest());
        mvc.perform(comToken(jsonRequest(put("/api/usuarios/" + admin.getId()), Map.of("nome", "A", "role", "OPERADOR")), token))
                .andExpect(status().isBadRequest());

        assertThat(usuarios.findById(admin.getId()).orElseThrow().estaAtivo()).isTrue();
        assertThat(usuarios.findById(admin.getId()).orElseThrow().getRole()).isEqualTo(Role.ADMIN);
    }

    // ------------------------------------------------------------------ own password

    @Test
    @DisplayName("Alteração da própria senha: exige a senha atual, aplica a política e encerra todas as sessões")
    void usuarioAlteraPropriaSenha() throws Exception {
        Usuario usuario = criarUsuario(Role.OPERADOR);
        JsonNode sessao = login(usuario.getEmail(), SENHA_FORTE);
        String access = sessao.get("accessToken").asText();
        String refresh = sessao.get("refreshToken").asText();

        mvc.perform(comToken(jsonRequest(put("/api/auth/me/password"),
                        Map.of("senhaAtual", "senha-errada1", "novaSenha", "Nova2026Senha")), access))
                .andExpect(status().isBadRequest());
        mvc.perform(comToken(jsonRequest(put("/api/auth/me/password"),
                        Map.of("senhaAtual", SENHA_FORTE, "novaSenha", "123")), access))
                .andExpect(status().isBadRequest());
        mvc.perform(jsonRequest(put("/api/auth/me/password"),
                        Map.of("senhaAtual", SENHA_FORTE, "novaSenha", "Nova2026Senha")))
                .andExpect(status().isUnauthorized());

        mvc.perform(comToken(jsonRequest(put("/api/auth/me/password"),
                        Map.of("senhaAtual", SENHA_FORTE, "novaSenha", "Nova2026Senha")), access))
                .andExpect(status().isOk());

        // every earlier credential is dead
        mvc.perform(comToken(get("/api/vendas"), access)).andExpect(status().isUnauthorized());
        mvc.perform(jsonRequest(post("/api/auth/refresh"), Map.of("refreshToken", refresh))).andExpect(status().isUnauthorized());
        mvc.perform(jsonRequest(post("/api/auth/login"), Map.of("email", usuario.getEmail(), "senha", SENHA_FORTE)))
                .andExpect(status().isUnauthorized());
        // and the new password works
        login(usuario.getEmail(), "Nova2026Senha");
    }

    @Test
    @DisplayName("Redefinição de senha pelo administrador encerra as sessões do usuário")
    void adminRedefineSenhaEEncerraSessoes() throws Exception {
        Usuario admin = criarUsuario(Role.ADMIN);
        Usuario operador = criarUsuario(Role.OPERADOR);
        JsonNode sessao = login(operador.getEmail(), SENHA_FORTE);

        mvc.perform(comToken(jsonRequest(put("/api/usuarios/" + operador.getId() + "/redefinir-senha"),
                        Map.of("novaSenha", "Redefinida2026")), accessToken(admin)))
                .andExpect(status().isOk());

        mvc.perform(comToken(get("/api/vendas"), sessao.get("accessToken").asText())).andExpect(status().isUnauthorized());
        mvc.perform(jsonRequest(post("/api/auth/refresh"), Map.of("refreshToken", sessao.get("refreshToken").asText())))
                .andExpect(status().isUnauthorized());
        login(operador.getEmail(), "Redefinida2026");
    }

    // ------------------------------------------------------------------ tokens

    @Test
    @DisplayName("Token forjado com o segredo antigo (publicado no repositório) é rejeitado")
    void jwtForjadoComSegredoAntigoERejeitado() throws Exception {
        Usuario admin = criarUsuario(Role.ADMIN);
        SecretKey chaveAntiga = Keys.hmacShaKeyFor(SEGREDO_ANTIGO.getBytes(StandardCharsets.UTF_8));

        // even with every claim the server expects, a signature made with the old key must fail
        String forjado = tokenCom(chaveAntiga, admin, "access", 300, "agrovendas-api", "agrovendas-web");
        mvc.perform(comToken(get("/api/auth/me"), forjado)).andExpect(status().isUnauthorized());
        mvc.perform(comToken(get("/api/usuarios"), forjado)).andExpect(status().isUnauthorized());

        // the old format (no tipo/iss/aud) signed with the old key, as the previous code issued
        String antigo = Jwts.builder().subject(admin.getId().toString()).claim("email", admin.getEmail())
                .issuedAt(new Date()).expiration(new Date(System.currentTimeMillis() + 300_000)).signWith(chaveAntiga).compact();
        mvc.perform(comToken(get("/api/auth/me"), antigo)).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Tokens inválidos são rejeitados: chave aleatória, expirado, emissor, audiência, tipo, versão e alg=none")
    void tokensInvalidosSaoRejeitados() throws Exception {
        Usuario admin = criarUsuario(Role.ADMIN);
        SecretKey chaveReal = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        byte[] aleatorio = new byte[64];
        new SecureRandom().nextBytes(aleatorio);

        // sanity: a token built exactly like the server builds them is accepted
        String valido = tokenCom(chaveReal, admin, "access", 300, "agrovendas-api", "agrovendas-web");
        mvc.perform(comToken(get("/api/auth/me"), valido)).andExpect(status().isOk());

        mvc.perform(comToken(get("/api/auth/me"),
                tokenCom(Keys.hmacShaKeyFor(aleatorio), admin, "access", 300, "agrovendas-api", "agrovendas-web")))
                .andExpect(status().isUnauthorized());
        mvc.perform(comToken(get("/api/auth/me"),
                tokenCom(chaveReal, admin, "access", -60, "agrovendas-api", "agrovendas-web")))
                .andExpect(status().isUnauthorized());
        mvc.perform(comToken(get("/api/auth/me"),
                tokenCom(chaveReal, admin, "access", 300, "outro-emissor", "agrovendas-web")))
                .andExpect(status().isUnauthorized());
        mvc.perform(comToken(get("/api/auth/me"),
                tokenCom(chaveReal, admin, "access", 300, "agrovendas-api", "outra-audiencia")))
                .andExpect(status().isUnauthorized());
        mvc.perform(comToken(get("/api/auth/me"),
                tokenCom(chaveReal, admin, "qualquer", 300, "agrovendas-api", "agrovendas-web")))
                .andExpect(status().isUnauthorized());

        // token issued under an older token version (e.g. before a password change)
        Usuario versaoAntiga = new Usuario();
        versaoAntiga.setId(admin.getId());
        versaoAntiga.setTokenVersion(admin.getTokenVersion() + 7);
        mvc.perform(comToken(get("/api/auth/me"),
                tokenCom(chaveReal, versaoAntiga, "access", 300, "agrovendas-api", "agrovendas-web")))
                .andExpect(status().isUnauthorized());

        // unsigned token (alg=none)
        String semAssinatura = Jwts.builder().subject(admin.getId().toString()).claim("tipo", "access").claim("tv", 0)
                .issuer("agrovendas-api").audience().add("agrovendas-web").and()
                .expiration(new Date(System.currentTimeMillis() + 300_000)).compact();
        mvc.perform(comToken(get("/api/auth/me"), semAssinatura)).andExpect(status().isUnauthorized());
        mvc.perform(comToken(get("/api/auth/me"), "isso.nao.e-um-jwt")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Refresh token não autentica chamadas da API, e access token não renova sessão")
    void refreshTokenNaoAutenticaApi() throws Exception {
        Usuario usuario = criarUsuario(Role.OPERADOR);
        JsonNode sessao = login(usuario.getEmail(), SENHA_FORTE);
        String access = sessao.get("accessToken").asText();
        String refresh = sessao.get("refreshToken").asText();

        mvc.perform(comToken(get("/api/vendas"), access)).andExpect(status().isOk());
        mvc.perform(comToken(get("/api/vendas"), refresh)).andExpect(status().isUnauthorized());
        mvc.perform(comToken(get("/api/auth/me"), refresh)).andExpect(status().isUnauthorized());

        mvc.perform(jsonRequest(post("/api/auth/refresh"), Map.of("refreshToken", access))).andExpect(status().isUnauthorized());
        mvc.perform(jsonRequest(post("/api/auth/refresh"), Map.of("refreshToken", refresh))).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Logout revoga o refresh token")
    void logoutRevogaRefreshToken() throws Exception {
        Usuario usuario = criarUsuario(Role.OPERADOR);
        JsonNode sessao = login(usuario.getEmail(), SENHA_FORTE);
        String refresh = sessao.get("refreshToken").asText();

        mvc.perform(jsonRequest(post("/api/auth/logout"), Map.of("refreshToken", refresh))).andExpect(status().isOk());
        mvc.perform(jsonRequest(post("/api/auth/refresh"), Map.of("refreshToken", refresh))).andExpect(status().isUnauthorized());
        mvc.perform(comToken(get("/api/vendas"), refresh)).andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------ deactivated users

    @Test
    @DisplayName("Usuário desativado perde o acesso imediatamente: token, renovação e login")
    void usuarioDesativadoNaoContinuaUsandoOSistema() throws Exception {
        Usuario admin = criarUsuario(Role.ADMIN);
        Usuario operador = criarUsuario(Role.OPERADOR);
        JsonNode sessao = login(operador.getEmail(), SENHA_FORTE);
        String access = sessao.get("accessToken").asText();
        String refresh = sessao.get("refreshToken").asText();
        mvc.perform(comToken(get("/api/vendas"), access)).andExpect(status().isOk());

        mvc.perform(comToken(put("/api/usuarios/" + operador.getId() + "/desativar"), accessToken(admin))).andExpect(status().isOk());

        mvc.perform(comToken(get("/api/vendas"), access)).andExpect(status().isUnauthorized());
        mvc.perform(jsonRequest(post("/api/auth/refresh"), Map.of("refreshToken", refresh))).andExpect(status().isUnauthorized());
        mvc.perform(jsonRequest(post("/api/auth/login"), Map.of("email", operador.getEmail(), "senha", SENHA_FORTE)))
                .andExpect(status().isUnauthorized());

        // reactivation does not resurrect the old tokens
        mvc.perform(comToken(put("/api/usuarios/" + operador.getId() + "/ativar"), accessToken(admin))).andExpect(status().isOk());
        mvc.perform(comToken(get("/api/vendas"), access)).andExpect(status().isUnauthorized());
        login(operador.getEmail(), SENHA_FORTE);
    }

    @Test
    @DisplayName("Conta desativada diretamente no banco também perde o acesso (o filtro confere o banco a cada chamada)")
    void desativacaoDiretaNoBancoTemEfeito() throws Exception {
        Usuario operador = criarUsuario(Role.OPERADOR);
        JsonNode sessao = login(operador.getEmail(), SENHA_FORTE);

        Usuario noBanco = usuarios.findById(operador.getId()).orElseThrow();
        noBanco.setAtivo(false);
        usuarios.save(noBanco);

        mvc.perform(comToken(get("/api/vendas"), sessao.get("accessToken").asText())).andExpect(status().isUnauthorized());
        mvc.perform(jsonRequest(post("/api/auth/refresh"), Map.of("refreshToken", sessao.get("refreshToken").asText())))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------ brute force

    @Test
    @DisplayName("Tentativas excessivas de login são limitadas, inclusive para e-mails que não existem")
    void tentativasExcessivasDeLoginSaoLimitadas() throws Exception {
        Usuario usuario = criarUsuario(Role.OPERADOR);

        for (int i = 0; i < 5; i++) {
            mvc.perform(jsonRequest(post("/api/auth/login"), Map.of("email", usuario.getEmail(), "senha", "errada" + i + "A")))
                    .andExpect(status().isUnauthorized());
        }
        // locked: even the right password is refused until the window passes
        mvc.perform(jsonRequest(post("/api/auth/login"), Map.of("email", usuario.getEmail(), "senha", SENHA_FORTE)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));

        // an address that does not exist behaves the same way, so locking reveals nothing
        String inexistente = "fantasma" + UUID.randomUUID() + "@teste.com";
        for (int i = 0; i < 5; i++) {
            mvc.perform(jsonRequest(post("/api/auth/login"), Map.of("email", inexistente, "senha", "errada" + i + "A")))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(jsonRequest(post("/api/auth/login"), Map.of("email", inexistente, "senha", "errada9A")))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("Login correto antes do limite zera o contador")
    void loginCorretoZeraContador() throws Exception {
        Usuario usuario = criarUsuario(Role.OPERADOR);
        for (int rodada = 0; rodada < 3; rodada++) {
            for (int i = 0; i < 4; i++) {
                mvc.perform(jsonRequest(post("/api/auth/login"), Map.of("email", usuario.getEmail(), "senha", "errada" + i + "A")))
                        .andExpect(status().isUnauthorized());
            }
            login(usuario.getEmail(), SENHA_FORTE);
        }
    }

    // ------------------------------------------------------------------ transport and errors

    @Test
    @DisplayName("CORS: só as origens configuradas são aceitas")
    void corsSoAceitaOrigensConfiguradas() throws Exception {
        mvc.perform(options("/api/vendas").header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "GET").header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        mvc.perform(options("/api/vendas").header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET").header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    @DisplayName("A API envia cabeçalhos de segurança")
    void apiEnviaCabecalhosDeSeguranca() throws Exception {
        mvc.perform(get("/api/vendas").secure(true))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"))
                .andExpect(header().exists("Permissions-Policy"))
                .andExpect(header().exists("Strict-Transport-Security"));
    }

    @Test
    @DisplayName("Entrada inválida vira 400 e rotas inexistentes viram 404, sem vazar detalhes internos")
    void errosNaoVazamDetalhes() throws Exception {
        String token = accessToken(criarUsuario(Role.ADMIN));

        String corpo = mvc.perform(comToken(post("/api/vendas").contentType("application/json").content("{\"data\": "), token))
                .andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();
        assertThat(corpo).doesNotContain("Exception").doesNotContain("at com.").doesNotContain("org.springframework");

        mvc.perform(comToken(get("/api/vendas").param("data", "abc"), token)).andExpect(status().isBadRequest());
        mvc.perform(comToken(delete("/api/vendas/abc"), token)).andExpect(status().isBadRequest());
        mvc.perform(comToken(get("/api/nao-existe"), token)).andExpect(status().isNotFound());
    }

    // ------------------------------------------------------------------ helpers

    private String tokenCom(SecretKey chave, Usuario usuario, String tipo, long validadeSegundos, String emissor, String audiencia) {
        long agora = System.currentTimeMillis();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(emissor)
                .audience().add(audiencia).and()
                .subject(usuario.getId().toString())
                .claim("tipo", tipo)
                .claim("tv", usuario.getTokenVersion())
                .issuedAt(new Date(agora - 120_000))
                .expiration(new Date(agora + validadeSegundos * 1000))
                .signWith(chave)
                .compact();
    }
}
