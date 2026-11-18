import * as Yup from "yup";
import Imagem_prod from "../models/Imagem_prod.js";
import Produtos from "../models/Produtos.js";

class Imagem_prodController {
  // 🔍 Listar imagens de um produto
  async index(req, res) {
    const { produto_id } = req.params;

    const imagens = await Imagem_prod.findAll({
      where: { produto_id },
    });

    return res.json(imagens);
  }

  // ➕ Adicionar imagem ao produto
  async store(req, res) {
    const schema = Yup.object().shape({
      produto_id: Yup.number().positive().integer().required(),
      url: Yup.string()
        .trim()
        .max(2048)
        .required()
        .test("https-url", "A imagem precisa usar uma URL HTTPS válida.", value => {
          try {
            const parsed = new URL(value);
            return parsed.protocol === "https:" && !parsed.username && !parsed.password;
          } catch {
            return false;
          }
        }),
      principal: Yup.boolean().default(false),
    }).noUnknown(true);

    let dados;
    try {
      dados = await schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    } catch {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    const { produto_id, principal } = dados;
    const url = new URL(dados.url).href;

    const produto = await Produtos.findByPk(produto_id);

    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    // Se for imagem principal, remove principal das outras
    if (principal) {
      await Imagem_prod.update(
        { principal: false },
        { where: { produto_id } }
      );
    }

    const imagem = await Imagem_prod.create({
      produto_id,
      url,
      principal: principal || false,
    });

    return res.status(201).json(imagem);
  }

  // ⭐ Definir imagem como principal
  async setPrincipal(req, res) {
    const { id } = req.params;

    const imagem = await Imagem_prod.findByPk(id);

    if (!imagem) {
      return res.status(404).json({ error: "Imagem não encontrada." });
    }

    // remove principal das outras imagens do mesmo produto
    await Imagem_prod.update(
      { principal: false },
      { where: { produto_id: imagem.produto_id } }
    );

    await imagem.update({ principal: true });

    return res.json(imagem);
  }

  // 🗑️ Remover imagem
  async destroy(req, res) {
    const { id } = req.params;

    const imagem = await Imagem_prod.findByPk(id);

    if (!imagem) {
      return res.status(404).json({ error: "Imagem não encontrada." });
    }

    await imagem.destroy();

    return res.status(204).send();
  }
}

export default new Imagem_prodController();
