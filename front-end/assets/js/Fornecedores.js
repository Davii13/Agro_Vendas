// ================= API =================
const API_BASE = 'http://localhost:8080/api';


// Dados
let fornecedores = [];
let entregasFornecedor = [];
let todasEntregas = [];


let fornecedorAtual = null;
let mercadoriaEntregaCount = 0;

// Inicializacao
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('formFornecedor').addEventListener('submit', salvarFornecedor);
    document.getElementById('formEntrega').addEventListener('submit', salvarEntrega);
    
    // Data padrao para entregas
    document.getElementById('dataEntrega').value = new Date().toISOString().split('T')[0];
    
    carregarFornecedores();

});

// === FORNECEDORES ===

function abrirModalFornecedor() {
    document.getElementById('modalFornecedor').style.display = 'flex';
    document.getElementById('modalFornecedorTitulo').textContent = 'Cadastrar Fornecedor';
    document.getElementById('formFornecedor').reset();
    document.getElementById('fornecedorId').value = '';
}

function fecharModalFornecedor() {
    document.getElementById('modalFornecedor').style.display = 'none';
}
function renderizarFornecedores() {
    const container = document.getElementById('listaFornecedores');
    container.innerHTML = '';

    if (!fornecedores || fornecedores.length === 0) {
        container.innerHTML = `
            <p class="empty-message">
                Nenhum fornecedor cadastrado. Clique em "+ Novo Fornecedor" para começar.
            </p>
        `;
        return;
    }

    fornecedores.forEach(fornecedor => {

        // Conta quantas entregas esse fornecedor possui
       const totalEntregas = 0; // ou remova essa info do card


        const card = document.createElement('div');
        card.className = 'fornecedor-card';

        card.innerHTML = `
            <h3>${fornecedor.nome}</h3>

            <p class="info-row">
                <span class="icon-small">&#128205;</span>
                ${fornecedor.areaCeasa}
            </p>

          <p class="total-entregas">
    <span class="icon-small">&#128230;</span>
    Clique em "Ver Entregas"
</p>


            <div class="fornecedor-actions">
                <button 
                    class="btn-action btn-view"
                    onclick="abrirModalEntregas('${fornecedor.id}')">
                    Ver Entregas
                </button>

                <button 
                    class="btn-action btn-edit"
                    onclick="editarFornecedor('${fornecedor.id}', event)">
                    Editar
                </button>

                <button 
                    class="btn-action btn-delete"
                    onclick="excluirFornecedor('${fornecedor.id}', event)">
                    Excluir
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}



async function salvarFornecedor(e) {
    e.preventDefault();

    const id = document.getElementById('fornecedorId').value;

    const fornecedor = {
        nome: document.getElementById('nomeFornecedor').value,
        areaCeasa: document.getElementById('areaCeasa').value
    };

    try {
        if (id) {
            // EDITAR fornecedor
            await fetch(`${API_BASE}/fornecedores/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fornecedor)
            });
        } else {
            // CRIAR fornecedor
            await fetch(`${API_BASE}/fornecedores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fornecedor)
            });
        }

        await carregarFornecedores();
        fecharModalFornecedor();

    } catch (error) {
        console.error('Erro ao salvar fornecedor:', error);
        alert('Erro ao salvar fornecedor.');
    }
}



function editarFornecedor(id, event) {
    event.stopPropagation();
    
    const fornecedor = fornecedores.find(f => f.id === id);
    if (!fornecedor) return;
    
    document.getElementById('modalFornecedor').style.display = 'flex';
    document.getElementById('modalFornecedorTitulo').textContent = 'Editar Fornecedor';
    document.getElementById('fornecedorId').value = fornecedor.id;
    document.getElementById('nomeFornecedor').value = fornecedor.nome;
    document.getElementById('areaCeasa').value = fornecedor.areaCeasa || '';
}

async function excluirFornecedor(id, event) {

    event.stopPropagation();
    
    if (confirm('Tem certeza que deseja excluir este fornecedor? Todas as entregas serao removidas.')) {
        entregasFornecedor = [];

        entregas = entregas.filter(e => e.fornecedorId !== id);
        await fetch(`${API_BASE}/fornecedores/${id}`, { method: 'DELETE' });
        await carregarFornecedores();
       

    }
}

async function carregarFornecedores() {
    const res = await fetch(`${API_BASE}/fornecedores`);
    fornecedores = await res.json();
    renderizarFornecedores();
}

// === ENTREGAS ===

function abrirModalEntregas(fornecedorId) {
    fornecedorId = Number(fornecedorId);
    fornecedorAtual = fornecedorId;

    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    if (!fornecedor) {
        alert('Fornecedor não encontrado');
        return;
    }

    document.getElementById('modalEntregas').style.display = 'flex';
    document.getElementById('modalEntregasTitulo').textContent =
        `Entregas - ${fornecedor.nome}`;

    carregarEntregas(fornecedorId);
}


function fecharModalEntregas() {
    document.getElementById('modalEntregas').style.display = 'none';
    fornecedorAtual = null;
}

function abrirModalNovaEntrega() {
    document.getElementById('modalNovaEntrega').style.display = 'flex';
    document.getElementById('modalNovaEntregaTitulo').textContent = 'Registrar Entrega';
    document.getElementById('formEntrega').reset();
    document.getElementById('entregaId').value = '';
    document.getElementById('entregaFornecedorId').value = fornecedorAtual;
    document.getElementById('dataEntrega').value = new Date().toISOString().split('T')[0];
    document.getElementById('listaMercadoriasEntrega').innerHTML = '';
    mercadoriaEntregaCount = 0;
    adicionarMercadoriaEntrega();
}

function fecharModalNovaEntrega() {
    document.getElementById('modalNovaEntrega').style.display = 'none';
}

function adicionarMercadoriaEntrega(dados = null) {
    const container = document.getElementById('listaMercadoriasEntrega');
    const index = mercadoriaEntregaCount++;

    const div = document.createElement('div');
    div.className = 'mercadoria-item';
    div.id = `mercadoria-entrega-${index}`;

    div.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Mercadoria</label>
                <input 
                    type="text"
                    name="entregaMercNome${index}"
                    placeholder="Ex: Tomate, Alface..."
                    value="${dados ? dados.nomeMercadoria : ''}"
                    required
                >
            </div>

            <div class="form-group">
                <label>Caixas 6424</label>
                <input 
                    type="number"
                    name="entregaMercCaixas6424_${index}"
                    min="0"
                    value="${dados ? dados.quantidadeCaixa6424 : 0}"
                >
            </div>

            <div class="form-group">
                <label>Caixas Papelão</label>
                <input 
                    type="number"
                    name="entregaMercCaixasPapelao_${index}"
                    min="0"
                    value="${dados ? dados.quantidadePapelao : 0}"
                >
            </div>
        </div>

        <button 
            type="button"
            class="btn-remove"
            onclick="removerMercadoriaEntrega(${index})">
            Remover
        </button>
    `;

    container.appendChild(div);
}


function removerMercadoriaEntrega(index) {
    const item = document.getElementById(`mercadoria-entrega-${index}`);
    if (item) {
        item.remove();
    }
}

async function salvarEntrega(e) {
    e.preventDefault();

    const entregaId = document.getElementById('entregaId').value;
    const fornecedorId = document.getElementById('entregaFornecedorId').value;
    const dataEntrega = document.getElementById('dataEntrega').value;

    // Coletar mercadorias
    const mercadorias = [];
    const items = document.querySelectorAll('#listaMercadoriasEntrega .mercadoria-item');

    items.forEach((item) => {
        const nomeInput = item.querySelector('input[name^="entregaMercNome"]');
        const caixas6424Input = item.querySelector('input[name^="entregaMercCaixas6424"]');
        const caixasPapelaoInput = item.querySelector('input[name^="entregaMercCaixasPapelao"]');

        if (nomeInput && nomeInput.value.trim() !== '') {
            mercadorias.push({
                nomeMercadoria: nomeInput.value,
                quantidadeCaixa6424: parseInt(caixas6424Input.value) || 0,
                quantidadePapelao: parseInt(caixasPapelaoInput.value) || 0
            });
        }
    });

    if (mercadorias.length === 0) {
        alert('Adicione pelo menos uma mercadoria.');
        return;
    }

    const entrega = {
        data: dataEntrega,
        mercadorias: mercadorias
    };

    try {
        await fetch(`${API_BASE}/fornecedores/${fornecedorId}/entregas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entrega)
        });

     fecharModalNovaEntrega();
await carregarEntregas(fornecedorId);
await carregarFornecedores();


    } catch (error) {
        console.error('Erro ao salvar entrega:', error);
        alert('Erro ao salvar a entrega.');
    }
}


function editarEntrega(id) {
    const entrega = entregasFornecedor.find(e => e.id === id);

    if (!entrega) return;
    
    document.getElementById('modalNovaEntrega').style.display = 'flex';
    document.getElementById('modalNovaEntregaTitulo').textContent = 'Editar Entrega';
    document.getElementById('entregaId').value = entrega.id;
    document.getElementById('entregaFornecedorId').value = entrega.fornecedorId;
    document.getElementById('dataEntrega').value = entrega.data;
    
    document.getElementById('listaMercadoriasEntrega').innerHTML = '';
    mercadoriaEntregaCount = 0;
    entrega.mercadorias.forEach(merc => {
        adicionarMercadoriaEntrega(merc);
    });
}

async function excluirEntrega(id) {
    if (!confirm('Tem certeza que deseja excluir esta entrega?')) {
        return;
    }

    try {
        await fetch(`${API_BASE}/entregas/${id}`, {
            method: 'DELETE'
        });

        // Recarrega as entregas do fornecedor atual
        await carregarEntregas(fornecedorAtual);

        // Atualiza os cards de fornecedores
        await carregarFornecedores();

    } catch (error) {
        console.error('Erro ao excluir entrega:', error);
        alert('Erro ao excluir a entrega.');
    }
}

function renderizarEntregas() {
    const tbody = document.getElementById('tabelaEntregas');
    tbody.innerHTML = '';

    let total6424 = 0;
    let totalPapelao = 0;

    if (!entregasFornecedor || entregasFornecedor.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">
                    Nenhuma entrega registrada.
                </td>
            </tr>
        `;
        document.getElementById('totalCaixas6424').textContent = '0';
        document.getElementById('totalCaixasPapelao').textContent = '0';
        return;
    }

    entregasFornecedor.sort((a, b) => new Date(b.data) - new Date(a.data));

    entregasFornecedor.forEach(entrega => {
        entrega.mercadorias.forEach((merc, index) => {

            total6424 += merc.quantidadeCaixa6424 || 0;
            totalPapelao += merc.quantidadePapelao || 0;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index === 0 ? formatarData(entrega.data) : ''}</td>
                <td>${merc.nomeMercadoria}</td>
                <td>${merc.quantidadeCaixa6424 || 0}</td>
                <td>${merc.quantidadePapelao || 0}</td>
                <td>
                    ${index === 0 ? `
                        <button onclick="editarEntrega(${entrega.id})">Editar</button>
                        <button onclick="excluirEntrega(${entrega.id})">Excluir</button>
                    ` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });
    });

    document.getElementById('totalCaixas6424').textContent = total6424;
    document.getElementById('totalCaixasPapelao').textContent = totalPapelao;
}




function formatarData(dataStr) {
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');

    

}
// ================= BACKEND =================



async function carregarEntregas(fornecedorId) {
    const res = await fetch(`${API_BASE}/fornecedores/${fornecedorId}/entregas`);
    entregasFornecedor = await res.json();
    renderizarEntregas();
}

