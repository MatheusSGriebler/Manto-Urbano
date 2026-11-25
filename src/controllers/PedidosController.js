import * as Yup from "yup";
import Pedido from "../models/Pedido.js";
import ItensPedido from "../models/ItensPedido.js";
import Cliente from "../models/Cliente.js";
import Produtos from "../models/Produtos.js";
import Tamanho_prod from "../models/Tamanho_prod.js";
import Endereco from "../models/Endereco.js";
import Rastreio from "../models/Rastreio.js";
import db from "../database/index.js";
import Tamanho from "../models/Tamanho.js";
import { getStripe } from "../config/stripe.js";

// ajusta essa lista pros status que você realmente usa
const STATUS_VALIDOS = ["PENDENTE", "PAGO", "ENVIADO", "ENTREGUE", "CANCELADO"];

const STATUS_CANCELAVEIS = ["PENDENTE", "PAGO"];
const FRETE_FIXO_CENTAVOS = 2000;
const QUANTIDADE_PARA_FRETE_GRATIS = 3;
const PRECO_PERSONALIZADO_CENTAVOS = 16999;

const schemaItens = Yup.array()
  .of(
    Yup.object().shape({
      produto_id: Yup.number().required().positive().integer(),
      tamanho_prod_id: Yup.number().required().positive().integer(),
      quantidade: Yup.number().required().positive().integer(),
      personalizacao: Yup.string().trim().max(60).nullable(),
    })
  )
  .min(1)
  .required();

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

async function calcularResumoItens(itens, { transaction, bloquearEstoque = false } = {}) {
  let subtotalCentavos = 0;
  let quantidadeTotal = 0;
  const itensValidados = [];

  const itensAgrupados = new Map();
  for (const item of itens) {
    const pers = typeof item.personalizacao === "string"
      ? item.personalizacao.trim().slice(0, 60) || null
      : null;
    const chave = `${item.produto_id}:${item.tamanho_prod_id}:${pers ?? ""}`;
    const existente = itensAgrupados.get(chave);
    if (existente) {
      existente.quantidade += item.quantidade;
    } else {
      itensAgrupados.set(chave, { ...item, personalizacao: pers });
    }
  }

  const itensOrdenados = [...itensAgrupados.values()].sort(
    (a, b) => a.tamanho_prod_id - b.tamanho_prod_id
  );

  const quantidadePorTamanho = new Map();
  for (const item of itensOrdenados) {
    quantidadePorTamanho.set(
      item.tamanho_prod_id,
      (quantidadePorTamanho.get(item.tamanho_prod_id) ?? 0) + item.quantidade
    );
  }

  for (const item of itensOrdenados) {
    const opcoesProduto = transaction ? { transaction } : {};
    const produto = await Produtos.findByPk(item.produto_id, opcoesProduto);

    if (!produto) {
      throw new ErroNegocio(`Produto ${item.produto_id} não encontrado.`);
    }

    const opcoesTamanho = transaction
      ? { transaction, ...(bloquearEstoque ? { lock: transaction.LOCK.UPDATE } : {}) }
      : {};
    const tamanhoProd = await Tamanho_prod.findOne({
      where: {
        id: item.tamanho_prod_id,
        produto_id: item.produto_id,
      },
      ...opcoesTamanho,
    });

    if (!tamanhoProd) {
      throw new ErroNegocio(
        `Tamanho ${item.tamanho_prod_id} não encontrado para o produto ${item.produto_id}.`
      );
    }

    const tamanho = await Tamanho.findByPk(tamanhoProd.tamanho_id, opcoesProduto);

    const qtdTotalTamanho = quantidadePorTamanho.get(item.tamanho_prod_id) ?? item.quantidade;
    if (tamanhoProd.estoque < qtdTotalTamanho) {
      throw new ErroNegocio(`Estoque insuficiente para o produto ${produto.nome}.`);
    }

    const precoBaseCentavos = Math.round(Number(produto.preco) * 100);
    const precoCentavos = item.personalizacao
      ? Math.max(precoBaseCentavos, PRECO_PERSONALIZADO_CENTAVOS)
      : precoBaseCentavos;
    const subtotalItemCentavos = precoCentavos * item.quantidade;
    subtotalCentavos += subtotalItemCentavos;
    quantidadeTotal += item.quantidade;

    itensValidados.push({
      produto_id: produto.id,
      tamanho_prod_id: tamanhoProd.id,
      nome: produto.nome,
      tamanho: tamanho?.nome ?? "-",
      personalizacao: item.personalizacao,
      quantidade: item.quantidade,
      preco_unitario: precoCentavos / 100,
      subtotal: subtotalItemCentavos / 100,
    });
  }

  const freteCentavos = quantidadeTotal >= QUANTIDADE_PARA_FRETE_GRATIS
    ? 0
    : FRETE_FIXO_CENTAVOS;

  return {
    quantidade_itens: quantidadeTotal,
    itens: itensValidados,
    subtotal_produtos: subtotalCentavos / 100,
    valor_frete: freteCentavos / 100,
    valor_total: (subtotalCentavos + freteCentavos) / 100,
    frete_gratis: freteCentavos === 0,
    subtotalCentavos,
    freteCentavos,
  };
}

