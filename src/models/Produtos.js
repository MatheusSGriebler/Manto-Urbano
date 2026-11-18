import Sequelize, { Model } from "sequelize";

class Produtos extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        nome: {
          type: Sequelize.STRING,
          allowNull: false,
        },

        desc: {
          type: Sequelize.STRING,
        },

        preco: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        categoria_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        liga_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },

        ativo: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: "produtos",
        timestamps: true,
        createdAt: "data_add",
        updatedAt: "data_upd",
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Categoria, {
      foreignKey: "categoria_id",
      as: "categoria",
    });

    this.belongsTo(models.Liga, {
      foreignKey: "liga_id",
      as: "liga",
    });

    this.hasMany(models.Tamanho_prod, {
      foreignKey: "produto_id",
      as: "tamanhos",
    });
    this.hasMany(models.Imagem_prod, {
      foreignKey: "produto_id",
      as: "imagens",
    });
  }
}

export default Produtos;