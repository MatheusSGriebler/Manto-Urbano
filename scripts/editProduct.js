// scripts/editProduct.js
// Modal de edição de produto (painel admin). O HTML do modal é criado aqui.

const EDICAO_API = API_BASE_URL;

function edicaoUrlImagemSegura(valor) {
    if (typeof valor !== "string" || !valor.trim()) return "/imgs/sem-imagem.png";

    try {
        const url = new URL(valor, window.location.origin);
        if (url.protocol === "https:" || url.origin === window.location.origin) {
            return url.href;
        }
    } catch {
        // URL inválida: usa a imagem padrão.
    }

    return "/imgs/sem-imagem.png";
}

let edicaoProdutoId = null;
let edicaoTotalImagens = 0;
let edicaoMudouImagens = false;

function criarModalEdicao() {
    if (document.getElementById("ModalEditar")) return;

    const modal = document.createElement("div");
    modal.id = "ModalEditar";
    modal.className = "modal-editar";

    modal.innerHTML = `
        <div class="modal-editar-box">
            <button type="button" class="modal-editar-fechar" onclick="fecharEdicaoProduto()" aria-label="Fechar">&times;</button>

            <h2>Editar produto</h2>
            <p class="modal-editar-sub" id="edit-sub">Carregando...</p>

            <div id="edit-conteudo" hidden>
                <form id="formEditar">

                    <div class="campo">
                        <label for="edit-nome">Nome do produto</label>
                        <input id="edit-nome" type="text" maxlength="150" required>
                    </div>

                    <div class="campo">
                        <label for="edit-desc">Descrição</label>
                        <textarea id="edit-desc" maxlength="2000"></textarea>
                    </div>

                    <div class="linha-campos">
                        <div class="campo">
                            <label for="edit-preco">Preço</label>
                            <div class="input-preco">
                                <span>R$</span>
                                <input id="edit-preco" type="number" step="0.01" min="0" required>
                            </div>
                        </div>

                        <div class="campo">
                            <label for="edit-categoria">Categoria</label>
                            <select id="edit-categoria" required></select>
                        </div>

                        <div class="campo">
                            <label for="edit-liga">Liga</label>
                            <select id="edit-liga"></select>
                        </div>
                    </div>

                    <h3>Estoque por tamanho</h3>
                    <div class="tamanhos-grid" id="edit-tamanhos"></div>

                    <h3>Imagens</h3>
                    <p class="modal-editar-sub">Adicionar, remover e trocar a principal vale na hora, sem precisar salvar.</p>

                    <div class="edit-imagens" id="edit-imagens"></div>

                    <div class="campo">
                        <label for="edit-imagem-url">Adicionar imagem (URL)</label>
                        <input
                            id="edit-imagem-url"
                            type="url"
                            placeholder="https://exemplo.com/imagem.jpg"
                            onkeydown="if (event.key === 'Enter') { event.preventDefault(); edicaoAdicionarImagem(); }"
                        >
                    </div>

                    <div class="imagem-opcoes">
                        <label class="check-principal">
                            <input type="checkbox" id="edit-imagem-principal">
                            Definir como imagem principal
                        </label>

                        <button type="button" class="btn-imagem" onclick="edicaoAdicionarImagem()">
                            + Adicionar imagem
                        </button>
                    </div>

                    <p class="edit-erro" id="edit-erro" hidden></p>

                    <div class="edit-acoes">
                        <button type="button" class="btn-cancelar" onclick="fecharEdicaoProduto()">Cancelar</button>
                        <button type="submit" class="btn-adicionar" id="btn-salvar-edicao">Salvar alterações</button>
                    </div>

                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // clicar no fundo escuro fecha
    modal.addEventListener("click", (e) => {
        if (e.target === modal) fecharEdicaoProduto();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") fecharEdicaoProduto();
    });

    document.getElementById("formEditar").addEventListener("submit", salvarEdicaoProduto);
}

function mostrarErroEdicao(texto) {
    const erro = document.getElementById("edit-erro");
    if (!erro) return;

    erro.textContent = texto;
    erro.hidden = !texto;
}

async function edicaoBuscarJson(url) {
    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error("Erro ao carregar dados.");
    }

    return resposta.json();
}

async function edicaoChamarApi(url, opcoes, mensagemErro) {
    const resposta = await fetchAutenticado(url, opcoes);

    if (!resposta.ok) {
        const data = await resposta.json().catch(() => ({}));
        throw new Error(data.error || data.erro || mensagemErro);
    }

    return resposta;
}

function edicaoPreencherSelect(select, itens, selecionado, textoVazio) {
    select.innerHTML =
        `<option value="">${textoVazio}</option>` +
        itens.map(item =>
            `<option value="${item.id}">${escaparHtml(item.nome)}</option>`
        ).join("");

    select.value = selecionado ? String(selecionado) : "";
}

function edicaoRenderTamanhos(tamanhos) {
    const container = document.getElementById("edit-tamanhos");

    const ordenados = [...tamanhos].sort(
        (a, b) => (a.tamanho?.id ?? 0) - (b.tamanho?.id ?? 0)
    );

    container.innerHTML = ordenados.map(t => {
        const nome = t.tamanho?.nome ?? "?";

        return `
            <div class="tamanho-item">
                <span class="tamanho-nome">${escaparHtml(nome)}</span>
                <input
                    type="number"
                    min="0"
                    step="1"
                    data-tamanho="${escaparHtml(nome)}"
                    value="${Number(t.estoque) || 0}"
                    placeholder="Estoque"
                >
            </div>
        `;
    }).join("");
}

function edicaoRenderImagens(imagens) {
    const container = document.getElementById("edit-imagens");

    edicaoTotalImagens = imagens.length;

    if (imagens.length === 0) {
        container.innerHTML = `<p class="liga-vazio">Nenhuma imagem cadastrada.</p>`;
        return;
    }

    container.innerHTML = imagens.map((img, i) => `
        <div class="imagem-item">
            <img src="${escaparHtml(edicaoUrlImagemSegura(img.url))}" alt="Imagem do produto">

            <div class="imagem-info">
                <span>${img.principal ? "⭐ Imagem principal" : "Imagem " + (i + 1)}</span>

                ${img.principal ? "" : `
                    <button type="button" class="btn-principal" onclick="edicaoTornarPrincipal(${img.id})">
                        Tornar principal
                    </button>
                `}

                <button type="button" onclick="edicaoRemoverImagem(${img.id})">Remover</button>
            </div>
        </div>
    `).join("");
}

async function edicaoRecarregarImagens() {
    const produto = await edicaoBuscarJson(`${EDICAO_API}/produtos/${edicaoProdutoId}`);
    edicaoRenderImagens(produto.imagens ?? []);
}

async function abrirEdicaoProduto(id) {
    criarModalEdicao();

    edicaoProdutoId = id;
    edicaoMudouImagens = false;
    mostrarErroEdicao("");

    document.getElementById("edit-sub").textContent = "Carregando...";
    document.getElementById("edit-conteudo").hidden = true;
    document.getElementById("ModalEditar").classList.add("aberto");

    try {
        const [produto, categorias, ligas] = await Promise.all([
            edicaoBuscarJson(`${EDICAO_API}/produtos/${id}`),
            edicaoBuscarJson(`${EDICAO_API}/categorias`),
            edicaoBuscarJson(`${EDICAO_API}/ligas`),
        ]);

        // fechou (ou abriu outro) enquanto carregava
        if (edicaoProdutoId !== id) return;

        document.getElementById("edit-nome").value = produto.nome ?? "";
        document.getElementById("edit-desc").value = produto.desc ?? "";
        document.getElementById("edit-preco").value = produto.preco ?? "";

        edicaoPreencherSelect(
            document.getElementById("edit-categoria"),
            categorias,
            produto.categoria_id ?? produto.categoria?.id,
            "Selecione..."
        );

        edicaoPreencherSelect(
            document.getElementById("edit-liga"),
            ligas,
            produto.liga_id ?? produto.liga?.id,
            "Sem liga"
        );

        edicaoRenderTamanhos(produto.tamanhos ?? []);
        edicaoRenderImagens(produto.imagens ?? []);

        document.getElementById("edit-imagem-url").value = "";
        document.getElementById("edit-imagem-principal").checked = false;

        document.getElementById("edit-sub").textContent = `Produto #${produto.id}`;
        document.getElementById("edit-conteudo").hidden = false;

    } catch (erro) {
        console.error(erro);
        document.getElementById("edit-sub").textContent =
            "Não foi possível carregar o produto. Feche e tente novamente.";
    }
}