// funções (e não constantes) pra cada query receber objetos novos:
// o Sequelize pode alterar os includes e reaproveitar objeto dá dor de cabeça
const incluirCliente = () => ({
  model: Cliente,
  as: "cliente",
  attributes: ["id", "nome", "email"],
});

const incluirItens = () => ({
  model: ItensPedido,
  as: "itens",
  include: [
    { model: Produtos, as: "produto", attributes: ["id", "nome", "preco"] },
    {
      model: Tamanho_prod,
      as: "tamanho_prod",
      include: [{ model: Tamanho, as: "tamanho" }],
    },
  ],
});

const incluirRastreio = () => ({ model: Rastreio, as: "rastreio" });
const incluirEndereco = () => ({ model: Endereco, as: "endereco" });

class PedidosController {

  // Cotação pública: os preços e a regra de frete vêm sempre do servidor.
  async cotacao(req, res) {
    const schema = Yup.object().shape({ itens: schemaItens }).noUnknown(true);

    if (!(await schema.isValid(req.body, { strict: true }))) {
      return res.status(400).json({ error: "Dados do carrinho inválidos." });
    }

    try {
      const resumo = await calcularResumoItens(req.body.itens);
      const { subtotalCentavos, freteCentavos, ...resposta } = resumo;
      return res.json(resposta);
    } catch (err) {
      if (err instanceof ErroNegocio) {
        return res.status(400).json({ error: err.message });
      }
      console.log(err);
      return res.status(500).json({ error: "Erro ao calcular o carrinho." });
    }
  }

  // 🔍 Listar todos os pedidos (rota de admin)
  async index(req, res) {
    try {
      const pedidos = await Pedido.findAll({
        include: [
          incluirCliente(),
          incluirItens(),
          incluirRastreio(),
          incluirEndereco(),
        ],
        order: [["id", "DESC"]],
      });

      return res.json(pedidos);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Erro ao listar pedidos." });
    }
  }

