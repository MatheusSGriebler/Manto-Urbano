import Sequelize from "sequelize";
import databaseConfig from "../config/database.js";

// 🔥 importa teus models novos
import Produtos from "../models/Produtos.js";
import Categoria from "../models/Categoria.js";
import Liga from "../models/Liga.js";
import Tamanho from "../models/Tamanho.js";
import Tamanho_prod from "../models/Tamanho_prod.js";
import Imagem_prod from "../models/Imagem_prod.js";
import Cliente from "../models/Cliente.js";
import Pedido from "../models/Pedido.js";
import ItensPedido from "../models/ItensPedido.js";
import Rastreio from "../models/Rastreio.js";

// 🔥 lista dos models
import Endereco from "../models/Endereco.js";

const models = [
  Produtos,
  Categoria,
  Liga,
  Tamanho,
  Tamanho_prod,
  Imagem_prod,
  Cliente,
  Pedido,
  ItensPedido,
  Rastreio,
  Endereco,
];

class Database {
  constructor() {
    this.init();
  }

  init() {
    // conexão
    this.connection = new Sequelize(databaseConfig);

    // inicia models
    models
      .map((model) => model.init(this.connection))
      .map(
        (model) =>
          model.associate && model.associate(this.connection.models)
      );
  }
}

export default new Database();