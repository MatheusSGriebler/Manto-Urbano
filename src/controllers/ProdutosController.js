import * as Yup from "yup";
import Produtos from "../models/Produtos.js";
import Categoria from "../models/Categoria.js";
import Liga from "../models/Liga.js";
import Tamanho_prod from "../models/Tamanho_prod.js";
import Tamanho from "../models/Tamanho.js";
import Imagem_prod from "../models/Imagem_prod.js";
import db from "../database/index.js";
import { montarFiltrosProdutos } from "../../scripts/filtrosPesquisa.js";

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

// ?liga=1 -> { liga_id: 1 }; sem o parâmetro, não filtra; valor inválido dá erro
function filtroLiga(query) {
  if (query.liga === undefined || query.liga === "") return {};

  const liga_id = idValido(query.liga);
  if (!liga_id) {
    throw new ErroNegocio("Liga inválida.");
  }

  return { liga_id };
}

// { P: 10, M: 5 } -> cada estoque precisa ser inteiro >= 0
function validarTamanhos(tamanhos) {
  if (
    !tamanhos ||
    typeof tamanhos !== "object" ||
    Array.isArray(tamanhos) ||
    Object.keys(tamanhos).length === 0
  ) {
    throw new ErroNegocio("Tamanhos inválidos.");
  }

  for (const [nome, estoque] of Object.entries(tamanhos)) {
    if (!Number.isInteger(estoque) || estoque < 0) {
      throw new ErroNegocio(`Estoque inválido para o tamanho ${nome}.`);
    }
  }
}

// função (e não constante) pra cada query receber objetos novos
const incluirRelacoes = () => [
  {
    model: Categoria,
    as: "categoria",
    attributes: ["id", "nome"],
  },
  {
    model: Liga,
    as: "liga",
    attributes: ["id", "nome"],
  },
  {
    model: Tamanho_prod,
    as: "tamanhos",
    include: [
      {
        model: Tamanho,
        as: "tamanho",
        attributes: ["id", "nome"],
      },
    ],
  },
  {
    model: Imagem_prod,
    as: "imagens",
    attributes: ["id", "url", "principal"],
  },
];

class ProdutosController {

  // 🔍 Listar produtos ativos (aceita busca, liga, faixa de preço e ordem)
  async index(req, res) {
    try {
      const { where, order } = montarFiltrosProdutos(req.query);

      const produtos = await Produtos.findAll({
        where: { ...where, ...filtroLiga(req.query), ativo: true },
        order,
        include: incluirRelacoes(),
      });

      return res.json(produtos);
    } catch (err) {
      return responderErro(err, res, "Erro ao listar produtos.");
    }
  }

  // 🔍 Listar produtos ativos de uma categoria (mesmos filtros)
  async categoria(req, res) {
    try {
      const categoria_id = idValido(req.params.categoria_id);
      if (!categoria_id) {
        throw new ErroNegocio("Categoria inválida.");
      }

      const { where, order } = montarFiltrosProdutos(req.query);

      const produtos = await Produtos.findAll({
        where: { ...where, ...filtroLiga(req.query), categoria_id, ativo: true },
        order,
        include: incluirRelacoes(),
      });

      return res.json(produtos);
    } catch (err) {
      return responderErro(err, res, "Erro ao listar produtos.");
    }
  }

  // 🔍 Buscar produto por ID
  async show(req, res) {
    try {
      const id = idValido(req.params.id);
      if (!id) {
        throw new ErroNegocio("ID inválido.");
      }

      const produto = await Produtos.findByPk(id, {
        include: incluirRelacoes(),
      });

      if (!produto || !produto.ativo) {
        throw new ErroNegocio("Produto não encontrado.", 404);
      }

      return res.json(produto);
    } catch (err) {
      return responderErro(err, res, "Erro ao buscar produto.");
    }
  }