function fecharEdicaoProduto() {
    const modal = document.getElementById("ModalEditar");
    if (!modal || !modal.classList.contains("aberto")) return;

    modal.classList.remove("aberto");
    edicaoProdutoId = null;

    // se mexeu nas imagens, a lista de produtos atrás do modal precisa atualizar
    if (edicaoMudouImagens) {
        edicaoMudouImagens = false;
        listarProdutos();
    }
}

// ===== IMAGENS (aplicam na hora) =====

async function edicaoAdicionarImagem() {
    const input = document.getElementById("edit-imagem-url");
    const checkbox = document.getElementById("edit-imagem-principal");
    const url = input.value.trim();

    if (!url) {
        mostrarErroEdicao("Digite a URL da imagem.");
        return;
    }

    mostrarErroEdicao("");

    try {
        await edicaoChamarApi(`${EDICAO_API}/imagens`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                produto_id: edicaoProdutoId,
                url,
                // a primeira imagem do produto já entra como principal
                principal: checkbox.checked || edicaoTotalImagens === 0,
            }),
        }, "Erro ao adicionar imagem.");

        input.value = "";
        checkbox.checked = false;
        edicaoMudouImagens = true;

        await edicaoRecarregarImagens();

    } catch (erro) {
        console.error(erro);
        mostrarErroEdicao(erro.message);
    }
}

