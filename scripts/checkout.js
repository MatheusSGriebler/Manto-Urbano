function cadastrarEndereco() {
    document.getElementById("modalOverlay").classList.add("aberto");
}

function fecharModal() {
    document.getElementById("modalOverlay").classList.remove("aberto");
}

document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") {
        fecharModal();
    }
});
let enderecoSelecionado = null;

function escaparHtml(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function carregarEnderecos() {
    const container = document.getElementById("lista-enderecos");

    try {
        const resposta = await fetchAutenticado(API_BASE_URL + "/enderecos");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar endereços");
        }

        const enderecos = await resposta.json();

        if (enderecos.length === 0) {
            container.innerHTML = "<p>Nenhum endereço cadastrado.</p>";
            enderecoSelecionado = null;
            return;
        }

        // mantém a seleção atual; se não houver, pega o mais recente (o primeiro da lista)
        const aindaExiste = enderecos.some(e => e.id === enderecoSelecionado);
        if (!aindaExiste) {
            enderecoSelecionado = enderecos[0].id;
        }

        container.innerHTML = enderecos.map(e => `
            <label class="endereco-opcao">
                <input
                    type="radio"
                    name="endereco"
                    value="${e.id}"
                    ${e.id === enderecoSelecionado ? "checked" : ""}
                    onchange="enderecoSelecionado = ${e.id}"
                >
                <span>
                    <strong>${escaparHtml(e.identificacao)}</strong><br>
                    ${escaparHtml(e.nome_recebedor)}<br>
                    ${escaparHtml(e.endereco)}, ${escaparHtml(e.numero)} ${escaparHtml(e.complemento ?? "")}<br>
                    ${escaparHtml(e.bairro)} - ${escaparHtml(e.cidade)}/${escaparHtml(e.estado)} · CEP ${escaparHtml(e.cep)}
                </span>
            </label>
        `).join("");

    } catch (erro) {
        console.error(erro);
        container.innerHTML = "<p>Não foi possível carregar os endereços.</p>";
    }
}

document.getElementById("form-endereco").addEventListener("submit", async (e) => {
    e.preventDefault();

    const campo = id => document.getElementById(id).value.trim();

    const dados = {
        identificacao: campo("identificacao"),
        nome_recebedor: campo("nomeRecebedor"),
        cep: campo("cep").replace(/\D/g, ""),
        endereco: campo("endereco"),
        numero: campo("numero"),
        complemento: campo("complemento"),
        bairro: campo("bairro"),
        cidade: campo("cidade"),
        estado: campo("estado"),
        referencia: campo("referencia"),
        telefone: campo("telefone").replace(/\D/g, ""),
    };

    const botao = document.getElementById("btn-salvar-endereco");
    botao.disabled = true;

    try {
        const resposta = await fetchAutenticado(API_BASE_URL + "/enderecos", {
            method: "POST",
            body: JSON.stringify(dados),
        });

        const data = await resposta.json();

        if (!resposta.ok) {
            throw new Error(data.erro || "Erro ao salvar endereço.");
        }

        enderecoSelecionado = data.id; // já deixa o novo selecionado
        document.getElementById("form-endereco").reset();
        fecharModal();
        carregarEnderecos();

    } catch (erro) {
        console.error(erro);
        alert(erro.message);
    } finally {
        botao.disabled = false;
    }
});

