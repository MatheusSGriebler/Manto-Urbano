import { getStripe } from "../config/stripe.js";
import db from "../database/index.js";
import Pedido from "../models/Pedido.js";
import ItensPedido from "../models/ItensPedido.js";
import Tamanho_prod from "../models/Tamanho_prod.js";
import { calcularResumoItens } from "./PedidosController.js";

function lerItensMetadata(metadata = {}) {
  const totalChunks = Number(metadata.itens_chunks || 0);
  if (!Number.isInteger(totalChunks) || totalChunks <= 0) return [];

  let texto = "";
  for (let i = 0; i < totalChunks; i++) {
    texto += metadata[`itens_${i}`] ?? "";
  }

  const compacto = JSON.parse(texto);
  return compacto.map(item => ({
    produto_id: Number(item.p),
    tamanho_prod_id: Number(item.t),
    quantidade: Number(item.q),
    personalizacao: item.s || null,
  }));
}

async function confirmarPagamento(session) {
  if (session.payment_status !== "paid") return;

  // Idempotência: se esse pagamento já gerou um pedido, não cria outro
  const jaExiste = await Pedido.findOne({
    where: { stripe_session_id: session.id },
  });
  if (jaExiste) {
    if (jaExiste.status === "PENDENTE") {
      await jaExiste.update({ status: "PAGO" });
    }
    return;
  }

  const cliente_id = Number(session.metadata?.cliente_id);
  const endereco_id = Number(session.metadata?.endereco_id);
  const itens = lerItensMetadata(session.metadata);

  if (!cliente_id || !endereco_id || itens.length === 0) {
    console.error("Metadata incompleta no webhook Stripe:", session.id);
    return;
  }

  const transaction = await db.connection.transaction();
  try {
    const resumo = await calcularResumoItens(itens, {
      transaction,
      bloquearEstoque: true,
    });

    for (const item of resumo.itens) {
      await Tamanho_prod.decrement("estoque", {
        by: item.quantidade,
        where: { id: item.tamanho_prod_id },
        transaction,
      });
    }

    const pedido = await Pedido.create(
      {
        cliente_id,
        endereco_id,
        valor_frete: resumo.freteCentavos / 100,
        valor_total: resumo.valor_total,
        status: "PAGO",
        stripe_session_id: session.id,
      },
      { transaction }
    );

    for (const item of resumo.itens) {
      await ItensPedido.create(
        {
          pedido_id: pedido.id,
          produto_id: item.produto_id,
          tamanho_prod_id: item.tamanho_prod_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          personalizacao: item.personalizacao ?? null,
        },
        { transaction }
      );
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

class StripeWebhookController {
  async handle(req, res) {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    if (!stripe || !webhookSecret) {
      return res.status(500).json({ error: "Webhook da Stripe não configurado." });
    }

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Assinatura da Stripe ausente." });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      console.error("Erro ao validar webhook Stripe:", err.message);
      return res.status(400).json({ error: "Assinatura inválida." });
    }

    try {
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        await confirmarPagamento(event.data.object);
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Erro ao processar evento Stripe:", err);
      return res.status(500).json({ error: "Erro ao processar webhook." });
    }
  }
}

export default new StripeWebhookController();
