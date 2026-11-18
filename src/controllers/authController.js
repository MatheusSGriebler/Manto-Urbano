import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as Yup from "yup";
import Cliente from "../models/Cliente.js";

// Atualize estas versões sempre que publicar uma nova versão dos documentos.
const VERSAO_TERMOS = "2026-10-21";
const VERSAO_POLITICA = "2026-10-21";

const schemaEmail = Yup.object({
  email: Yup.string().trim().email().max(254).required(),
}).noUnknown(true);

const schemaLogin = Yup.object({
  email: Yup.string().trim().email().max(254).required(),
  senha: Yup.string().required().max(72).test(
    "bcrypt-max-bytes",
    "Senha inválida.",
    value => !value || Buffer.byteLength(value, "utf8") <= 72
  ),
}).noUnknown(true);

const schemaCadastro = Yup.object({
  email: Yup.string().trim().email().max(254).required(),
  nome: Yup.string().trim().min(2).max(100).required(),
  senha: Yup.string().required().test(
    "password-length",
    "A senha deve ter pelo menos 8 caracteres.",
    value => !value || Array.from(value).length >= 8
  ).test(
    "bcrypt-max-bytes",
    "A senha deve ter no máximo 72 bytes.",
    value => !value || Buffer.byteLength(value, "utf8") <= 72
  ),
  aceite_documentos: Yup.boolean().oneOf(
    [true],
    "Para criar sua conta, confirme os Termos de Uso e a ciência da Política de Privacidade."
  ).required(),
}).noUnknown(true);

async function validar(schema, body) {
  return schema.validate(body, { abortEarly: false, stripUnknown: true });
}

function gerarToken(cliente) {
  return jwt.sign(
    { cliente_id: cliente.id, role: cliente.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

class AuthController {

  async verificarEmail(req, res) {
    try {
      const { email } = await validar(schemaEmail, req.body);

      const cliente = await Cliente.findOne({ where: { email: email.toLowerCase() } });

      return res.json({ existe: !!cliente });

    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        return res.status(400).json({ erro: "E-mail inválido." });
      }
      return res.status(500).json({ erro: "Erro ao verificar email" });
    }
  }

async cadastrar(req, res) {
    try {
      const {
        email: emailRecebido,
        senha,
        nome,
      } = await validar(schemaCadastro, req.body);
      const email = emailRecebido.toLowerCase();

      const existe = await Cliente.findOne({ where: { email } });
      if (existe) {
        return res.status(400).json({ erro: "Email já cadastrado" });
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      const cliente = await Cliente.create({
        email,
        senha: senhaHash,
        nome,
        aceite_documentos_em: new Date(),
        versao_termos_aceita: VERSAO_TERMOS,
        versao_politica_ciente: VERSAO_POLITICA,
      });

      const token = gerarToken(cliente); // <- aqui

      return res.json({
        msg: "Cadastro feito com sucesso",
        token,
        cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email, role: cliente.role },
      });

    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        return res.status(400).json({ erro: err.errors[0] || "Dados inválidos." });
      }
      if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ erro: "Email já cadastrado" });
      }
      return res.status(500).json({ erro: "Erro no cadastro" });
    }
}

async login(req, res) {
    try {
      const { email: emailRecebido, senha } = await validar(schemaLogin, req.body);
      const email = emailRecebido.toLowerCase();

      const cliente = await Cliente.findOne({ where: { email } });

      if (!cliente) {
        return res.status(400).json({ erro: "Email ou senha inválidos" });
      }

      const senhaValida = await bcrypt.compare(senha, cliente.senha);

      if (!senhaValida) {
        return res.status(400).json({ erro: "Email ou senha inválidos" });
      }

      const token = gerarToken(cliente); // <- aqui

      return res.json({
        msg: "Login OK",
        token,
        cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email, role: cliente.role },
      });

    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        return res.status(400).json({ erro: "E-mail ou senha inválidos" });
      }
      return res.status(500).json({ erro: "Erro no login" });
    }
}
}

export default new AuthController();