async function pagarPedido() {
    const carrinho = lerCarrinho(); // vem do carrinho.js, que você já carrega nessa página

        if (carrinho.length === 0) {
        mostrarAviso({
            icone: "fa-bag-shopping",
            titulo: "Seu carrinho está vazio",
            texto: "Adicione algum produto para finalizar o pedido.",
            botaoPrincipal: "Ver camisetas",
            aoPrincipal: () => { window.location.href = "/camisetas.html"; },
        });
        return;
    }

    if (!enderecoSelecionado) {
        mostrarAviso({
            icone: "fa-location-dot",
            titulo: "Escolha um endereço",
            texto: "Selecione um endereço de entrega ou cadastre um novo para continuar.",
            botaoPrincipal: "Cadastrar endereço",
            aoPrincipal: cadastrarEndereco,
        });
        return;
    }

    // Cotação atualizada antes de criar o pedido; o servidor recalcula de novo ao salvar.
    try {
        await renderizarResumo();
    } catch {
        alert("Não foi possível validar os valores do carrinho. Atualize a página e tente novamente.");
        return;
    }

    const botao = document.getElementById("btn-pagar");
    botao.disabled = true;
    botao.textContent = "Processando...";

    try {
        const resposta = await fetchAutenticado(API_BASE_URL + "/pedidos", {
            method: "POST",
            body: JSON.stringify({
                endereco_id: enderecoSelecionado,
                itens: carrinho.map(item => ({
                    produto_id: Number(item.produto_id),
                    tamanho_prod_id: Number(item.tamanho_prod_id),
                    quantidade: Number(item.quantidade),
                    personalizacao: normalizarPersonalizacao(item.personalizacao),
                })),
            }),
        });

        const data = await resposta.json();

        if (!resposta.ok) {
            throw new Error(data.error || "Erro ao finalizar pedido.");
        }

        salvarCarrinho([]);
        const total = formatarPreco(data.valor_total);
        const frete = Number(data.valor_frete) === 0
            ? "grátis"
            : formatarPreco(data.valor_frete);
        alert(`Pedido #${data.id} realizado com sucesso! Frete: ${frete}. Total: ${total}.`);
        window.location.href = "/index.html";

    } catch (erro) {
        console.error(erro);
        alert(erro.message);
        botao.disabled = false;
        botao.textContent = "Finalizar pedido";
    }
}
function preencherDados() {
    const cliente = getClienteLogado();
    if (!cliente) return;

    document.getElementById("nomeC").textContent = cliente.nome;
    document.getElementById("emailC").textContent = cliente.email;
}

async function renderizarResumo() {
    const carrinho = lerCarrinho();
    const lista = document.getElementById("lista-carrinho");
    const totalEl = document.getElementById("total");
    const produtosEl = document.getElementById("checkout-produtos");
    const freteEl = document.getElementById("checkout-frete");
    const avisoFreteEl = document.getElementById("checkout-frete-aviso");
    const botaoPagar = document.getElementById("btn-pagar");

    if (carrinho.length === 0) {
        lista.innerHTML = "<p>Seu carrinho está vazio.</p>";
        produtosEl.textContent = "R$ 0,00";
        freteEl.textContent = "—";
        totalEl.textContent = "Total da compra: R$ 0,00";
        avisoFreteEl.textContent = "";
        botaoPagar.disabled = true;
        return null;
    }

    botaoPagar.disabled = true;
    try {
        const cotacao = await cotarCarrinho(carrinho);
        lista.innerHTML = cotacao.itens.map(item => `
            <div class="resumo-item">
                <span>${item.quantidade}x ${escaparHtml(item.nome)} (Tam: ${escaparHtml(item.tamanho)})${item.personalizacao ? ` — Pers: ${escaparHtml(item.personalizacao)}` : ""}</span>
                <span>${formatarPreco(item.subtotal)}</span>
            </div>
        `).join("");
        produtosEl.textContent = formatarPreco(cotacao.subtotal_produtos);
        freteEl.textContent = cotacao.frete_gratis ? "Grátis" : formatarPreco(cotacao.valor_frete);
        totalEl.textContent = `Total da compra: ${formatarPreco(cotacao.valor_total)}`;
        avisoFreteEl.textContent = cotacao.frete_gratis
            ? "Frete grátis aplicado: 3 ou mais camisetas."
            : mensagemFreteGratis(cotacao.quantidade_itens);
        botaoPagar.disabled = false;
        return cotacao;
    } catch (erro) {
        console.error(erro);
        lista.innerHTML = `<p>${escaparHtml(erro.message)}. Volte ao carrinho para ajustar os itens.</p>`;
        produtosEl.textContent = "—";
        freteEl.textContent = "—";
        totalEl.textContent = "Total da compra: —";
        avisoFreteEl.textContent = "";
        botaoPagar.disabled = true;
        throw erro;
    }
}
const campoCep = document.getElementById("cep");