  // ➕ Criar produto com estoque inicial (rota de admin)
  async store(req, res) {
    let transaction;

    try {
      const schema = Yup.object().shape({
        nome: Yup.string().max(150).required(),
        desc: Yup.string().max(2000),
        preco: Yup.number().required().positive(),
        categoria_id: Yup.number().required().positive().integer(),
        liga_id: Yup.number().required().positive().integer(),
        tamanhos: Yup.object().required(),
        // exemplo: { P: 10, M: 5, G: 0, GG: 2 }
      });

      if (!(await schema.isValid(req.body))) {
        throw new ErroNegocio("Dados inválidos.");
      }

      const { nome, desc, preco, categoria_id, liga_id, tamanhos } = req.body;

      const categoria = await Categoria.findByPk(categoria_id);
      if (!categoria) {
        throw new ErroNegocio("Categoria inválida.");
      }

      const liga = await Liga.findByPk(liga_id);
      if (!liga) {
        throw new ErroNegocio("Liga inválida.");
      }

      transaction = await db.connection.transaction();

      const sizes = await Tamanho.findAll({ transaction });

      if (sizes.length === 0) {
        throw new ErroNegocio("Nenhum tamanho cadastrado no sistema.");
      }

      // antes um tamanho que não existia era pulado em silêncio e o produto
      // ficava sem estoque; agora o erro aparece
      const nomesValidos = sizes.map(s => s.nome);
      const desconhecidos = Object.keys(tamanhos).filter(
        n => !nomesValidos.includes(n)
      );

      if (desconhecidos.length > 0) {
        throw new ErroNegocio(
          `Tamanho(s) inexistente(s): ${desconhecidos.join(", ")}.`
        );
      }

      for (const [nomeTamanho, estoque] of Object.entries(tamanhos)) {
        if (!Number.isInteger(estoque) || estoque < 0) {
          throw new ErroNegocio(`Estoque inválido para o tamanho ${nomeTamanho}.`);
        }
      }

      const produto = await Produtos.create(
        {
          nome: nome.trim(),
          desc,
          preco,
          categoria_id,
          liga_id,
          ativo: true,
        },
        { transaction }
      );

      for (const size of sizes) {
        await Tamanho_prod.create(
          {
            produto_id: produto.id,
            tamanho_id: size.id,
            estoque: tamanhos[size.nome] ?? 0,
          },
          { transaction }
        );
      }

      await transaction.commit();

      return res.status(201).json(produto);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }

      return responderErro(err, res, "Erro ao criar produto.");
    }
  }

  // ✏️ Atualizar produto (rota de admin): dados do produto e/ou estoque por tamanho
  async update(req, res) {
    let transaction;

    try {
      const id = idValido(req.params.id);
      if (!id) {
        throw new ErroNegocio("ID inválido.");
      }

      const schema = Yup.object().shape({
        nome: Yup.string().max(150),
        desc: Yup.string().max(2000),
        preco: Yup.number().positive(),
        categoria_id: Yup.number().positive().integer(),
        liga_id: Yup.number().positive().integer(),
        ativo: Yup.boolean(),
      });

      let dados;
      try {
        dados = await schema.validate(req.body, { stripUnknown: true });
      } catch {
        throw new ErroNegocio("Dados inválidos.");
      }

      // tira o que não foi enviado, pra não gravar undefined no banco
      dados = Object.fromEntries(
        Object.entries(dados).filter(([, valor]) => valor !== undefined)
      );

      if (dados.nome !== undefined) {
        dados.nome = dados.nome.trim();
      }

      // fica fora do schema: com stripUnknown o Yup apagaria as chaves (P, M, G...)
      const tamanhos = req.body.tamanhos;
      if (tamanhos !== undefined) {
        validarTamanhos(tamanhos);
      }

      if (Object.keys(dados).length === 0 && tamanhos === undefined) {
        throw new ErroNegocio("Nenhum campo para atualizar.");
      }

      const produto = await Produtos.findByPk(id);

      if (!produto) {
        throw new ErroNegocio("Produto não encontrado.", 404);
      }

      if (dados.categoria_id !== undefined) {
        const categoria = await Categoria.findByPk(dados.categoria_id);
        if (!categoria) {
          throw new ErroNegocio("Categoria inválida.");
        }
      }

      if (dados.liga_id !== undefined) {
        const liga = await Liga.findByPk(dados.liga_id);
        if (!liga) {
          throw new ErroNegocio("Liga inválida.");
        }
      }

      transaction = await db.connection.transaction();

      if (Object.keys(dados).length > 0) {
        await produto.update(dados, { transaction });
      }

      if (tamanhos !== undefined) {
        const linhas = await Tamanho_prod.findAll({
          where: { produto_id: id },
          include: [
            {
              model: Tamanho,
              as: "tamanho",
              attributes: ["id", "nome"],
            },
          ],
          transaction,
        });

        const porNome = new Map(linhas.map(l => [l.tamanho.nome, l]));

        const desconhecidos = Object.keys(tamanhos).filter(n => !porNome.has(n));

        if (desconhecidos.length > 0) {
          throw new ErroNegocio(
            `Tamanho(s) inexistente(s) neste produto: ${desconhecidos.join(", ")}.`
          );
        }

        for (const [nomeTamanho, estoque] of Object.entries(tamanhos)) {
          await porNome.get(nomeTamanho).update({ estoque }, { transaction });
        }
      }

      await transaction.commit();
      transaction = null; // já finalizada: o catch não tenta desfazer

      const atualizado = await Produtos.findByPk(id, {
        include: incluirRelacoes(),
      });

      return res.json(atualizado);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }

      return responderErro(err, res, "Erro ao atualizar produto.");
    }
  }

  // 🗑️ "Deletar" produto (rota de admin): desativa em vez de apagar
  async destroy(req, res) {
    try {
      const id = idValido(req.params.id);
      if (!id) {
        throw new ErroNegocio("ID inválido.");
      }

      const produto = await Produtos.findByPk(id);

      if (!produto) {
        throw new ErroNegocio("Produto não encontrado.", 404);
      }

      // some da loja, mas pedidos antigos continuam com o nome e o preço
      await produto.update({ ativo: false });

      return res.status(204).send();
    } catch (err) {
      return responderErro(err, res, "Erro ao remover produto.");
    }
  }
}

export default new ProdutosController();