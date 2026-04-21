import * as Yup from "yup";
import Produtos from "../models/Produtos.js";
import Categoria from "../models/Categoria.js";
import Tamanho_prod from "../models/Tamanho_prod.js";
import Tamanho from "../models/Tamanho.js";
import sequelize from "../database/index.js";

class ProdutosController {
  // 🔍 Listar todos os produtos
 async index(req, res) {
  const produtos = await Produtos.findAll({
    include: [
      {
        model: Categoria,
        as: "categoria",
        attributes: ["id", "nome"],
      },
      {
        model: Tamanho_prod,
        as: "tamanhos",
        include: [
          {
            model: Tamanho,      // <- aqui é Tamanho, não Size
            as: "tamanho",       // <- precisa bater com o associate
            attributes: ["id", "nome"],
          },
        ],
      },
    ],
  });

  return res.json(produtos);
}

  // 🔍 Buscar produto por ID
  async show(req, res) {
    const { id } = req.params;

    const produto = await Produtos.findByPk(id, {
      include: ["categoria", "tamanhos"],
    });

    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    return res.json(produto);
  }

  // ➕ Criar produto com estoque inicial
async store(req, res) {
  const schema = Yup.object().shape({
    nome: Yup.string().required(),
    desc: Yup.string(),
    preco: Yup.number().required().positive(),
    categoria_id: Yup.number().required(),
    tamanhos: Yup.object().required(), 
    // exemplo: { P: 10, M: 5, G: 0, GG: 2 }
  });

  if (!(await schema.isValid(req.body))) {
    return res.status(400).json({ error: "Dados inválidos." });
  }

  const { nome, desc, preco, categoria_id, tamanhos } = req.body;

  const categoria = await Categoria.findByPk(categoria_id);
  if (!categoria) {
    return res.status(400).json({ error: "Categoria inválida." });
  }

  const transaction = await sequelize.transaction();

  try {
    const produto = await Produtos.create(
      {
        nome,
        desc,
        preco,
        categoria_id,
        ativo: true,
      },
      { transaction }
    );

    const sizes = await Tamanho.findAll({ transaction });

    for (const size of sizes) {
      const estoque = tamanhos[size.nome] ?? 0;

      await Tamanho_prod.create(
        {
          produto_id: produto.id,
          tamanho_id: size.id,  // <- CORRIGIDO (era size_id)
          estoque,
        },
        { transaction }
      );
    }

    await transaction.commit();

    return res.status(201).json(produto);
  } catch (err) {
    await transaction.rollback();
    console.log(err); // <- ajuda a ver o erro real
    return res.status(500).json({ error: "Erro ao criar produto." });
  }
}

  // ✏️ Atualizar produto
  async update(req, res) {
    const { id } = req.params;

    const produto = await Produtos.findByPk(id);

    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    await produto.update(req.body);

    return res.json(produto);
  }

  // 🗑️ Deletar produto
  async destroy(req, res) {
    const { id } = req.params;

    const produto = await Produtos.findByPk(id);

    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    await produto.destroy();

    return res.status(204).send();
  }
}

export default new ProdutosController();