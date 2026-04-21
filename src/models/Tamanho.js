import Sequelize, { Model } from "sequelize";

class Tamanho extends Model {
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

        ordem: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "tamanhos",
        timestamps: false, // não precisa data_add/data_upd pra tamanho fixo
      }
    );

    return this;
  }

  static associate(models) {
    this.hasMany(models.Tamanho_prod, {
      foreignKey: "tamanho_id",
      as: "estoques",
    });
  }
}

export default Tamanho;