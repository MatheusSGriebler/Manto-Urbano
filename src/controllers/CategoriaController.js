import * as Yup from "yup";
import Categoria from "../models/Categoria.js";
import Produtos from "../models/Produtos.js";

class CategoriaController {
  // 🔍 Listar todas as categorias
  async index(req, res) {
    const categorias = await Categoria.findAll({
      include: [
        {
          model: Produtos,
          as: "produtos",
          attributes: ["id", "nome", "preco", "ativo"],
        },
      ],
    });

    return res.json(categorias);
  }

  // 🔍 Buscar categoria por ID
  async show(req, res) {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id, {
      include: [
        {
          model: Produtos,
          as: "produtos",
          attributes: ["id", "nome", "preco", "ativo"],
        },
      ],
    });

    if (!categoria) {
      return res.status(404).json({ error: "Categoria não encontrada." });
    }

    return res.json(categoria);
  }

  // ➕ Criar nova categoria
  async store(req, res) {
    const schema = Yup.object().shape({
      nome: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    const { nome } = req.body;

    const categoriaExiste = await Categoria.findOne({
      where: { nome },
    });

    if (categoriaExiste) {
      return res.status(400).json({ error: "Categoria já existe." });
    }

    const categoria = await Categoria.create({ nome });

    return res.status(201).json(categoria);
  }

  // ✏️ Atualizar categoria
  async update(req, res) {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({ error: "Categoria não encontrada." });
    }

    await categoria.update(req.body);

    return res.json(categoria);
  }

  // 🗑️ Deletar categoria
  async destroy(req, res) {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({ error: "Categoria não encontrada." });
    }

    await categoria.destroy();

    return res.status(204).send();
  }
}

export default new CategoriaController();