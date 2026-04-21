import Sequelize from "sequelize";
import databaseConfig from "../config/database.js";

// 🔥 importa teus models novos
import Produtos from "../models/Produtos.js";
import Categoria from "../models/Categoria.js";
import Tamanho from "../models/Tamanho.js";
import Tamanho_prod from "../models/Tamanho_prod.js";
import Imagem_prod from "../models/Imagem_prod.js";
import Cliente from "../models/Cliente.js";

// 🔥 lista dos models
const models = [
  Produtos,
  Categoria,
  Tamanho,
  Tamanho_prod,
  Imagem_prod,
  Cliente,
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