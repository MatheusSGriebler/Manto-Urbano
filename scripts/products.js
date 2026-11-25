// ===== UTILITÁRIOS =====

function escaparHtml(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function precoBr(valor) {
    return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

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

function imagemDoProduto(produto) {
    const principal = produto.imagens?.find(imagem => imagem.principal)
        ?? produto.imagens?.[0];

    return urlImagemSegura(principal?.url) ?? "/imgs/sem-imagem.png";
}


// ===== CARREGAR PRODUTOS (shop.html, camisetas.html etc) =====

let sequenciaBusca = 0;

function montarUrlProdutos(categoria, filtros = {}) {
    const params = new URLSearchParams();

    if (filtros.busca) params.set("busca", filtros.busca);
    if (filtros.liga) params.set("liga", filtros.liga);
    if (filtros.preco_min) params.set("preco_min", filtros.preco_min);
    if (filtros.preco_max) params.set("preco_max", filtros.preco_max);
    if (filtros.ordem) params.set("ordem", filtros.ordem);

    const base = categoria
        ? `${API_BASE_URL}/produtos/categoria/${categoria}`
        : API_BASE_URL + "/produtos";

    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
}

async function carregarProdutos(categoria, filtros = {}) {

    const container = document.getElementById("cardsProdutos");
    const minhaBusca = ++sequenciaBusca;

    try {

        const resposta = await fetch(montarUrlProdutos(categoria, filtros));

        if (!resposta.ok) {
            throw new Error("Erro ao buscar produtos");
        }

        const produtos = await resposta.json();

        // chegou uma busca mais nova enquanto esta rodava: descarta esta
        if (minhaBusca !== sequenciaBusca) return;

        if (produtos.length === 0) {
            container.innerHTML = "<p>Nenhum produto encontrado.</p>";
            return;
        }

        container.innerHTML = produtos.map(produto => `
            <div class="card" data-produto-id="${produto.id}">
                <img
                    src="${escaparHtml(imagemDoProduto(produto))}"
                    alt="${escaparHtml(produto.nome)}"
                    loading="lazy"
                >
                <h3>${escaparHtml(produto.nome)}</h3>
                <h3>${precoBr(produto.preco)}</h3>
            </div>
        `).join("");

        // um único listener no container, cobre todos os cards
        container.onclick = (evento) => {
            const card = evento.target.closest(".card");
            if (!card) return;

            window.location.href = `produto.html?id=${card.dataset.produtoId}`;
        };

    } catch (error) {

        console.error(error);
        container.innerHTML = "<p>Não foi possível carregar os produtos.</p>";

    }
}

// preenche o select de liga da barra de filtros (GET /ligas)
async function carregarLigasFiltro(select) {
    try {
        const resposta = await fetch(API_BASE_URL + "/ligas");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar ligas");
        }

        const ligas = await resposta.json();

        ligas.forEach(liga => {
            const opcao = document.createElement("option");
            opcao.value = liga.id;
            opcao.textContent = liga.nome;
            select.appendChild(opcao);
        });

    } catch (erro) {
        console.error(erro);
    }
}

// liga a barra de filtros; a página chama iniciarFiltros(categoria)
// no lugar de carregarProdutos(categoria). Sem argumento = todos os produtos.
async function iniciarFiltros(categoria) {

    const form = document.getElementById("filtros");
    const busca = document.getElementById("filtro-busca");
    const liga = document.getElementById("filtro-liga"); // opcional na página
    const min = document.getElementById("filtro-min");
    const max = document.getElementById("filtro-max");
    const ordem = document.getElementById("filtro-ordem");
    const limpar = document.getElementById("filtro-limpar");

    // as opções precisam existir antes de restaurar o valor vindo da URL
    if (liga) {
        await carregarLigasFiltro(liga);
    }

    function aplicar() {
        const filtros = {
            busca: busca.value.trim(),
            liga: liga ? liga.value : "",
            preco_min: min.value,
            preco_max: max.value,
            ordem: ordem.value,
        };

        // reflete na URL: dá pra compartilhar o link e o F5 mantém a busca
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([chave, valor]) => {
            if (valor && !(chave === "ordem" && valor === "recentes")) {
                params.set(chave, valor);
            }
        });
        const qs = params.toString();
        history.replaceState(null, "", qs ? `?${qs}` : location.pathname);

        carregarProdutos(categoria, filtros);
    }

    // restaura os filtros que vieram na URL
    const url = new URLSearchParams(location.search);
    busca.value = url.get("busca") ?? "";
    if (liga) liga.value = url.get("liga") ?? "";
    min.value = url.get("preco_min") ?? "";
    max.value = url.get("preco_max") ?? "";
    ordem.value = url.get("ordem") ?? "recentes";

    // espera 300ms sem digitar antes de buscar
    let timer;
    const aplicarComAtraso = () => {
        clearTimeout(timer);
        timer = setTimeout(aplicar, 300);
    };

    busca.addEventListener("input", aplicarComAtraso);
    min.addEventListener("input", aplicarComAtraso);
    max.addEventListener("input", aplicarComAtraso);
    ordem.addEventListener("change", aplicar);
    if (liga) liga.addEventListener("change", aplicar);

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        aplicar();
    });

    limpar.addEventListener("click", () => {
        form.reset();
        aplicar();
    });

    aplicar();
}


// ===== LISTAR TODOS OS PRODUTOS (usado só no painel admin) =====

async function listarProdutos() {

    const container = document.getElementById("cardsProdutos");

    try {

        // GET /produtos é rota pública, não precisa de token
        const resposta = await fetch(API_BASE_URL + "/produtos");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar produtos");
        }

        const produtos = await resposta.json();

        if (produtos.length === 0) {
            container.innerHTML = "<p>Nenhum produto cadastrado.</p>";
            return;
        }

        container.innerHTML = produtos.map(produto => `
            <div class="card">
                <img
                    src="${escaparHtml(imagemDoProduto(produto))}"
                    alt="${escaparHtml(produto.nome)}"
                    loading="lazy"
                >
                <h3>${escaparHtml(produto.nome)} - ${produto.id}</h3>
                <h3>${precoBr(produto.preco)}</h3>

                <div class="card-acoes">
                    <button type="button" class="btn-editar" onclick="abrirEdicaoProduto(${produto.id})">
                        Editar
                    </button>

                    <button type="button" onclick="deletarProduto(${produto.id})">
                        Remover
                    </button>
                </div>
            </div>
        `).join("");

    } catch (error) {

        console.error(error);
        container.innerHTML = "<p>Erro ao carregar os produtos. Tente novamente.</p>";

    }
}


// ===== REMOVER PRODUTO (só admin; o back desativa em vez de apagar) =====

async function deletarProduto(id) {

    const confirmar = confirm(
        "Remover este produto da loja? Os pedidos antigos continuam com o histórico."
    );

    if (!confirmar) {
        return;
    }

    try {

        const resposta = await fetchAutenticado(
            `${API_BASE_URL}/produtos/${id}`,
            { method: "DELETE" }
        );

        if (!resposta.ok) {
            const data = await resposta.json().catch(() => ({}));
            throw new Error(data.error || data.erro || "Erro ao remover produto");
        }

        alert("Produto removido da loja.");

        listarProdutos();

    } catch (error) {

        console.error(error);
        alert(error.message);

    }
}
