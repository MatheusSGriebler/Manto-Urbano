import * as Yup from "yup";
import Rastreio from "../models/Rastreio.js";
import Pedido from "../models/Pedido.js";
import db from "../database/index.js";

// erro "esperado" -> responde com o status certo em vez de 500
class ErroNegocio extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

function idValido(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function responderErro(err, res, mensagemPadrao) {
  if (err instanceof ErroNegocio) {
    return res.status(err.status).json({ error: err.message });
  }

  console.log(err);
  return res.status(500).json({ error: mensagemPadrao });
}

const schemaRastreio = Yup.object().shape({
  codigo: Yup.string().trim().max(50).required(),
  transportadora: Yup.string().trim().max(100).required(),
});

// devolve só codigo e transportadora, já sem espaços nas pontas
async function validarDados(body) {
  try {
    return await schemaRastreio.validate(body, { stripUnknown: true });
  } catch {
    throw new ErroNegocio("Dados inválidos.");
  }
}

class RastreioController {

  // 🔍 Admin vê qualquer rastreio; cliente só o do PRÓPRIO pedido
  async show(req, res) {
    try {
      const pedido_id = idValido(req.params.pedido_id);
      if (!pedido_id) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const pedido = await Pedido.findByPk(pedido_id);
      const ehAdmin = req.role === "admin";

      // 404 (e não 403) pra não revelar que o pedido existe
      if (!pedido || (!ehAdmin && pedido.cliente_id !== req.cliente_id)) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }

      const rastreio = await Rastreio.findOne({ where: { pedido_id } });

      if (!rastreio) {
        return res.status(404).json({ error: "Este pedido ainda não possui rastreio." });
      }

      return res.json(rastreio);
    } catch (err) {
      return responderErro(err, res, "Erro ao buscar rastreio.");
    }
  }

  // ➕ Admin cadastra o rastreio (e marca o pedido como ENVIADO)
  async store(req, res) {
    let transaction;

    try {
      const pedido_id = idValido(req.params.pedido_id);
      if (!pedido_id) {
        throw new ErroNegocio("ID inválido.");
      }

      const { codigo, transportadora } = await validarDados(req.body);

      transaction = await db.connection.transaction();

      // trava o pedido: não dá pra cancelar e enviar ao mesmo tempo
      const pedido = await Pedido.findByPk(pedido_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!pedido) {
        throw new ErroNegocio("Pedido não encontrado.", 404);
      }

      if (["CANCELADO", "ENTREGUE"].includes(pedido.status)) {
        throw new ErroNegocio(
          `Pedido com status ${pedido.status} não pode receber rastreio.`
        );
      }

      const existente = await Rastreio.findOne({
        where: { pedido_id },
        transaction,
      });

      if (existente) {
        throw new ErroNegocio("Este pedido já possui um rastreio.");
      }

      const rastreio = await Rastreio.create(
        { pedido_id, codigo, transportadora },
        { transaction }
      );

      await pedido.update({ status: "ENVIADO" }, { transaction });

      await transaction.commit();

      return res.status(201).json(rastreio);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }

      return responderErro(err, res, "Erro ao cadastrar rastreio.");
    }
  }

  // ✏️ Corrigir código ou transportadora (só esses dois campos)
  async update(req, res) {
    try {
      const pedido_id = idValido(req.params.pedido_id);
      if (!pedido_id) {
        throw new ErroNegocio("ID inválido.");
      }

      const { codigo, transportadora } = await validarDados(req.body);

      const pedido = await Pedido.findByPk(pedido_id);

      if (!pedido) {
        throw new ErroNegocio("Pedido não encontrado.", 404);
      }

      if (pedido.status === "CANCELADO") {
        throw new ErroNegocio("Pedido cancelado não pode ser alterado.");
      }

      const rastreio = await Rastreio.findOne({ where: { pedido_id } });

      if (!rastreio) {
        throw new ErroNegocio("Rastreio não encontrado.", 404);
      }

      // só esses dois campos: nada de update(req.body)
      await rastreio.update({ codigo, transportadora });

      return res.json(rastreio);
    } catch (err) {
      return responderErro(err, res, "Erro ao atualizar rastreio.");
    }
  }
}

export default new RastreioController();