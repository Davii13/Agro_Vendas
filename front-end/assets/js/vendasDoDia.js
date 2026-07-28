// Dados de vendas
let vendas = [];
const API_URL = 'http://localhost:8080/vendas';

let mercadoriaCount = 0;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Define data atual
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataVenda').value = hoje;
    
    // Event listeners
    document.getElementById('formVenda').addEventListener('submit', salvarVenda);
    document.getElementById('modeloCaixa').addEventListener('change', toggleSecaoCaixa6424);
    document.getElementById('qtdeCaixas6424').addEventListener('input', calcularCaixasDevendo);
    document.getElementById('caixasPagasVale').addEventListener('input', calcularCaixasDevendo);
    document.getElementById('pagamentoVerduras').addEventListener('change', toggleValorPago);
   document.getElementById('dataVenda').addEventListener('change', carregarVendas);
carregarVendas();

});

// Toggle seção caixa 6424
function toggleSecaoCaixa6424() {
    const modelo = document.getElementById('modeloCaixa').value;
    const secao = document.getElementById('secaoCaixa6424');
    
    if (modelo === '6424' || modelo === 'Misto') {
        secao.style.display = 'block';
    } else {
        secao.style.display = 'none';
    }
}

// Calcular caixas devendo
function calcularCaixasDevendo() {
    const total = parseInt(document.getElementById('qtdeCaixas6424').value) || 0;
    const pagas = parseInt(document.getElementById('caixasPagasVale').value) || 0;
    const devendo = Math.max(0, total - pagas);
    document.getElementById('caixasDevendoVale').value = devendo;
}

// Toggle valor pago
function toggleValorPago() {
    const status = document.getElementById('pagamentoVerduras').value;
    const grupo = document.getElementById('grupovalorPago');
    
    if (status === 'Parcial') {
        grupo.style.display = 'block';
    } else {
        grupo.style.display = 'none';
    }
}

// Abrir modal de venda
function abrirModalVenda() {
    document.getElementById('modalVenda').style.display = 'flex';
    document.getElementById('modalTitulo').textContent = 'Registrar Nova Venda';
    document.getElementById('formVenda').reset();
    document.getElementById('vendaId').value = '';
    document.getElementById('listaMercadorias').innerHTML = '';
    document.getElementById('secaoCaixa6424').style.display = 'none';
    document.getElementById('grupovalorPago').style.display = 'none';
    mercadoriaCount = 0;
    adicionarMercadoria();
}
async function carregarVendas() {
    const inputData = document.getElementById('dataVenda');
    if (!inputData) return;

    const data = inputData.value;

    try {
        const response = await fetch(`http://localhost:8080/vendas?data=${data}`);
        vendas = await response.json(); // 🔥 usa a variável GLOBAL
        renderizarVendas();             // 🔥 sem parâmetro
    } catch (error) {
        console.error('Erro ao carregar vendas', error);
    }
}



// Fechar modal de venda
function fecharModalVenda() {
    document.getElementById('modalVenda').style.display = 'none';
}

