package com.AgroVendas.AgroVendas.security;

import com.AgroVendas.AgroVendas.AbstractIntegrationTest;
import com.AgroVendas.AgroVendas.config.AdminInitializer;
import com.AgroVendas.AgroVendas.exception.TooManyAttemptsException;
import com.AgroVendas.AgroVendas.model.Role;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.service.LoginRateLimiter;
import com.AgroVendas.AgroVendas.service.PasswordPolicy;
import com.AgroVendas.AgroVendas.service.TokenService;
import com.AgroVendas.AgroVendas.service.UsuarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;

import java.lang.reflect.Constructor;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityUnitTests extends AbstractIntegrationTest {

    @Autowired UsuarioService usuarioService;

    // ------------------------------------------------------------------ JWT secret

    @Test
    void aplicacaoNaoIniciaSemSegredoJwt() {
        assertThatThrownBy(() -> new TokenService(null, 900, 604800, 2592000)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new TokenService("  ", 900, 604800, 2592000)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void segredoCurtoEhRecusado() {
        assertThatThrownBy(() -> new TokenService("curto-demais", 900, 604800, 2592000))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("curto");
    }

    @Test
    void segredoPadraoAntigoNuncaMaisEhAceito() {
        String antigo = "SuaChaveSecretaMuitoForteComPeloMenos256BitsParaHMACSHA256SuaChaveSecretaMuitoForteComPeloMenos256Bits";
        assertThatThrownBy(() -> new TokenService(antigo, 900, 604800, 2592000))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("padrão");
    }

    @Test
    void segredoLongoEAleatorioEhAceito() {
        assertThatCode(() -> new TokenService(SECRET, 900, 604800, 2592000)).doesNotThrowAnyException();
    }

    // ------------------------------------------------------------------ password policy

    @Test
    void politicaDeSenhaRejeitaSenhasFracas() {
        for (String fraca : new String[]{null, "", "1234", "abc123", "12345678", "abcdefgh", "password", "Senha123".toLowerCase(),
                "a".repeat(80) + "1"}) {
            assertThatThrownBy(() -> PasswordPolicy.validar(fraca, "alguem@teste.com"))
                    .as("deveria rejeitar: %s", fraca).isInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> PasswordPolicy.validar("joao1234", "joao1234@teste.com")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void politicaDeSenhaAceitaSenhasBoas() {
        assertThatCode(() -> PasswordPolicy.validar("Colheita2026", "a@b.com")).doesNotThrowAnyException();
        assertThatCode(() -> PasswordPolicy.validar("feira do sábado 42", "a@b.com")).doesNotThrowAnyException();
    }

    // ------------------------------------------------------------------ rate limiter

    @Test
    void limitadorLiberaDepoisDaJanela() throws Exception {
        AtomicReference<Instant> agora = new AtomicReference<>(Instant.parse("2026-01-01T00:00:00Z"));
        Clock relogio = new Clock() {
            public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
            public Clock withZone(java.time.ZoneId z) { return this; }
            public Instant instant() { return agora.get(); }
        };
        Constructor<LoginRateLimiter> c = LoginRateLimiter.class.getDeclaredConstructor(int.class, int.class, Duration.class, Clock.class);
        c.setAccessible(true);
        LoginRateLimiter limitador = c.newInstance(3, 100, Duration.ofMinutes(15), relogio);

        for (int i = 0; i < 3; i++) {
            limitador.verificar("a@teste.com", "1.1.1.1");
            limitador.registrarFalha("a@teste.com", "1.1.1.1");
        }
        assertThatThrownBy(() -> limitador.verificar("A@Teste.com ", "9.9.9.9")).isInstanceOf(TooManyAttemptsException.class);
        limitador.verificar("outro@teste.com", "9.9.9.9");

        agora.set(agora.get().plus(Duration.ofMinutes(16)));
        assertThatCode(() -> limitador.verificar("a@teste.com", "1.1.1.1")).doesNotThrowAnyException();
    }

    @Test
    void limitadorTambemLimitaPorEndereco() throws Exception {
        Constructor<LoginRateLimiter> c = LoginRateLimiter.class.getDeclaredConstructor(int.class, int.class, Duration.class, Clock.class);
        c.setAccessible(true);
        LoginRateLimiter limitador = c.newInstance(100, 3, Duration.ofMinutes(15), Clock.systemUTC());
        for (int i = 0; i < 3; i++) {
            limitador.registrarFalha("alvo" + i + "@teste.com", "6.6.6.6");
        }
        assertThatThrownBy(() -> limitador.verificar("novo@teste.com", "6.6.6.6")).isInstanceOf(TooManyAttemptsException.class);
    }

    // ------------------------------------------------------------------ first administrator

    @Test
    void inicializadorPromoveContaExistenteQuandoNaoHaAdmin() {
        Usuario existente = criarUsuario(Role.OPERADOR);
        new AdminInitializer(usuarios, usuarioService, existente.getEmail(), "", "Admin").run(new DefaultApplicationArguments());
        assertThat(usuarios.findById(existente.getId()).orElseThrow().getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void inicializadorCriaAdminQuandoContaNaoExiste() {
        new AdminInitializer(usuarios, usuarioService, "novo.admin@teste.com", "Colheita2026", "Admin").run(new DefaultApplicationArguments());
        Usuario criado = usuarios.findByEmail("novo.admin@teste.com").orElseThrow();
        assertThat(criado.getRole()).isEqualTo(Role.ADMIN);
        assertThat(criado.getSenhaHash()).doesNotContain("Colheita2026").startsWith("$2");
    }

    @Test
    void inicializadorNaoFazNadaQuandoJaExisteAdmin() {
        criarUsuario(Role.ADMIN);
        Usuario operador = criarUsuario(Role.OPERADOR);
        new AdminInitializer(usuarios, usuarioService, operador.getEmail(), "Colheita2026", "Admin").run(new DefaultApplicationArguments());
        assertThat(usuarios.findById(operador.getId()).orElseThrow().getRole()).isEqualTo(Role.OPERADOR);
    }

    @Test
    void inicializadorSemVariaveisNaoCriaNinguem() {
        new AdminInitializer(usuarios, usuarioService, "", "", "Admin").run(new DefaultApplicationArguments());
        assertThat(usuarios.count()).isZero();
    }
}
