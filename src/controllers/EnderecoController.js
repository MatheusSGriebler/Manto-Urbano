import Endereco from "../models/Endereco.js";

function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

class EnderecoController {

  // lista só os endereços ativos do cliente logado
  async index(req, res) {
    try {
      const enderecos = await Endereco.findAll({
        where: { cliente_id: req.cliente_id, ativo: true },
        order: [["data_add", "DESC"]],
      });

      return res.json(enderecos);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ erro: "Erro ao listar endereços" });
    }
  }

  async store(req, res) {
    try {
      const {
        identificacao, nome_recebedor, cep, endereco, numero,
        complemento, bairro, cidade, estado, referencia, telefone,
      } = req.body;

      const cepLimpo = somenteDigitos(cep);
      const telefoneLimpo = somenteDigitos(telefone);

      if (!identificacao || !nome_recebedor || !endereco || !numero || !bairro || !cidade) {
        return res.status(400).json({ erro: "Preencha todos os campos obrigatórios" });
      }

      if (cepLimpo.length !== 8) {
        return res.status(400).json({ erro: "CEP inválido" });
      }

      if (!estado || estado.length !== 2) {
        return res.status(400).json({ erro: "Estado inválido" });
      }

      if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
        return res.status(400).json({ erro: "Telefone inválido" });
      }

      const novo = await Endereco.create({
        cliente_id: req.cliente_id, // vem do token, nunca do body
        identificacao,
        nome_recebedor,
        cep: cepLimpo,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado: estado.toUpperCase(),
        referencia,
        telefone: telefoneLimpo,
      });

      return res.status(201).json(novo);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ erro: "Erro ao cadastrar endereço" });
    }
  }

  // "exclui" marcando como inativo, pra não quebrar pedidos antigos
  async destroy(req, res) {
    try {
      const endereco = await Endereco.findOne({
        where: { id: req.params.id, cliente_id: req.cliente_id },
      });

      if (!endereco) {
        return res.status(404).json({ erro: "Endereço não encontrado" });
      }

      await endereco.update({ ativo: false });

      return res.json({ msg: "Endereço removido" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ erro: "Erro ao remover endereço" });
    }
  }
}

export default new EnderecoController();