function formatarCep(valor) {
    const digitos = valor.replace(/\D/g, "").slice(0, 8);
    return digitos.length > 5
        ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
        : digitos;
}

async function buscarCep(cep) {
    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

        if (!resposta.ok) {
            return;
        }

        const dados = await resposta.json();

        // CEP que não existe volta { erro: true }
        if (dados.erro) {
            return;
        }

        // o cliente pode ter digitado outro CEP enquanto a busca rodava
        if (campoCep.value.replace(/\D/g, "") !== cep) {
            return;
        }

        document.getElementById("endereco").value = dados.logradouro || "";
        document.getElementById("bairro").value = dados.bairro || "";
        document.getElementById("cidade").value = dados.localidade || "";
        document.getElementById("estado").value = dados.uf || "";

        // o que a API não sabe, o cliente digita: leva o cursor pro próximo campo
        document.getElementById("numero").focus();

    } catch (erro) {
        // sem internet ou API fora do ar: não trava nada, o cliente preenche à mão
        console.error(erro);
    }
}

campoCep.addEventListener("input", () => {
    campoCep.value = formatarCep(campoCep.value);

    const digitos = campoCep.value.replace(/\D/g, "");

    if (digitos.length === 8) {
        buscarCep(digitos);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    if (!estaLogado()) {
        window.location.href = "/login.html";
        return;
    }

    preencherDados();
    renderizarResumo();
    carregarEnderecos();
});
// ===== MODAL DE AVISO (substitui os alert) =====

function mostrarAviso({ icone = "fa-circle-info", titulo, texto, botaoPrincipal, aoPrincipal }) {
    let modal = document.getElementById("ModalAviso");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "ModalAviso";
        modal.className = "modal-aviso";

        modal.innerHTML = `
            <div class="modal-aviso-box">
                <button type="button" class="modal-aviso-fechar" aria-label="Fechar">&times;</button>

                <i id="aviso-icone" class="fa-solid"></i>
                <h2 id="aviso-titulo"></h2>
                <p id="aviso-texto"></p>

                <div class="modal-aviso-acoes">
                    <button type="button" class="btn-aviso-secundario">Fechar</button>
                    <button type="button" class="btn-aviso-principal" id="aviso-principal"></button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // clicar no fundo escuro, no X ou em "Fechar" fecha
        modal.addEventListener("click", (e) => {
            if (e.target === modal) fecharAviso();
        });
        modal.querySelector(".modal-aviso-fechar").addEventListener("click", fecharAviso);
        modal.querySelector(".btn-aviso-secundario").addEventListener("click", fecharAviso);

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") fecharAviso();
        });
    }

    modal.querySelector("#aviso-icone").className = `fa-solid ${icone}`;
    modal.querySelector("#aviso-titulo").textContent = titulo;
    modal.querySelector("#aviso-texto").textContent = texto;

    // troca o botão principal por um novo, pra não acumular listeners de avisos anteriores
    const antigo = modal.querySelector("#aviso-principal");
    const principal = antigo.cloneNode(false);
    principal.textContent = botaoPrincipal;
    principal.addEventListener("click", () => {
        fecharAviso();
        if (aoPrincipal) aoPrincipal();
    });
    antigo.replaceWith(principal);

    modal.classList.add("aberto");
}

function fecharAviso() {
    document.getElementById("ModalAviso")?.classList.remove("aberto");
}