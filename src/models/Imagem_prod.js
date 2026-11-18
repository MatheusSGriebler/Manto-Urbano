import Sequelize, { Model } from "sequelize";

class Imagem_prod extends Model {
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

        url: {
          type: Sequelize.STRING,
          allowNull: false,
        },

        principal: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
      },
      {
          sequelize,
          tableName: "imagem_prod",
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
  }
}

export default Imagem_prod;