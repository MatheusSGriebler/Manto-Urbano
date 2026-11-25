import { getStripe } from "../config/stripe.js";
import db from "../database/index.js";
import Pedido from "../models/Pedido.js";
import ItensPedido from "../models/ItensPedido.js";
import Tamanho_prod from "../models/Tamanho_prod.js";

async function confirmarPagamento(session) {
  const pedidoId = Number(session.metadata?.pedido_id);
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return;

  const transaction = await db.connection.transaction();
  try {
    const pedido = await Pedido.findByPk(pedidoId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (pedido && pedido.status === "PENDENTE" && session.payment_status === "paid") {
      await pedido.update(
        {
          status: "PAGO",
          stripe_session_id: pedido.stripe_session_id || session.id,
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

async function cancelarPorExpiracao(session) {
  const pedidoId = Number(session.metadata?.pedido_id);
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return;

  const transaction = await db.connection.transaction();
  try {
    const pedido = await Pedido.findByPk(pedidoId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (pedido && pedido.status === "PENDENTE") {
      const itens = await ItensPedido.findAll({
        where: { pedido_id: pedido.id },
        transaction,
      });

      for (const item of itens) {
        await Tamanho_prod.increment("estoque", {
          by: item.quantidade,
          where: { id: item.tamanho_prod_id },
          transaction,
        });
      }

      await pedido.update({ status: "CANCELADO" }, { transaction });
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
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
      } else if (event.type === "checkout.session.expired") {
        await cancelarPorExpiracao(event.data.object);
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("Erro ao processar evento Stripe:", err);
      return res.status(500).json({ error: "Erro ao processar webhook." });
    }
  }
}

export default new StripeWebhookController();