// Adicionar mercadoria
function adicionarMercadoria(dados = null) {
    const container = document.getElementById('listaMercadorias');
    const index = mercadoriaCount++;
    
    const div = document.createElement('div');
    div.className = 'mercadoria-item';
    div.id = `mercadoria-${index}`;
    div.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Nome da Mercadoria</label>
                <input type="text" name="mercNome${index}" placeholder="Ex: Tomate, Alface..." ${dados ? `value="${dados.nome}"` : ''} required>
            </div>
            <div class="form-group">
                <label>Qtde Caixas</label>
                <input type="number" name="mercQtde${index}" min="1" ${dados ? `value="${dados.qtde}"` : ''} required>
            </div>
            <div class="form-group">
                <label>Valor Unit. (R$)</label>
                <input type="number" name="mercValor${index}" min="0" step="0.01" ${dados ? `value="${dados.valor}"` : ''} required>
            </div>
        </div>
        <button type="button" class="btn-remove" onclick="removerMercadoria(${index})">Remover</button>
    `;
    container.appendChild(div);
}

// Remover mercadoria
function removerMercadoria(index) {
    const item = document.getElementById(`mercadoria-${index}`);
    if (item) {
        item.remove();
    }
}

// Salvar venda
async function salvarVenda(e) {
    e.preventDefault();

    const vendaId = document.getElementById('vendaId').value;
    const data = document.getElementById('dataVenda').value;

    // Coletar mercadorias
    const mercadorias = [];
    const items = document.querySelectorAll('.mercadoria-item');

    items.forEach(item => {
        const nomeInput = item.querySelector('input[name^="mercNome"]');
        const qtdeInput = item.querySelector('input[name^="mercQtde"]');
        const valorInput = item.querySelector('input[name^="mercValor"]');

        if (nomeInput && qtdeInput && valorInput) {
            mercadorias.push({
                nome: nomeInput.value,
                qtde: parseInt(qtdeInput.value),
                valor: parseFloat(valorInput.value)
            });
        }
    });

    if (mercadorias.length === 0) {
        alert('Adicione pelo menos uma mercadoria.');
        return;
    }

    const venda = {
        id: vendaId ? Number(vendaId) : null,
        data: data,
        cliente: document.getElementById('cliente').value,
        modeloCaixa: document.getElementById('modeloCaixa').value,
        qtdeCaixas6424: parseInt(document.getElementById('qtdeCaixas6424').value) || 0,
        caixasPagasVale: parseInt(document.getElementById('caixasPagasVale').value) || 0,
        caixasDevendoVale: parseInt(document.getElementById('caixasDevendoVale').value) || 0,
        pagamentoVerduras: document.getElementById('pagamentoVerduras').value,
        valorPago: parseFloat(document.getElementById('valorPago').value) || 0,
        mercadorias: mercadorias
    };

    try {
        await fetch('http://localhost:8080/vendas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(venda)
        });

        fecharModalVenda();
        carregarVendas();

    } catch (error) {
        console.error('Erro ao salvar venda:', error);
        alert('Erro ao salvar a venda.');
    }
}


// Editar venda
function editarVenda(id) {
    const venda = vendas.find(v => v.id === id);
    if (!venda) return;
    
    document.getElementById('modalVenda').style.display = 'flex';
    document.getElementById('modalTitulo').textContent = 'Editar Venda';
    document.getElementById('vendaId').value = venda.id;
    document.getElementById('cliente').value = venda.cliente;
    document.getElementById('modeloCaixa').value = venda.modeloCaixa;
    document.getElementById('qtdeCaixas6424').value = venda.qtdeCaixas6424;
    document.getElementById('caixasPagasVale').value = venda.caixasPagasVale;
    document.getElementById('caixasDevendoVale').value = venda.caixasDevendoVale;
    document.getElementById('pagamentoVerduras').value = venda.pagamentoVerduras;
    document.getElementById('valorPago').value = venda.valorPago;
    
    // Toggle seções
    toggleSecaoCaixa6424();
    toggleValorPago();
    
    // Adicionar mercadorias
    document.getElementById('listaMercadorias').innerHTML = '';
    mercadoriaCount = 0;
    venda.mercadorias.forEach(merc => {
        adicionarMercadoria(merc);
    });
}

// Excluir venda
async function excluirVenda(id) {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;

    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        carregarVendas();
    } catch (error) {
        console.error('Erro ao excluir venda', error);
    }
}


// Renderizar vendas
function renderizarVendas() {
    const tbody = document.getElementById('tabelaVendas');
    tbody.innerHTML = '';

    let totalVendas = vendas.length;
    let vendasPagas = 0;
    let vendasDevendo = 0;
    let totalCaixas = 0;

    vendas.forEach(venda => {
        const mercadoriasStr = venda.mercadorias.map(m => m.nome).join(', ');
        const qtdeStr = venda.mercadorias.map(m => m.qtde).join(', ');
        const valorStr = venda.mercadorias.map(m => `R$ ${m.valor.toFixed(2)}`).join(', ');

        const totalCaixasVenda = venda.mercadorias.reduce((sum, m) => sum + m.qtde, 0);
        totalCaixas += totalCaixasVenda;

        if (venda.pagamentoVerduras === 'Pago') {
            vendasPagas++;
        } else {
            vendasDevendo++;
        }

        let statusClass = 'status-devendo';
        let statusText = venda.pagamentoVerduras;

        if (venda.pagamentoVerduras === 'Pago') {
            statusClass = 'status-pago';
        } else if (venda.pagamentoVerduras === 'Parcial') {
            statusClass = 'status-parcial';
            statusText = `Parcial (R$ ${venda.valorPago.toFixed(2)})`;
        }

        let caixaValeInfo = '-';
        if (venda.modeloCaixa === '6424' || venda.modeloCaixa === 'Misto') {
            caixaValeInfo = `${venda.caixasPagasVale}/${venda.qtdeCaixas6424} pagas`;
            if (venda.caixasDevendoVale > 0) {
                caixaValeInfo += ` (${venda.caixasDevendoVale} devendo)`;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${venda.cliente}</strong></td>
            <td>${mercadoriasStr}</td>
            <td>${qtdeStr}</td>
            <td>${valorStr}</td>
            <td>${venda.modeloCaixa}</td>
            <td>${caixaValeInfo}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button onclick="editarVenda(${venda.id})">Editar</button>
                <button onclick="excluirVenda(${venda.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('totalVendas').textContent = totalVendas;
    document.getElementById('vendasPagas').textContent = vendasPagas;
    document.getElementById('vendasDevendo').textContent = vendasDevendo;
    document.getElementById('totalCaixas').textContent = totalCaixas;
}

