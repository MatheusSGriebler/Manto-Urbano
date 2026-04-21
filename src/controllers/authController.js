// controllers/authController.js

import bcrypt from "bcrypt";
import Cliente from "../models/Cliente.js";

class AuthController {

  async verificarEmail(req, res) {
    try {
      const { email } = req.body;

      const cliente = await Cliente.findOne({ where: { email } });

      return res.json({ existe: !!cliente });

    } catch (err) {
      return res.status(500).json({ erro: "Erro ao verificar email" });
    }
  }

  async cadastrar(req, res) {
    try {
      const { email, senha, nome , data_nasc} = req.body;

      const existe = await Cliente.findOne({ where: { email } });
      if (existe) {
        return res.status(400).json({ erro: "Email já cadastrado" });
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      await Cliente.create({
        email,
        senha: senhaHash,
        nome,
        data_nasc
      });

      return res.json({ msg: "Cadastro feito com sucesso" });

    } catch (err) {
      return res.status(500).json({ erro: "Erro no cadastro" });
    }
  }

  async login(req, res) {
    try {
      const { email, senha } = req.body;

      const cliente = await Cliente.findOne({ where: { email } });

      if (!cliente) {
        return res.status(400).json({ erro: "Email ou senha inválidos" });
      }

      const senhaValida = await bcrypt.compare(senha, cliente.senha);

      if (!senhaValida) {
        return res.status(400).json({ erro: "Email ou senha inválidos" });
      }

      return res.json({ msg: "Login OK", cliente });

    } catch (err) {
      return res.status(500).json({ erro: "Erro no login" });
    }
  }
}


export default new AuthController();