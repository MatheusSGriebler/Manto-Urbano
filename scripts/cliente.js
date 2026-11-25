function escaparHtml(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function moeda(valor) {
    return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

function dataBr(valor) {
    const d = new Date(valor);
    return isNaN(d) ? "" : d.toLocaleDateString("pt-BR");
}

// ===== NAVEGAÇÃO ENTRE SEÇÕES =====

function mostrarSecao(nome) {
    document.querySelectorAll(".secao").forEach(secao => {
        secao.hidden = secao.id !== `secao-${nome}`;
    });

    document.querySelectorAll("[data-secao]").forEach(link => {
        link.classList.toggle("ativo", link.dataset.secao === nome);
    });

    history.replaceState(null, "", `#${nome}`);
}

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pagamento") === "sucesso") {
        localStorage.removeItem("carrinho");
        history.replaceState(null, "", window.location.pathname);
    }
});

async function carregarMeusPedidos() {
    const container = document.getElementById("pedidosCliente");

    try {
        const resposta = await fetchAutenticado(API_BASE_URL + "/pedidos/meus");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar seus pedidos.");
        }

        const pedidos = await resposta.json();

        if (pedidos.length === 0) {
            container.innerHTML = "<p>Você ainda não fez nenhum pedido.</p>";
            return;
        }

        container.innerHTML = pedidos.map(pedido => {

            const itensHtml = pedido.itens.map(item => {
                const tamanho = item.tamanho_prod?.tamanho?.nome ?? "-";
                const nome = item.produto?.nome ?? "Produto removido";
                return `<li>${item.quantidade}x ${escaparHtml(nome)} (Tam: ${escaparHtml(tamanho)})${item.personalizacao ? ` — Pers: ${escaparHtml(item.personalizacao)}` : ""}</li>`;
            }).join("");

            const rastreioHtml = pedido.rastreio
                ? `<p><strong>Rastreio:</strong> ${escaparHtml(pedido.rastreio.codigo)}
                   <small>(${escaparHtml(pedido.rastreio.transportadora)})</small></p>`
                : `<p class="aviso"><strong>Rastreio:</strong> ainda não disponível</p>`;

            const e = pedido.endereco;
            const enderecoHtml = e
                ? `<p class="entrega"><strong>Entrega:</strong>
                   ${escaparHtml(e.nome_recebedor)} · ${escaparHtml(e.endereco)}, ${escaparHtml(e.numero)}
                   ${escaparHtml(e.complemento ?? "")} · ${escaparHtml(e.bairro)},
                   ${escaparHtml(e.cidade)}/${escaparHtml(e.estado)}</p>`
                : "";

            const status = String(pedido.status ?? "").toLowerCase();

            return `
                <article class="pedido">
                    <header>
                        <div>
                            <strong>Pedido #${pedido.id}</strong>
                            <small>${dataBr(pedido.data_add)}</small>
                        </div>
                        <span class="status status-${escaparHtml(status)}">${escaparHtml(pedido.status)}</span>
                    </header>

                    <ul>${itensHtml}</ul>

                    ${enderecoHtml}
                    ${rastreioHtml}

                    <p class="total">${moeda(pedido.valor_total)}</p>
                </article>
            `;
        }).join("");

    } catch (erro) {
        console.error(erro);
        container.innerHTML = "<p>Erro ao carregar seus pedidos. Tente novamente.</p>";
    }
}

// ===== INFORMAÇÕES E ENDEREÇOS =====

function preencherConta() {
    const cliente = getClienteLogado();
    if (!cliente) return;

    document.getElementById("conta-nome").textContent = cliente.nome;
    document.getElementById("conta-email").textContent = cliente.email;
}

async function carregarEnderecosConta() {
    const container = document.getElementById("lista-enderecos-conta");

    try {
        const resposta = await fetchAutenticado(API_BASE_URL + "/enderecos");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar endereços");
        }

        const enderecos = await resposta.json();

        if (enderecos.length === 0) {
            container.innerHTML = "<p>Nenhum endereço salvo. Você pode cadastrar um na hora de finalizar uma compra.</p>";
            return;
        }

        container.innerHTML = enderecos.map(e => `
            <div class="endereco-card">
                <div>
                    <strong>${escaparHtml(e.identificacao)}</strong><br>
                    ${escaparHtml(e.nome_recebedor)}<br>
                    ${escaparHtml(e.endereco)}, ${escaparHtml(e.numero)} ${escaparHtml(e.complemento ?? "")}<br>
                    ${escaparHtml(e.bairro)} - ${escaparHtml(e.cidade)}/${escaparHtml(e.estado)} · CEP ${escaparHtml(e.cep)}
                </div>
                <button type="button" class="btn-remover" onclick="removerEndereco(${e.id})">Remover</button>
            </div>
        `).join("");

    } catch (erro) {
        console.error(erro);
        container.innerHTML = "<p>Não foi possível carregar seus endereços.</p>";
    }
}

// ===== MODAL DE CONFIRMAÇÃO (REMOVER ENDEREÇO) =====

let enderecoParaRemover = null;

// chamada pelo botão "Remover" do card: só abre o modal
function removerEndereco(id) {
    enderecoParaRemover = id;

    const erro = document.getElementById("confirmar-erro");
    erro.textContent = "";
    erro.hidden = true;

    document.getElementById("btn-confirmar-remover").disabled = false;
    document.getElementById("ModalConfirmar").classList.add("aberto");
}

function fecharModalConfirmar() {
    enderecoParaRemover = null;
    document.getElementById("ModalConfirmar").classList.remove("aberto");
}

async function confirmarRemocaoEndereco() {
    if (!enderecoParaRemover) return;

    const botao = document.getElementById("btn-confirmar-remover");
    const erro = document.getElementById("confirmar-erro");

    botao.disabled = true; // evita clique duplo

    try {
        const resposta = await fetchAutenticado(`${API_BASE_URL}/enderecos/${enderecoParaRemover}`, {
            method: "DELETE",
        });

        if (!resposta.ok) {
            const data = await resposta.json().catch(() => ({}));
            throw new Error(data.erro || data.error || "Erro ao remover endereço.");
        }

        fecharModalConfirmar();
        carregarEnderecosConta();

    } catch (e) {
        console.error(e);
        erro.textContent = e.message;
        erro.hidden = false;
        botao.disabled = false;
    }
}

// ===== INICIALIZAÇÃO =====

document.addEventListener("DOMContentLoaded", () => {

    if (!estaLogado()) {
        document.getElementById("areaCliente").innerHTML =
            `<p>Você precisa <a href="/login.html">entrar na sua conta</a> para ver esta página.</p>`;
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

    // Esc fecha o modal de confirmação
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") fecharModalConfirmar();
    });

    preencherConta();
    carregarMeusPedidos();
    carregarEnderecosConta();

    // abre direto na seção do link (ex: cliente.html#informacoes)
    const inicial = location.hash === "#informacoes" ? "informacoes" : "pedidos";
    mostrarSecao(inicial);
});