// pega o ?id= da URL
function getProdutoIdDaUrl() {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("id"));
}

let produtoAtual = null; // guarda o produto carregado pra usar no botão de adicionar

function urlImagemSegura(valor) {
    if (typeof valor !== "string" || !valor.trim()) return null;

    try {
        const url = new URL(valor, window.location.origin);
        if (url.protocol === "https:" || url.origin === window.location.origin) {
            return url.href;
        }
    } catch {
        // URL inválida: usa a imagem padrão.
    }

    return null;
}

async function carregarProduto() {

    const id = getProdutoIdDaUrl();

    if (!id) {
        mostrarErroProduto();
        return;
    }

    try {

        const resposta = await fetch(`http://localhost:3000/produtos/${id}`);

        if (!resposta.ok) {
            throw new Error("Produto não encontrado");
        }

        const produto = await resposta.json();
        produtoAtual = produto;

        renderizarProduto(produto);

    } catch (error) {

        console.error(error);
        mostrarErroProduto();

    }
}

function mostrarErroProduto() {
    document.getElementById("produto-erro").style.display = "block";
    document.getElementById("produto-detalhe").style.display = "none";
}

function renderizarProduto(produto) {

    document.getElementById("produto-erro").style.display = "none";
    document.getElementById("produto-detalhe").style.display = "flex";

    // ===== GALERIA DE IMAGENS =====
    const imagens = (produto.imagens ?? [])
        .map(img => ({ ...img, urlSegura: urlImagemSegura(img.url) }))
        .filter(img => img.urlSegura);
    const imagemPrincipal = imagens.find(img => img.principal) ?? imagens[0];

    const elImagemPrincipal = document.getElementById("imagem-principal");
    elImagemPrincipal.src = imagemPrincipal?.urlSegura ?? "/imgs/sem-imagem.png";
    elImagemPrincipal.alt = produto.nome;

    const miniaturasContainer = document.getElementById("miniaturas");
    miniaturasContainer.replaceChildren();

    if (imagens.length > 1) {
        imagens.forEach(img => {
            const miniatura = document.createElement("img");
            miniatura.src = img.urlSegura;
            miniatura.alt = produto.nome;
            miniatura.className = `miniatura ${img.id === imagemPrincipal?.id ? "ativa" : ""}`;
            miniatura.addEventListener("click", () => trocarImagemPrincipal(img.urlSegura, miniatura));
            miniaturasContainer.appendChild(miniatura);
        });
    }

    // ===== INFO BÁSICA =====
    document.getElementById("produto-nome").textContent = produto.nome;
    document.getElementById("produto-desc").textContent = produto.desc ?? "";

    const precoFormatado = Number(produto.preco).toFixed(2).replace(".", ",");
    document.getElementById("produto-preco").textContent = `R$ ${precoFormatado}`;

    // ===== SELECT DE TAMANHOS =====
    const tamanhos = (produto.tamanhos ?? []).filter(t => t.estoque > 0);
    const selectTamanho = document.getElementById("select-tamanho");
    const btnAdicionar = document.getElementById("btn-adicionar");
    const inputQtd = document.getElementById("input-qtd");

    if (tamanhos.length === 0) {
        selectTamanho.innerHTML = `<option value="" disabled selected>Sem estoque</option>`;
        btnAdicionar.disabled = true;
        inputQtd.disabled = true;
    } else {
        selectTamanho.innerHTML = tamanhos
            .map(t => `<option value="${t.id}" data-estoque="${t.estoque}">${t.tamanho.nome}</option>`)
            .join("");

        atualizarInfoEstoque(); // já mostra o estoque do primeiro tamanho selecionado
    }

    selectTamanho.addEventListener("change", atualizarInfoEstoque);
}

function trocarImagemPrincipal(url, elMiniatura) {
    document.getElementById("imagem-principal").src = url;

    document.querySelectorAll(".miniatura").forEach(el => el.classList.remove("ativa"));
    elMiniatura.classList.add("ativa");
}

function atualizarInfoEstoque() {
    const select = document.getElementById("select-tamanho");
    const opcaoSelecionada = select.options[select.selectedIndex];
    const estoque = Number(opcaoSelecionada?.dataset.estoque ?? 0);

    const inputQtd = document.getElementById("input-qtd");
    inputQtd.max = estoque;

    // se a quantidade digitada for maior que o estoque do novo tamanho, ajusta
    if (Number(inputQtd.value) > estoque) {
        inputQtd.value = estoque;
    }

    document.getElementById("estoque-info").textContent = `${estoque} em estoque`;
}

function adicionarProdutoAtualAoCarrinho() {

    if (!produtoAtual) {
        console.log("DEBUG: produtoAtual está vazio!", produtoAtual);
        return;
    }

    const selectTamanho = document.getElementById("select-tamanho");
    const inputQtd = document.getElementById("input-qtd");

    const tamanho_prod_id = Number(selectTamanho.value);
    const quantidade = Number(inputQtd.value);
    const estoqueDisponivel = Number(selectTamanho.options[selectTamanho.selectedIndex]?.dataset.estoque ?? 0);

    console.log("DEBUG: valores capturados", {
        produto_id: produtoAtual.id,
        tamanho_prod_id,
        quantidade,
        estoqueDisponivel,
    });

    if (!tamanho_prod_id) {
        alert("Selecione um tamanho.");
        return;
    }

    if (!quantidade || quantidade < 1) {
        alert("Quantidade inválida.");
        return;
    }

    if (quantidade > estoqueDisponivel) {
        alert(`Apenas ${estoqueDisponivel} unidade(s) disponível(is) nesse tamanho.`);
        return;
    }

    console.log("DEBUG: chamando adicionarAoCarrinho...");
    adicionarAoCarrinho(produtoAtual.id, tamanho_prod_id, quantidade);
}

document.addEventListener("DOMContentLoaded", carregarProduto);
