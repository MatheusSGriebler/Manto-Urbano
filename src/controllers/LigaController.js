import * as Yup from "yup";
import Liga from "../models/Liga.js";

class LigaController {
  // 🔍 Listar ligas (público, usado no select/filtro do front)
  async index(req, res) {
    try {
      const ligas = await Liga.findAll({ order: [["nome", "ASC"]] });
      return res.json(ligas);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Erro ao listar ligas." });
    }
  }

  // ➕ Criar liga (rota de admin)
  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        nome: Yup.string().trim().max(100).required(),
      });

      let dados;
      try {
        dados = await schema.validate(req.body, { stripUnknown: true });
      } catch {
        return res.status(400).json({ error: "Dados inválidos." });
      }

      const liga = await Liga.create({ nome: dados.nome });
      return res.status(201).json(liga);
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ error: "Essa liga já existe." });
      }

      console.log(err);
      return res.status(500).json({ error: "Erro ao criar liga." });
    }
  }

  // ✏️ Atualizar liga (rota de admin)
  async update(req, res) {
    try {
      const schema = Yup.object().shape({
        nome: Yup.string().trim().max(100).required(),
      });

      let dados;
      try {
        dados = await schema.validate(req.body, { stripUnknown: true });
      } catch {
        return res.status(400).json({ error: "Dados inválidos." });
      }

      const liga = await Liga.findByPk(req.params.id);
      if (!liga) {
        return res.status(404).json({ error: "Liga não encontrada." });
      }

      await liga.update({ nome: dados.nome });
      return res.json(liga);
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ error: "Essa liga já existe." });
      }

      console.log(err);
      return res.status(500).json({ error: "Erro ao atualizar liga." });
    }
  }

  // 🗑️ Remover liga (rota de admin); produtos dela ficam com liga_id nulo
  async destroy(req, res) {
    try {
      const liga = await Liga.findByPk(req.params.id);
      if (!liga) {
        return res.status(404).json({ error: "Liga não encontrada." });
      }

      await liga.destroy();
      return res.status(204).send();
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Erro ao remover liga." });
    }
  }
}

export default new LigaController();