  // 🔍 Buscar pedido por ID (admin vê qualquer um; cliente só o próprio)
  async show(req, res) {
    try {
      const id = idValido(req.params.id);
      if (!id) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const pedido = await Pedido.findByPk(id, {
        include: [
          incluirCliente(),
          incluirItens(),
          incluirRastreio(),
          incluirEndereco(),
        ],
      });

      const ehAdmin = req.role === "admin";

      // 404 (e não 403) pra não revelar que o pedido existe
      if (!pedido || (!ehAdmin && pedido.cliente_id !== req.cliente_id)) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }

      return res.json(pedido);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Erro ao buscar pedido." });
    }
  }

  // ➕ Criar pedido com itens (valida endereço e estoque, dá baixa)
  async store(req, res) {
    const schema = Yup.object().shape({
      endereco_id: Yup.number().required().positive().integer(),
      itens: schemaItens,
    }).noUnknown(true);

    if (!(await schema.isValid(req.body, { strict: true }))) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    const cliente_id = req.cliente_id; // vem do token, nunca do body
    const { itens, endereco_id } = req.body;

    let transaction;

    try {
      const cliente = await Cliente.findByPk(cliente_id);
      if (!cliente) {
        return res.status(400).json({ error: "Cliente inválido." });
      }

      // o endereço precisa ser DESTE cliente e estar ativo
      const endereco = await Endereco.findOne({
        where: { id: endereco_id, cliente_id, ativo: true },
      });

      if (!endereco) {
        return res.status(400).json({ error: "Endereço inválido." });
      }

      transaction = await db.connection.transaction();

      const resumo = await calcularResumoItens(itens, {
        transaction,
        bloquearEstoque: true,
      });

      for (const item of resumo.itens) {
        // baixa o estoque dentro da mesma transaction
        await Tamanho_prod.decrement("estoque", {
          by: item.quantidade,
          where: { id: item.tamanho_prod_id },
          transaction,
        });
      }

      const pedido = await Pedido.create(
        {
          cliente_id,
          endereco_id: endereco.id,
          valor_frete: resumo.freteCentavos / 100,
          valor_total: resumo.valor_total,
          status: "PENDENTE",
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

      const stripe = getStripe();
      if (stripe) {
        try {
          const originHeader = req.headers.origin;
          const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
          const proto = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
          const baseUrl = originHeader && /^https?:\/\//i.test(originHeader)
            ? originHeader.replace(/\/$/, "")
            : `${proto}://${hostHeader}`;

          const lineItems = resumo.itens.map(item => {
            const titulo = `${item.nome} (Tam: ${item.tamanho})${item.personalizacao ? ` - Pers: ${item.personalizacao}` : ""}`;
            return {
              price_data: {
                currency: "brl",
                unit_amount: Math.round(item.preco_unitario * 100),
                product_data: {
                  name: titulo.slice(0, 120),
                },
              },
              quantity: item.quantidade,
            };
          });

          if (resumo.freteCentavos > 0) {
            lineItems.push({
              price_data: {
                currency: "brl",
                unit_amount: resumo.freteCentavos,
                product_data: {
                  name: "Frete",
                },
              },
              quantity: 1,
            });
          }

          const session = await stripe.checkout.sessions.create({
            mode: "payment",
            customer_email: cliente.email,
            line_items: lineItems,
            metadata: { pedido_id: String(pedido.id) },
            success_url: `${baseUrl}/cliente.html?pagamento=sucesso&pedido=${pedido.id}`,
            cancel_url: `${baseUrl}/checkout.html?pagamento=cancelado&pedido=${pedido.id}`,
          });

          await pedido.update({ stripe_session_id: session.id });

          return res.status(201).json({
            ...pedido.toJSON(),
            checkout_url: session.url,
          });
        } catch (stripeErr) {
          console.error("Erro ao criar sessão Stripe:", stripeErr);
          const estornoTx = await db.connection.transaction();
          try {
            for (const item of resumo.itens) {
              await Tamanho_prod.increment("estoque", {
                by: item.quantidade,
                where: { id: item.tamanho_prod_id },
                transaction: estornoTx,
              });
            }
            await pedido.update({ status: "CANCELADO" }, { transaction: estornoTx });
            await estornoTx.commit();
          } catch (estornoErr) {
            await estornoTx.rollback();
            console.error("Erro ao estornar pedido após falha da Stripe:", estornoErr);
          }
          return res.status(502).json({
            error: "Não foi possível iniciar o pagamento na Stripe. Tente novamente.",
          });
        }
      }

      return res.status(201).json(pedido);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }

      if (err instanceof ErroNegocio) {
        return res.status(400).json({ error: err.message });
      }

      console.log(err);
      return res.status(500).json({ error: "Erro ao criar pedido." });
    }
  }

   // ✏️ Atualizar status do pedido (rota de admin)
  async update(req, res) {
    try {
      const id = idValido(req.params.id);
      if (!id) {
        return res.status(400).json({ error: "ID inválido." });
      }

      // CANCELADO não entra aqui: cancelar tem rota própria (PATCH /pedidos/:id/cancelar),
      // porque precisa devolver o estoque
      const schema = Yup.object().shape({
        status: Yup.string()
          .oneOf(STATUS_VALIDOS.filter(s => s !== "CANCELADO"))
          .required(),
      });

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: "Status inválido." });
      }

      const pedido = await Pedido.findByPk(id);

      if (!pedido) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }

      // pedido cancelado não volta a ser alterado
      if (pedido.status === "CANCELADO") {
        return res.status(400).json({ error: "Pedido cancelado não pode ser alterado." });
      }

      // só o status pode mudar; nada de update(req.body)
      await pedido.update({ status: req.body.status });

      return res.json(pedido);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Erro ao atualizar pedido." });
    }
  }
  async cancelar(req, res) {
    let transaction;

    try {
      const id = idValido(req.params.id);
      if (!id) {
        return res.status(400).json({ error: "ID inválido." });
      }

      transaction = await db.connection.transaction();

      // trava o pedido: dois cliques seguidos não devolvem o estoque duas vezes
      const pedido = await Pedido.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!pedido) {
        throw new ErroNegocio("Pedido não encontrado.", 404);
      }

      if (!STATUS_CANCELAVEIS.includes(pedido.status)) {
        throw new ErroNegocio(
          `Pedido com status ${pedido.status} não pode ser cancelado.`
        );
      }

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

      await transaction.commit();

      return res.json(pedido);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }

      if (err instanceof ErroNegocio) {
        return res.status(err.status).json({ error: err.message });
      }

      console.log(err);
      return res.status(500).json({ error: "Erro ao cancelar pedido." });
    }
  }

    // 🗑️ Excluir pedido já cancelado (limpeza) — rota de admin
  async destroy(req, res) {
    try {
      const id = idValido(req.params.id);
      if (!id) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const pedido = await Pedido.findByPk(id);

      if (!pedido) {
        return res.status(404).json({ error: "Pedido não encontrado." });
      }

      if (pedido.status !== "CANCELADO") {
        return res.status(400).json({ error: "Cancele o pedido antes de excluir." });
      }

      await pedido.destroy();

      return res.status(204).send();
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Erro ao excluir pedido." });
    }
  }

  // 🔍 Pedidos do cliente logado
  async meusPedidos(req, res) {
    try {
      const pedidos = await Pedido.findAll({
        where: { cliente_id: req.cliente_id },
        include: [incluirItens(), incluirRastreio(), incluirEndereco()],
        order: [["id", "DESC"]],
      });

      return res.json(pedidos);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Erro ao listar seus pedidos." });
    }
  }
}

export default new PedidosController();
