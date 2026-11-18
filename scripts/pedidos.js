// scripts/pedidos.js

function escapar(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function formatarCep(cep) {
    const d = String(cep ?? "").replace(/\D/g, "");
    return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function formatarTelefone(tel) {
    const d = String(tel ?? "").replace(/\D/g, "");
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return d;
}

// só dá pra cancelar antes de enviar (mesma regra do back)
const STATUS_CANCELAVEIS = ["PENDENTE", "PAGO"];

async function listarPedidos() {

    const container = document.getElementById("cardsVendas");

    try {

        const resposta = await fetchAutenticado("http://localhost:3000/pedidos");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar pedidos");
        }

        const pedidos = await resposta.json();

        if (pedidos.length === 0) {
            container.innerHTML = "<p>Nenhum pedido encontrado.</p>";
            return;
        }

        const linhas = pedidos.map(pedido => {

            const valorFormatado = Number(pedido.valor_total)
                .toFixed(2)
                .replace(".", ",");

            const itensHtml = pedido.itens.map(item => {
                const tamanho = item.tamanho_prod?.tamanho?.nome ?? "-";
                const nome = item.produto?.nome ?? "Produto removido";
                return `<li>${item.quantidade}x ${escapar(nome)} (Tam: ${escapar(tamanho)})</li>`;
            }).join("");

            const e = pedido.endereco;
            const enderecoHtml = e
                ? `
                    <strong>${escapar(e.nome_recebedor)}</strong><br>
                    ${escapar(e.endereco)}, ${escapar(e.numero)}
                    ${e.complemento ? " - " + escapar(e.complemento) : ""}<br>
                    ${escapar(e.bairro)} - ${escapar(e.cidade)}/${escapar(e.estado)}<br>
                    CEP ${escapar(formatarCep(e.cep))}<br>
                    Tel: ${escapar(formatarTelefone(e.telefone))}
                    ${e.referencia ? "<br><small>Ref: " + escapar(e.referencia) + "</small>" : ""}
                  `
                : "-";

            // pedido cancelado não recebe rastreio
            const rastreioHtml = pedido.rastreio
                ? `${escapar(pedido.rastreio.codigo)} <small>(${escapar(pedido.rastreio.transportadora)})</small>`
                : pedido.status === "CANCELADO"
                    ? "-"
                    : `<button class="btn-rastreio" onclick="adicionarRastreio(${pedido.id})">Adicionar código</button>`;

            const acoesHtml = STATUS_CANCELAVEIS.includes(pedido.status)
                ? `<button class="btn-deletar" onclick="cancelarPedido(${pedido.id})">Cancelar</button>`
                : "-";

            const status = String(pedido.status ?? "").toLowerCase();

            return `
                <tr>
                    <td>#${pedido.id}</td>
                    <td>${escapar(pedido.cliente?.nome ?? "-")}</td>
                    <td><ul>${itensHtml}</ul></td>
                    <td class="col-entrega">${enderecoHtml}</td>
                    <td><span class="status status-${escapar(status)}">${escapar(pedido.status)}</span></td>
                    <td>R$ ${valorFormatado}</td>
                    <td>${rastreioHtml}</td>
                    <td>${acoesHtml}</td>
                </tr>
            `;
        }).join("");

        container.innerHTML = `
            <div class="tabela-scroll">
                <table class="tabela-pedidos">
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Cliente</th>
                            <th>Itens</th>
                            <th>Entrega</th>
                            <th>Status</th>
                            <th>Total</th>
                            <th>Rastreio</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
        `;

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Erro ao carregar os pedidos. Tente novamente.</p>";
    }
}


// ===== CANCELAR PEDIDO (mantém o histórico e devolve o estoque) =====

async function cancelarPedido(id) {

    const confirmar = confirm(
        "Cancelar este pedido? O estoque será devolvido e essa ação não pode ser desfeita."
    );

    if (!confirmar) {
        return;
    }

    try {

        const resposta = await fetchAutenticado(
            `http://localhost:3000/pedidos/${id}/cancelar`,
            { method: "PATCH" }
        );

        if (!resposta.ok) {
            const data = await resposta.json().catch(() => ({}));
            throw new Error(data.error || data.erro || "Erro ao cancelar pedido");
        }

        alert("Pedido cancelado e estoque devolvido.");

        listarPedidos();

    } catch (error) {

        console.error(error);
        alert(error.message);

    }
}


// ===== ADICIONAR CÓDIGO DE RASTREIO =====

async function adicionarRastreio(pedido_id) {

    const codigo = prompt("Código de rastreio:");

    if (!codigo || !codigo.trim()) {
        return; // cancelou ou deixou vazio
    }

    const transportadora = prompt("Transportadora (ex: Correios, Jadlog):");

    if (!transportadora || !transportadora.trim()) {
        return;
    }

    try {

        const resposta = await fetchAutenticado(
            `http://localhost:3000/pedidos/${pedido_id}/rastreio`,
            {
                method: "POST",
                body: JSON.stringify({
                    codigo: codigo.trim(),
                    transportadora: transportadora.trim(),
                }),
            }
        );

        const data = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(data.error || data.erro || "Erro ao adicionar rastreio.");
        }

        alert("Código de rastreio adicionado!");

        listarPedidos(); // recarrega a tabela, já mostrando o código no lugar do botão

    } catch (error) {

        console.error(error);
        alert(error.message);

    }
}