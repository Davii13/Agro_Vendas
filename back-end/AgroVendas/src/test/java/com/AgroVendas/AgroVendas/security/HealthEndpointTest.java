package com.AgroVendas.AgroVendas.security;

import com.AgroVendas.AgroVendas.AbstractIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HealthEndpointTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("O health check é público e só diz que está no ar")
    void healthEPublicoESemDetalhes() throws Exception {
        String corpo = mvc.perform(get("/api/health")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(corpo).isEqualTo("{\"status\":\"UP\"}");
    }

    @Test
    @DisplayName("Liberar o health check não abre mais nada: só GET nessa rota é público")
    void healthNaoAbreOutrasRotas() throws Exception {
        mvc.perform(post("/api/health")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/health")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/health/qualquer")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/vendas")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/usuarios")).andExpect(status().isUnauthorized());
    }
}
