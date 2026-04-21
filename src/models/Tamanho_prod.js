import Sequelize, { Model } from "sequelize";

class Tamanho_prod extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        produto_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        tamanho_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        estoque: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0, // nunca pode ser negativo
          },
        },
      },
      {
        sequelize,
        tableName: "tamanho_prod",
        timestamps: false,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Produtos, {
      foreignKey: "produto_id",
      as: "produto",
    });

    this.belongsTo(models.Tamanho, {
      foreignKey: "tamanho_id",
      as: "tamanho",
    });
  }
}

export default Tamanho_prod;