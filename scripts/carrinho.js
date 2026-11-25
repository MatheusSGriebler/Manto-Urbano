const CARRINHO_KEY = "carrinho";

// ===== LEITURA / ESCRITA NO LOCALSTORAGE =====

function lerCarrinho() {
    const dados = localStorage.getItem(CARRINHO_KEY);
    return dados ? JSON.parse(dados) : [];
}

function salvarCarrinho(carrinho) {
    localStorage.setItem(CARRINHO_KEY, JSON.stringify(carrinho));
}


// ===== ADICIONAR ITEM =====

function normalizarPersonalizacao(valor) {
    if (typeof valor !== "string") return null;
    const texto = valor.trim().slice(0, 60);
    return texto || null;
}

function adicionarAoCarrinho(produto_id, tamanho_prod_id, quantidade, personalizacao = null) {

    const pers = normalizarPersonalizacao(personalizacao);
    console.log("DEBUG: adicionarAoCarrinho recebeu", { produto_id, tamanho_prod_id, quantidade, personalizacao: pers });

    if (!tamanho_prod_id) {
        alert("Selecione um tamanho.");
        return;
    }

    if (!quantidade || quantidade < 1) {
        alert("Quantidade inválida.");
        return;
    }

    const carrinho = lerCarrinho();

    const itemExistente = carrinho.find(
        item =>
            Number(item.produto_id) === Number(produto_id) &&
            Number(item.tamanho_prod_id) === Number(tamanho_prod_id) &&
            normalizarPersonalizacao(item.personalizacao) === pers
    );

    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        carrinho.push({ produto_id, tamanho_prod_id, quantidade, personalizacao: pers });
    }

    salvarCarrinho(carrinho);

    console.log("DEBUG: carrinho salvo =", lerCarrinho());

    abrirModalCarrinho();
}


// ===== RENDERIZAR TABELA DO CARRINHO (carrinho.html) =====

function formatarPreco(valor) {
    return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

function mensagemFreteGratis(quantidade) {
    const faltam = 3 - quantidade;
    return faltam === 1
        ? "Adicione mais 1 camiseta para ganhar frete grátis."
        : `Adicione mais ${faltam} camisetas para ganhar frete grátis.`;
}

function escaparHtml(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

async function cotarCarrinho(carrinho = lerCarrinho()) {
    const resposta = await fetch(API_BASE_URL + "/pedidos/cotacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            itens: carrinho.map(item => ({
                produto_id: Number(item.produto_id),
                tamanho_prod_id: Number(item.tamanho_prod_id),
                quantidade: Number(item.quantidade),
                personalizacao: normalizarPersonalizacao(item.personalizacao),
            })),
        }),
    });

    const dados = await resposta.json();
    if (!resposta.ok) {
        throw new Error(dados.error || "Não foi possível calcular o carrinho.");
    }
    return dados;
}

async function renderizarCarrinho() {

    const carrinho = lerCarrinho();
    const tbody = document.getElementById("lista-itens");

    if (!tbody) return; // só roda na página do carrinho

    if (carrinho.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">Seu carrinho está vazio.</td></tr>`;
        atualizarResumo(null, true);
        return;
    }

    try {
        const cotacao = await cotarCarrinho(carrinho);
        tbody.innerHTML = cotacao.itens.map((item, index) => `
            <tr>
                <td>
                    ${escaparHtml(item.nome)} (Tam: ${escaparHtml(item.tamanho)})
                    ${item.personalizacao ? `<br><small>Personalização: ${escaparHtml(item.personalizacao)}</small>` : ""}
                </td>
                <td>
                    <input type="number" min="1" value="${item.quantidade}"
                        onchange="atualizarQuantidade(${index}, this.value)">
                </td>
                <td>${formatarPreco(item.subtotal)}</td>
                <td><button onclick="removerDoCarrinho(${index})">
                    <i class="fa-solid fa-trash-can" aria-label="Remover"></i>
                </button></td>
            </tr>
        `).join("");
        atualizarResumo(cotacao, false);
    } catch (error) {
        console.error(error);
        tbody.innerHTML = carrinho.map(item => `
            <tr>
                <td colspan="3">Não foi possível validar este item. Remova e adicione novamente.</td>
                <td><button onclick="removerDoCarrinho(${Number(item.produto_id)}, ${Number(item.tamanho_prod_id)})">Remover</button></td>
            </tr>
        `).join("");
        atualizarResumo(null, false, error.message);
    }
}


function atualizarResumo(cotacao, vazio, erro = "") {
    const elProdutos = document.getElementById("resumo-produtos");
    const elTotal = document.getElementById("resumo-total");
    const elFrete = document.getElementById("resumo-frete");
    const elAviso = document.getElementById("frete-aviso");
    const btn = document.getElementById("btn-finalizar");

    if (elProdutos) elProdutos.textContent = cotacao
        ? formatarPreco(cotacao.subtotal_produtos)
        : (vazio ? formatarPreco(0) : "—");
    if (elFrete) elFrete.textContent = cotacao
        ? (cotacao.frete_gratis ? "Grátis" : formatarPreco(cotacao.valor_frete))
        : "—";
    if (elTotal) elTotal.textContent = cotacao
        ? formatarPreco(cotacao.valor_total)
        : (vazio ? formatarPreco(0) : "—");
    if (elAviso) {
        elAviso.textContent = erro || (cotacao?.frete_gratis
            ? "Frete grátis aplicado: 3 ou mais camisetas."
            : cotacao ? mensagemFreteGratis(cotacao.quantidade_itens) : "");
    }
    if (btn) btn.disabled = vazio;
}


// ===== ATUALIZAR QUANTIDADE =====

function atualizarQuantidade(indice, novaQuantidade) {

    novaQuantidade = Number(novaQuantidade);

    if (!novaQuantidade || novaQuantidade < 1) {
        alert("Quantidade inválida.");
        renderizarCarrinho();
        return;
    }

    const carrinho = lerCarrinho();

    if (carrinho[indice]) {
        carrinho[indice].quantidade = novaQuantidade;
        salvarCarrinho(carrinho);
        renderizarCarrinho();
    }
}


// ===== REMOVER ITEM =====

function removerDoCarrinho(indice) {

    const carrinho = lerCarrinho();
    carrinho.splice(indice, 1);

    salvarCarrinho(carrinho);
    renderizarCarrinho();
}


document.addEventListener("DOMContentLoaded", renderizarCarrinho);

// ===== FINALIZAR PEDIDO (CHECKOUT) =====

function irParaCheckout() {

    if (lerCarrinho().length === 0) {
        alert("Seu carrinho está vazio.");
        return;
    }

    if (!estaLogado()) {
       abrirModalLogin();
        return;
    }

    window.location.href = "/checkout.html";
}

function abrirModalCarrinho() {
    document.getElementById("ModalCarrinho")?.classList.add("aberto");
}

function fecharModalCarrinho() {
    document.getElementById("ModalCarrinho")?.classList.remove("aberto");
}

// Esc fecha o modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModalCarrinho();
});
function abrirModalLogin() {
    document.getElementById("ModalLogin")?.classList.add("aberto");
}

function fecharModalLogin() {
    document.getElementById("ModalLogin")?.classList.remove("aberto");
}

// Esc fecha o modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModalLogin();
});