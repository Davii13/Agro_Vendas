// Carregar dados do localStorage
let fornecedores = JSON.parse(localStorage.getItem('fornecedores')) || [];
let entregas = JSON.parse(localStorage.getItem('entregas')) || [];
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Define data atual
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataEstoque').value = hoje;
    
    document.getElementById('dataEstoque').addEventListener('change', atualizarEstoque);
    
    atualizarEstoque();
});

function atualizarEstoque() {
    const dataSelecionada = document.getElementById('dataEstoque').value;
    
    // Filtrar entregas do dia
    const entregasDoDia = entregas.filter(e => e.data === dataSelecionada);
    
    // Filtrar vendas do dia
    const vendasDoDia = vendas.filter(v => v.data === dataSelecionada);
    
    // Calcular estoque consolidado por mercadoria
    const estoqueConsolidado = {};
    const fornecedoresAtivos = new Set();
    
    entregasDoDia.forEach(entrega => {
        const fornecedor = fornecedores.find(f => f.id === entrega.fornecedorId);
        const nomeFornecedor = fornecedor ? fornecedor.nome : 'Desconhecido';
        fornecedoresAtivos.add(entrega.fornecedorId);
        
        entrega.mercadorias.forEach(merc => {
            if (!estoqueConsolidado[merc.nome]) {
                estoqueConsolidado[merc.nome] = {
                    totalCaixas: 0,
                    caixasPapelao: 0,
                    caixas6424: 0,
                    fornecedores: new Set()
                };
            }
            
            estoqueConsolidado[merc.nome].totalCaixas += merc.qtde;
            if (merc.modelo === 'Papelão') {
                estoqueConsolidado[merc.nome].caixasPapelao += merc.qtde;
            } else {
                estoqueConsolidado[merc.nome].caixas6424 += merc.qtde;
            }
            estoqueConsolidado[merc.nome].fornecedores.add(nomeFornecedor);
        });
    });
    
    // Calcular vendas por mercadoria
    const vendasPorMercadoria = {};
    vendasDoDia.forEach(venda => {
        venda.mercadorias.forEach(merc => {
            if (!vendasPorMercadoria[merc.nome]) {
                vendasPorMercadoria[merc.nome] = 0;
            }
            vendasPorMercadoria[merc.nome] += merc.qtde;
        });
    });
    
    // Atualizar resumo
    const totalMercadorias = Object.keys(estoqueConsolidado).length;
    let totalCaixas = 0;
    let totalCaixas6424 = 0;
    
    Object.values(estoqueConsolidado).forEach(item => {
        totalCaixas += item.totalCaixas;
        totalCaixas6424 += item.caixas6424;
    });
    
    document.getElementById('totalMercadorias').textContent = totalMercadorias;
    document.getElementById('totalCaixas').textContent = totalCaixas;
    document.getElementById('fornecedoresAtivos').textContent = fornecedoresAtivos.size;
    document.getElementById('caixas6424').textContent = totalCaixas6424;
    
    // Renderizar tabela de estoque consolidado
    renderizarEstoqueConsolidado(estoqueConsolidado);
    
    // Renderizar entregas do dia
    renderizarEntregasDia(entregasDoDia);
    
    // Renderizar comparativo
    renderizarComparativo(estoqueConsolidado, vendasPorMercadoria);
}

function renderizarEstoqueConsolidado(estoque) {
    const tbody = document.getElementById('tabelaEstoqueConsolidado');
    tbody.innerHTML = '';
    
    const mercadorias = Object.keys(estoque).sort();
    
    if (mercadorias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>Nenhuma entrega registrada para este dia.</p></td></tr>';
        return;
    }
    
    mercadorias.forEach(nome => {
        const item = estoque[nome];
        const fornecedoresStr = Array.from(item.fornecedores).join(', ');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${nome}</strong></td>
            <td>${item.totalCaixas}</td>
            <td>${item.caixasPapelao > 0 ? `<span class="modelo-caixa modelo-papelao">${item.caixasPapelao}</span>` : '-'}</td>
            <td>${item.caixas6424 > 0 ? `<span class="modelo-caixa modelo-6424">${item.caixas6424}</span>` : '-'}</td>
            <td>${fornecedoresStr}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarEntregasDia(entregasDoDia) {
    const tbody = document.getElementById('tabelaEntregasDia');
    tbody.innerHTML = '';
    
    if (entregasDoDia.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><p>Nenhuma entrega recebida neste dia.</p></td></tr>';
        return;
    }
    
    entregasDoDia.forEach(entrega => {
        const fornecedor = fornecedores.find(f => f.id === entrega.fornecedorId);
        const nomeFornecedor = fornecedor ? fornecedor.nome : 'Desconhecido';
        
        entrega.mercadorias.forEach((merc, index) => {
            const modeloClass = merc.modelo === 'Papelão' ? 'modelo-papelao' : 'modelo-6424';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index === 0 ? `<strong>${nomeFornecedor}</strong>` : ''}</td>
                <td>${merc.nome}</td>
                <td>${merc.qtde}</td>
                <td><span class="modelo-caixa ${modeloClass}">${merc.modelo}</span></td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function renderizarComparativo(estoque, vendasPorMercadoria) {
    const tbody = document.getElementById('tabelaComparativo');
    tbody.innerHTML = '';
    
    // Juntar todas as mercadorias (recebidas e vendidas)
    const todasMercadorias = new Set([
        ...Object.keys(estoque),
        ...Object.keys(vendasPorMercadoria)
    ]);
    
    if (todasMercadorias.size === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>Nenhum dado disponível para este dia.</p></td></tr>';
        return;
    }
    
    const mercadoriasOrdenadas = Array.from(todasMercadorias).sort();
    
    mercadoriasOrdenadas.forEach(nome => {
        const recebido = estoque[nome] ? estoque[nome].totalCaixas : 0;
        const vendido = vendasPorMercadoria[nome] || 0;
        const saldo = recebido - vendido;
        
        let statusClass, statusText, saldoClass;
        if (saldo > 0) {
            statusClass = 'status-positivo';
            statusText = 'Em estoque';
            saldoClass = 'saldo-positivo';
        } else if (saldo < 0) {
            statusClass = 'status-negativo';
            statusText = 'Faltando';
            saldoClass = 'saldo-negativo';
        } else {
            statusClass = 'status-zerado';
            statusText = 'Zerado';
            saldoClass = 'saldo-zerado';
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${nome}</strong></td>
            <td>${recebido}</td>
            <td>${vendido}</td>
            <td class="${saldoClass}">${saldo > 0 ? '+' : ''}${saldo}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);
    });
}
