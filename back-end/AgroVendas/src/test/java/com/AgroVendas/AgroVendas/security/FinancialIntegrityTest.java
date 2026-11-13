package com.AgroVendas.AgroVendas.security;

import com.AgroVendas.AgroVendas.AbstractIntegrationTest;
import com.AgroVendas.AgroVendas.model.Fornecedor;
import com.AgroVendas.AgroVendas.model.Mercadoria;
import com.AgroVendas.AgroVendas.model.Role;
import com.AgroVendas.AgroVendas.model.Venda;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The money rules are decided by the server: the client can ask, but cannot dictate the numbers. */
class FinancialIntegrityTest extends AbstractIntegrationTest {

    private String token;

    @BeforeEach
    void preparar() throws Exception {
        mercadorias.save(new Mercadoria(null, "melao"));
        mercadorias.save(new Mercadoria(null, "abacate"));
        token = accessToken(criarUsuario(Role.OPERADOR));
    }

    private Map<String, Object> item(String nome, int qtde, Object valor) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("nome", nome);
        m.put("qtde", qtde);
        m.put("valor", valor);
        return m;
    }

    /** A valid sale: 10 boxes of melao at 50.00 = 500.00 total, paid in full by default. */
    private Map<String, Object> venda() {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("data", "2026-11-11");
        v.put("cliente", "Cliente de teste");
        v.put("modeloCaixa", "6424");
        v.put("qtdeCaixas6424", 10);
        v.put("caixasPagasVale", 4);
        v.put("caixasDevendoVale", 6);
        v.put("pagamentoVerduras", "Pago");
        v.put("valorPago", 500);
        v.put("mercadorias", new ArrayList<>(List.of(item("melao", 10, 50))));
        return v;
    }

    private JsonNode salvarVenda(Map<String, Object> corpo, int statusEsperado) throws Exception {
        String resposta = mvc.perform(comToken(jsonRequest(post("/api/vendas"), corpo), token))
                .andExpect(status().is(statusEsperado)).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta);
    }

    // ------------------------------------------------------------------ rejected values

    @Test
    @DisplayName("Valores negativos ou absurdos em vendas são rejeitados")
    void valoresNegativosSaoRejeitados() throws Exception {
        Map<String, Object> v = venda();
        v.put("mercadorias", List.of(item("melao", -5, 50)));
        salvarVenda(v, 400);

        v = venda();
        v.put("mercadorias", List.of(item("melao", 0, 50)));
        salvarVenda(v, 400);

        v = venda();
        v.put("mercadorias", List.of(item("melao", 10, -100)));
        salvarVenda(v, 400);

        v = venda();
        v.put("mercadorias", List.of(item("melao", 10, 99999999)));
        salvarVenda(v, 400);

        v = venda();
        v.put("mercadorias", List.of(item("melao", 10, "12.345")));
        salvarVenda(v, 400);

        v = venda();
        v.put("qtdeCaixas6424", -50);
        salvarVenda(v, 400);

        v = venda();
        v.put("caixasPagasVale", -1);
        salvarVenda(v, 400);

        v = venda();
        v.put("pagamentoVerduras", "Parcial");
        v.put("valorPago", -10);
        salvarVenda(v, 400);

        assertThat(vendas.count()).isZero();
    }

    @Test
    @DisplayName("Venda sem itens, mercadoria desconhecida e campos inválidos são rejeitados")
    void vendaInconsistenteEhRejeitada() throws Exception {
        Map<String, Object> v = venda();
        v.put("mercadorias", List.of());
        salvarVenda(v, 400);

        v = venda();
        v.put("mercadorias", List.of(item("inventada", 1, 10)));
        salvarVenda(v, 400);

        v = venda();
        v.put("modeloCaixa", "Qualquer");
        salvarVenda(v, 400);

        v = venda();
        v.put("pagamentoVerduras", "Talvez");
        salvarVenda(v, 400);

        v = venda();
        v.put("data", null);
        salvarVenda(v, 400);

        v = venda();
        v.put("caixasPagasVale", 11);
        salvarVenda(v, 400);

        assertThat(vendas.count()).isZero();
    }

    // ------------------------------------------------------------------ sale without a price

    @Test
    @DisplayName("Venda sem preço é aceita e fica como Devendo, mesmo que o cliente peça Pago ou Parcial")
    void vendaSemPrecoFicaDevendo() throws Exception {
        Object[] semPreco = {0, null};
        for (Object valor : semPreco) {
            for (String pedido : new String[]{"Pago", "Parcial", "Devendo"}) {
                Map<String, Object> v = venda();
                v.put("mercadorias", List.of(item("melao", 10, valor)));
                v.put("pagamentoVerduras", pedido);
                v.put("valorPago", 300);
                JsonNode salva = salvarVenda(v, 200);
                assertThat(salva.get("pagamentoVerduras").asText()).as("pedido=%s valor=%s", pedido, valor).isEqualTo("Devendo");
                assertThat(new BigDecimal(salva.get("valorPago").asText())).isEqualByComparingTo("0");
                assertThat(salva.get("mercadorias").get(0).get("valor").decimalValue()).isEqualByComparingTo("0");
            }
        }
    }

    @Test
    @DisplayName("Depois é possível definir o preço editando a venda, e aí o pagamento passa a valer")
    void precoPodeSerDefinidoDepois() throws Exception {
        Map<String, Object> v = venda();
        v.put("mercadorias", List.of(item("melao", 10, null)));
        v.put("pagamentoVerduras", "Pago");
        JsonNode semPreco = salvarVenda(v, 200);
        long id = semPreco.get("id").asLong();
        assertThat(semPreco.get("pagamentoVerduras").asText()).isEqualTo("Devendo");

        Map<String, Object> comPreco = venda();
        comPreco.put("id", id);
        comPreco.put("mercadorias", List.of(item("melao", 10, 50)));
        comPreco.put("pagamentoVerduras", "Pago");
        JsonNode depois = salvarVenda(comPreco, 200);
        assertThat(depois.get("id").asLong()).isEqualTo(id);
        assertThat(depois.get("pagamentoVerduras").asText()).isEqualTo("Pago");
        assertThat(new BigDecimal(depois.get("valorPago").asText())).isEqualByComparingTo("500");
        assertThat(vendas.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Preço negativo continua rejeitado, e uma venda com um item pago e outro sem preço usa só o que tem preço")
    void precoNegativoContinuaRejeitadoEItemSemPrecoNaoQuebraOTotal() throws Exception {
        Map<String, Object> v = venda();
        v.put("mercadorias", List.of(item("melao", 10, -1)));
        salvarVenda(v, 400);

        v = venda();
        v.put("mercadorias", List.of(item("melao", 10, 50), item("abacate", 4, null)));
        v.put("pagamentoVerduras", "Pago");
        JsonNode salva = salvarVenda(v, 200);
        // only the priced item counts: 10 x 50 = 500
        assertThat(new BigDecimal(salva.get("valorPago").asText())).isEqualByComparingTo("500");
        assertThat(salva.get("pagamentoVerduras").asText()).isEqualTo("Pago");
    }

    // ------------------------------------------------------------------ payment status is computed

    @Test
    @DisplayName("Pago: o valor pago é sempre o total, seja qual for o número enviado (inclusive o 99999 do front)")
    void pagoUsaOTotalCalculadoNoServidor() throws Exception {
        for (Object enviado : new Object[]{1, 99999, 0, 500}) {
            Map<String, Object> v = venda();
            v.put("pagamentoVerduras", "Pago");
            v.put("valorPago", enviado);
            JsonNode salva = salvarVenda(v, 200);
            assertThat(salva.get("pagamentoVerduras").asText()).isEqualTo("Pago");
            assertThat(new BigDecimal(salva.get("valorPago").asText())).isEqualByComparingTo("500.00");
        }
    }

    @Test
    @DisplayName("Devendo: nada pago, mesmo que o cliente envie um valor")
    void devendoZeraOValorPago() throws Exception {
        Map<String, Object> v = venda();
        v.put("pagamentoVerduras", "Devendo");
        v.put("valorPago", 500);
        JsonNode salva = salvarVenda(v, 200);
        assertThat(salva.get("pagamentoVerduras").asText()).isEqualTo("Devendo");
        assertThat(new BigDecimal(salva.get("valorPago").asText())).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("Parcial: só vale entre zero e o total, nunca igual ou acima")
    void parcialExigeValorEntreZeroEOTotal() throws Exception {
        for (Object invalido : new Object[]{0, 500, 501, 99999}) {
            Map<String, Object> v = venda();
            v.put("pagamentoVerduras", "Parcial");
            v.put("valorPago", invalido);
            salvarVenda(v, 400);
        }
        Map<String, Object> v = venda();
        v.put("pagamentoVerduras", "Parcial");
        v.put("valorPago", 150.5);
        JsonNode salva = salvarVenda(v, 200);
        assertThat(salva.get("pagamentoVerduras").asText()).isEqualTo("Parcial");
        assertThat(new BigDecimal(salva.get("valorPago").asText())).isEqualByComparingTo("150.50");
    }

    @Test
    @DisplayName("O total é calculado no servidor com vários itens")
    void totalSomaTodosOsItens() throws Exception {
        Map<String, Object> v = venda();
        v.put("mercadorias", List.of(item("melao", 3, "10.10"), item("abacate", 2, "20.05")));
        v.put("pagamentoVerduras", "Pago");
        JsonNode salva = salvarVenda(v, 200);
        // 3 x 10.10 + 2 x 20.05 = 70.40
        assertThat(new BigDecimal(salva.get("valorPago").asText())).isEqualByComparingTo("70.40");
    }

    // ------------------------------------------------------------------ boxes and vales

    @Test
    @DisplayName("Caixas devendo = vendidas - pagas, calculado no servidor; o que o cliente envia é ignorado")
    void caixasDevendoSaoCalculadasNoServidor() throws Exception {
        Map<String, Object> v = venda();
        v.put("qtdeCaixas6424", 10);
        v.put("caixasPagasVale", 4);
        v.put("caixasDevendoVale", -3);
        JsonNode salva = salvarVenda(v, 200);
        assertThat(salva.get("caixasDevendoVale").asInt()).isEqualTo(6);

        v.put("caixasDevendoVale", 999);
        assertThat(salvarVenda(v, 200).get("caixasDevendoVale").asInt()).isEqualTo(6);
    }

    @Test
    @DisplayName("Modelo 6424: a quantidade de caixas 6424 vem dos itens, seja qual for o número enviado")
    void caixas6424VemDosItens() throws Exception {
        for (int enviado : new int[]{0, 3, 10, 999}) {
            Map<String, Object> v = venda();
            v.put("modeloCaixa", "6424");
            v.put("mercadorias", List.of(item("melao", 7, 50), item("abacate", 5, 10)));
            v.put("qtdeCaixas6424", enviado);
            v.put("caixasPagasVale", 2);
            JsonNode salva = salvarVenda(v, 200);
            assertThat(salva.get("qtdeCaixas6424").asInt()).as("enviado=%d", enviado).isEqualTo(12);
            assertThat(salva.get("caixasDevendoVale").asInt()).isEqualTo(10);
        }
    }

    @Test
    @DisplayName("Modelo 6424: pagas com vale não podem passar das caixas dos itens")
    void valePagoNaoPassaDasCaixasDosItens() throws Exception {
        Map<String, Object> v = venda();
        v.put("modeloCaixa", "6424");
        v.put("mercadorias", List.of(item("melao", 4, 50)));
        v.put("caixasPagasVale", 5);
        salvarVenda(v, 400);
        v.put("caixasPagasVale", 4);
        assertThat(salvarVenda(v, 200).get("caixasDevendoVale").asInt()).isZero();
    }

    @Test
    @DisplayName("Modelo Misto: a quantidade de 6424 é informada, mas nunca passa do total de caixas")
    void mistoNaoPassaDoTotalDeCaixas() throws Exception {
        Map<String, Object> v = venda();
        v.put("modeloCaixa", "Misto");
        v.put("mercadorias", List.of(item("melao", 10, 50)));
        v.put("qtdeCaixas6424", 6);
        v.put("caixasPagasVale", 2);
        JsonNode salva = salvarVenda(v, 200);
        assertThat(salva.get("qtdeCaixas6424").asInt()).isEqualTo(6);
        assertThat(salva.get("caixasDevendoVale").asInt()).isEqualTo(4);

        v.put("qtdeCaixas6424", 11);
        salvarVenda(v, 400);
    }

    @Test
    @DisplayName("Papelão não tem vale: as caixas 6424 são zeradas")
    void papelaoNaoGeraVale() throws Exception {
        Map<String, Object> v = venda();
        v.put("modeloCaixa", "Papelão");
        v.put("qtdeCaixas6424", 8);
        v.put("caixasPagasVale", 8);
        JsonNode salva = salvarVenda(v, 200);
        assertThat(salva.get("qtdeCaixas6424").asInt()).isZero();
        assertThat(salva.get("caixasPagasVale").asInt()).isZero();
        assertThat(salva.get("caixasDevendoVale").asInt()).isZero();
    }

    @Test
    @DisplayName("Devolução de vales: só até o que está devendo, e nunca mais caixas pagas do que vendidas")
    void devolucaoDeValesNaoExcedeOQueFoiVendido() throws Exception {
        Map<String, Object> v = venda();
        v.put("qtdeCaixas6424", 10);
        v.put("caixasPagasVale", 4);
        JsonNode original = salvarVenda(v, 200);
        long id = original.get("id").asLong();

        // returning 6 boxes (the whole debt) is fine: it is an edit of the same sale
        Map<String, Object> devolucao = venda();
        devolucao.put("id", id);
        devolucao.put("caixasPagasVale", 10);
        JsonNode depois = salvarVenda(devolucao, 200);
        assertThat(depois.get("id").asLong()).isEqualTo(id);
        assertThat(depois.get("caixasDevendoVale").asInt()).isZero();

        // returning one more than was ever sold is refused and changes nothing
        devolucao.put("caixasPagasVale", 11);
        salvarVenda(devolucao, 400);
        Venda noBanco = vendas.findById(id).orElseThrow();
        assertThat(noBanco.getCaixasPagasVale()).isEqualTo(10);
        assertThat(vendas.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Editar uma venda inexistente devolve 404, e não 500")
    void editarVendaInexistente() throws Exception {
        Map<String, Object> v = venda();
        v.put("id", 987654);
        salvarVenda(v, 404);
    }

    // ------------------------------------------------------------------ deliveries

    private Fornecedor fornecedor(String nome) {
        Fornecedor f = new Fornecedor();
        f.setNome(nome);
        f.setAreaCeasa("A1");
        return fornecedores.save(f);
    }

    private Map<String, Object> entrega() {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("data", "2026-11-11");
        e.put("valorTotal", 1500);
        e.put("valorPago", 500);
        e.put("valesPagos", 4);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("nomeMercadoria", "melao");
        m.put("quantidadeCaixa6424", 10);
        m.put("quantidadePapelao", 0);
        e.put("mercadorias", new ArrayList<>(List.of(m)));
        return e;
    }

    private JsonNode salvarEntrega(long fornecedorId, Map<String, Object> corpo, int statusEsperado) throws Exception {
        String resposta = mvc.perform(comToken(jsonRequest(post("/api/fornecedores/" + fornecedorId + "/entregas"), corpo), token))
                .andExpect(status().is(statusEsperado)).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta);
    }

    @Test
    @DisplayName("Entrega: pagamento maior que o total, vales acima das caixas e valores negativos são rejeitados")
    void entregaInconsistenteEhRejeitada() throws Exception {
        Fornecedor f = fornecedor("Produtor A");

        Map<String, Object> e = entrega();
        e.put("valorPago", 1500.01);
        salvarEntrega(f.getId(), e, 400);

        e = entrega();
        e.put("valesPagos", 11);
        salvarEntrega(f.getId(), e, 400);

        e = entrega();
        e.put("valorTotal", -1);
        salvarEntrega(f.getId(), e, 400);

        e = entrega();
        e.put("valorPago", -1);
        salvarEntrega(f.getId(), e, 400);

        e = entrega();
        e.put("valesPagos", -1);
        salvarEntrega(f.getId(), e, 400);

        e = entrega();
        ((Map<String, Object>) ((List<?>) e.get("mercadorias")).get(0)).put("quantidadeCaixa6424", -5);
        salvarEntrega(f.getId(), e, 400);

        e = entrega();
        ((Map<String, Object>) ((List<?>) e.get("mercadorias")).get(0)).put("quantidadeCaixa6424", 0);
        e.put("valesPagos", 0);
        salvarEntrega(f.getId(), e, 400);

        e = entrega();
        e.put("mercadorias", List.of());
        salvarEntrega(f.getId(), e, 400);

        assertThat(entregas.count()).isZero();
    }

    @Test
    @DisplayName("Entrega válida é salva; quitar (pago = total, vales = caixas) é aceito")
    void entregaValidaEQuitacao() throws Exception {
        Fornecedor f = fornecedor("Produtor A");
        JsonNode salva = salvarEntrega(f.getId(), entrega(), 200);
        assertThat(new BigDecimal(salva.get("valorPago").asText())).isEqualByComparingTo("500");

        Map<String, Object> quitada = entrega();
        quitada.put("id", salva.get("id").asLong());
        quitada.put("valorPago", 1500);
        quitada.put("valesPagos", 10);
        JsonNode depois = salvarEntrega(f.getId(), quitada, 200);
        assertThat(depois.get("id").asLong()).isEqualTo(salva.get("id").asLong());
        assertThat(entregas.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Uma entrega não pode ser movida para outro produtor editando-a por outra URL")
    void entregaNaoMudaDeFornecedor() throws Exception {
        Fornecedor a = fornecedor("Produtor A");
        Fornecedor b = fornecedor("Produtor B");
        long entregaId = salvarEntrega(a.getId(), entrega(), 200).get("id").asLong();

        Map<String, Object> mover = entrega();
        mover.put("id", entregaId);
        salvarEntrega(b.getId(), mover, 400);

        assertThat(entregas.findById(entregaId).orElseThrow().getFornecedor().getId()).isEqualTo(a.getId());
    }

    @Test
    @DisplayName("Fornecedor, cliente e mercadoria com campos inválidos são rejeitados")
    void outrosCadastrosValidamEntrada() throws Exception {
        mvc.perform(comToken(jsonRequest(post("/api/fornecedores"), Map.of("nome", "  ", "areaCeasa", "A1")), token))
                .andExpect(status().isBadRequest());
        mvc.perform(comToken(jsonRequest(post("/api/fornecedores"), Map.of("nome", "x".repeat(151), "areaCeasa", "A1")), token))
                .andExpect(status().isBadRequest());
        mvc.perform(comToken(jsonRequest(post("/api/clientes"), Map.of("nome", "Ok", "observacoes", "x".repeat(2001))), token))
                .andExpect(status().isBadRequest());
        mvc.perform(comToken(jsonRequest(post("/api/mercadorias"), Map.of("nome", "x".repeat(151))), token))
                .andExpect(status().isBadRequest());
        mvc.perform(comToken(jsonRequest(post("/api/mercadorias"), Map.of("nome", "")), token))
                .andExpect(status().isBadRequest());
    }
}
