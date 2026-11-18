const SECOES = ["cadastrar", "produtos", "ligas", "vendas"];

let ligasCache = []; // pra achar o nome da liga na hora de confirmar a remoção

function mostrarSecao(nome) {
    if (!SECOES.includes(nome)) {
        nome = "vendas"; // tela inicial
    }

    document.querySelectorAll(".secao").forEach(secao => {
        secao.hidden = secao.id !== `secao-${nome}`;
    });

    document.querySelectorAll("[data-secao]").forEach(link => {
        link.classList.toggle("ativo", link.dataset.secao === nome);
    });

    history.replaceState(null, "", `#${nome}`);

    if (nome === "produtos") listarProdutos();
    if (nome === "vendas") listarPedidos();
    if (nome === "ligas") listarLigasAdmin();
}

async function carregarCategorias() {
    const select = document.getElementById("categoria");

    try {
        const resposta = await fetch("http://localhost:3000/categorias");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar categorias");
        }

        const categorias = await resposta.json();

        categorias.forEach(categoria => {
            const opcao = document.createElement("option");
            opcao.value = categoria.id;
            opcao.textContent = categoria.nome;
            select.appendChild(opcao);
        });

    } catch (erro) {
        console.error(erro);
    }
}

// preenche o select de liga do cadastro de produto (pode ser chamada de novo
// depois de criar ou remover uma liga: mantém só o "Selecione..." e recarrega)
async function carregarLigas() {
    const select = document.getElementById("liga");

    try {
        const resposta = await fetch("http://localhost:3000/ligas");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar ligas");
        }

        const ligas = await resposta.json();
        const selecionada = select.value;

        select.options.length = 1; // mantém o placeholder

        ligas.forEach(liga => {
            const opcao = document.createElement("option");
            opcao.value = liga.id;
            opcao.textContent = liga.nome;
            select.appendChild(opcao);
        });

        // se a liga escolhida ainda existe, continua selecionada
        if (selecionada && ligas.some(l => String(l.id) === selecionada)) {
            select.value = selecionada;
        }

    } catch (erro) {
        console.error(erro);
    }
}

// ===== LIGAS (aba de cadastro) =====

function mostrarMsgLiga(texto, tipo) {
    const msg = document.getElementById("ligaMsg");

    if (!texto) {
        msg.hidden = true;
        return;
    }

    msg.textContent = texto;
    msg.className = `liga-msg ${tipo}`;
    msg.hidden = false;
}

async function listarLigasAdmin() {
    const container = document.getElementById("listaLigas");

    try {
        const resposta = await fetch("http://localhost:3000/ligas");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar ligas");
        }

        ligasCache = await resposta.json();

        if (ligasCache.length === 0) {
            container.innerHTML = `<p class="liga-vazio">Nenhuma liga cadastrada ainda.</p>`;
            return;
        }

        container.innerHTML = ligasCache.map(liga => `
            <div class="liga-item">
                <span class="liga-nome">${escaparHtml(liga.nome)}</span>
                <button type="button" class="btn-deletar" onclick="removerLiga(${liga.id})">Remover</button>
            </div>
        `).join("");

    } catch (erro) {
        console.error(erro);
        container.innerHTML = `<p class="liga-vazio">Erro ao carregar as ligas. Tente novamente.</p>`;
    }
}

async function criarLiga(evento) {
    evento.preventDefault();

    const input = document.getElementById("ligaNome");
    const botao = document.getElementById("btnCriarLiga");
    const nome = input.value.trim();

    if (!nome) {
        mostrarMsgLiga("Digite o nome da liga.", "erro");
        return;
    }

    botao.disabled = true; // evita clique duplo
    mostrarMsgLiga("");

    try {
        const resposta = await fetchAutenticado("http://localhost:3000/ligas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome })
        });

        const data = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(data.error || "Erro ao cadastrar liga.");
        }

        input.value = "";
        mostrarMsgLiga(`Liga "${data.nome}" cadastrada!`, "ok");

        listarLigasAdmin();
        carregarLigas(); // atualiza o select do cadastro de produto

    } catch (erro) {
        console.error(erro);
        mostrarMsgLiga(erro.message, "erro");

    } finally {
        botao.disabled = false;
        input.focus();
    }
}

async function removerLiga(id) {
    const liga = ligasCache.find(l => l.id === id);
    const nome = liga ? liga.nome : "esta liga";

    const confirmar = confirm(
        `Remover "${nome}"? Os produtos dela continuam na loja, mas ficam sem liga.`
    );

    if (!confirmar) {
        return;
    }

    try {
        const resposta = await fetchAutenticado(`http://localhost:3000/ligas/${id}`, {
            method: "DELETE"
        });

        if (!resposta.ok) {
            const data = await resposta.json().catch(() => ({}));
            throw new Error(data.error || "Erro ao remover liga.");
        }

        mostrarMsgLiga(`Liga "${nome}" removida.`, "ok");

        listarLigasAdmin();
        carregarLigas();

    } catch (erro) {
        console.error(erro);
        mostrarMsgLiga(erro.message, "erro");
    }
}

function cancelarCadastro() {
    document.getElementById("formProduto").reset();
    imagens = [];       // lista de imagens do addProduct.js
    mostrarImagens();
}

document.addEventListener("DOMContentLoaded", async () => {

    if (!estaLogado()) {
        window.location.href = "/index.html";
        return;
    }

    // confirma com o back que a conta é admin (o localStorage não prova nada)
    try {
        const resposta = await fetchAutenticado("http://localhost:3000/pedidos");

        if (resposta.status === 401 || resposta.status === 403) {
            window.location.href = "/index.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error("Erro ao validar acesso");
        }

    } catch (erro) {
        console.error(erro);
        alert("Não foi possível validar seu acesso. Tente novamente.");
        return;
    }

    document.querySelectorAll("[data-secao]").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarSecao(link.dataset.secao);
        });
    });

    document.getElementById("btn-sair").addEventListener("click", (e) => {
        e.preventDefault();
        logout();
    });

    carregarCategorias();
    carregarLigas();
    mostrarSecao(location.hash.slice(1));
});