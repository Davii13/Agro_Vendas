import { escapeHtml as esc } from "./escapeHtml.ts"

export type HistoricoCliente = {
  cliente: {
    nome: string
    telefone?: string | null
    cpfCnpj?: string | null
    localizacao?: string | null
    observacoes?: string | null
  }
  vendas: {
    data: string
    modeloCaixa: string
    qtdeCaixas6424: number
    caixasPagasVale: number
    caixasDevendoVale: number
    pagamentoVerduras: string
    valorPago: number
    mercadorias: { nome: string; qtde: number; valor: number }[]
  }[]
}

/**
 * HTML of a customer's purchase history, for printing and for the PDF.
 * Every piece of text that came from the database (names, notes, product names) goes through
 * escapeHtml: a customer called `<img onerror=...>` is shown as text, never executed.
 */
export function gerarHistoricoClienteHtml(customerDetails: HistoricoCliente): string {
  const totalVendas = customerDetails.vendas.length
  const totalValor = customerDetails.vendas.reduce((sum, sale) => sum + sale.mercadorias.reduce((total, m) => total + m.qtde * m.valor, 0), 0)

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
      <h1 style="color: #1e3a1f; text-align: center; margin-bottom: 30px;">Histórico de Compras</h1>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #047857; margin: 0 0 10px 0; font-size: 16px;">Cliente: ${esc(customerDetails.cliente.nome)}</h2>
        <p style="margin: 5px 0; font-size: 13px;"><strong>Telefone:</strong> ${esc(customerDetails.cliente.telefone || "N/A")}</p>
        <p style="margin: 5px 0; font-size: 13px;"><strong>Localização:</strong> ${esc(customerDetails.cliente.localizacao || "N/A")}</p>
        <p style="margin: 5px 0; font-size: 13px;"><strong>Observações:</strong> ${esc(customerDetails.cliente.observacoes || "N/A")}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e3a1f; border-bottom: 2px solid #047857; padding-bottom: 10px;">Resumo</h3>
        <p style="font-size: 14px;"><strong>Total de Compras:</strong> ${totalVendas}</p>
        <p style="font-size: 14px;"><strong>Valor Total:</strong> R$ ${totalValor.toFixed(2)}</p>
      </div>
      <div style="margin-top: 20px;">
        <h3 style="color: #1e3a1f; border-bottom: 2px solid #047857; padding-bottom: 10px;">Detalhes das Compras</h3>
        ${customerDetails.vendas.map(sale => {
          const saleTotal = sale.mercadorias.reduce((total, m) => total + m.qtde * m.valor, 0)
          return `
            <div style="border: 1px solid #ddd; padding: 12px; margin-bottom: 12px; border-radius: 5px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong style="color: #1e3a1f;">${new Date(sale.data + "T00:00:00").toLocaleDateString("pt-BR")}</strong>
                <span style="background: ${sale.pagamentoVerduras === "Pago" ? "#dcfce7" : sale.pagamentoVerduras === "Parcial" ? "#fef3c7" : "#fee2e2"}; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">${esc(sale.pagamentoVerduras)}</span>
              </div>
              <p style="margin: 5px 0; font-size: 13px; color: #555;"><strong>Modelo de Caixa:</strong> ${esc(sale.modeloCaixa)}</p>
              <p style="margin: 5px 0; font-size: 13px; color: #555;">${sale.mercadorias.map(m => `${esc(m.nome)} (${esc(m.qtde)})`).join(", ")}</p>
              ${sale.modeloCaixa !== "Papelão" ? `
                <div style="background: #f0fdf4; padding: 8px; border-left: 3px solid #047857; margin: 8px 0; border-radius: 3px;">
                  <p style="margin: 3px 0; font-size: 12px;"><strong>Caixas 6424:</strong> ${esc(sale.qtdeCaixas6424)}</p>
                  <p style="margin: 3px 0; font-size: 12px;"><strong>Pagas (Vale):</strong> ${esc(sale.caixasPagasVale)}</p>
                  <p style="margin: 3px 0; font-size: 12px;"><strong style="color: ${sale.caixasDevendoVale > 0 ? "#dc2626" : "#059669"};">Devendo:</strong> ${esc(sale.caixasDevendoVale)}</p>
                </div>
              ` : ""}
              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
                <div>
                  <p style="margin: 5px 0; font-size: 13px; font-weight: bold; color: #047857;">Total: R$ ${saleTotal.toFixed(2)}</p>
                  ${sale.pagamentoVerduras === "Parcial" ? `<p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>Valor Pago:</strong> R$ ${sale.valorPago.toFixed(2)}</p><p style="margin: 5px 0; font-size: 12px; color: #dc2626;"><strong>Valor Pendente:</strong> R$ ${(saleTotal - sale.valorPago).toFixed(2)}</p>` : ""}
                </div>
              </div>
            </div>
          `
        }).join("")}
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 11px; color: #666;">
        <p>Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
      </div>
    </div>
  `
}