async function edicaoTornarPrincipal(imagemId) {
    mostrarErroEdicao("");

    try {
        await edicaoChamarApi(`${EDICAO_API}/imagens/${imagemId}/principal`, {
            method: "PUT",
        }, "Erro ao trocar a imagem principal.");

        edicaoMudouImagens = true;
        await edicaoRecarregarImagens();

    } catch (erro) {
        console.error(erro);
        mostrarErroEdicao(erro.message);
    }
}

async function edicaoRemoverImagem(imagemId) {
    mostrarErroEdicao("");

    try {
        await edicaoChamarApi(`${EDICAO_API}/imagens/${imagemId}`, {
            method: "DELETE",
        }, "Erro ao remover imagem.");

        edicaoMudouImagens = true;
        await edicaoRecarregarImagens();

    } catch (erro) {
        console.error(erro);
        mostrarErroEdicao(erro.message);
    }
}

// ===== SALVAR (dados do produto + estoque) =====

async function salvarEdicaoProduto(evento) {
    evento.preventDefault();

    const botao = document.getElementById("btn-salvar-edicao");
    mostrarErroEdicao("");

    const nome = document.getElementById("edit-nome").value.trim();
    const desc = document.getElementById("edit-desc").value;
    const preco = Number(document.getElementById("edit-preco").value);
    const categoria = document.getElementById("edit-categoria").value;
    const liga = document.getElementById("edit-liga").value;

    if (!nome) {
        mostrarErroEdicao("Digite o nome do produto.");
        return;
    }

    if (!(preco > 0)) {
        mostrarErroEdicao("Informe um preço maior que zero.");
        return;
    }

    if (!categoria) {
        mostrarErroEdicao("Selecione a categoria.");
        return;
    }

    const tamanhos = {};

    for (const input of document.querySelectorAll("#edit-tamanhos [data-tamanho]")) {
        const estoque = Number(input.value);

        if (!Number.isInteger(estoque) || estoque < 0) {
            mostrarErroEdicao(`Estoque inválido no tamanho ${input.dataset.tamanho}.`);
            return;
        }

        tamanhos[input.dataset.tamanho] = estoque;
    }

    const dados = {
        nome,
        desc,
        preco,
        categoria_id: Number(categoria),
    };

    if (liga) dados.liga_id = Number(liga);
    if (Object.keys(tamanhos).length > 0) dados.tamanhos = tamanhos;

    botao.disabled = true; // evita clique duplo

    try {
        await edicaoChamarApi(`${EDICAO_API}/produtos/${edicaoProdutoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        }, "Erro ao salvar o produto.");

        edicaoMudouImagens = false; // a lista é recarregada logo abaixo
        fecharEdicaoProduto();
        listarProdutos();

    } catch (erro) {
        console.error(erro);
        mostrarErroEdicao(erro.message);

    } finally {
        botao.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", criarModalEdicao);
