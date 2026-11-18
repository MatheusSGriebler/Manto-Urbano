import Sequelize, { Model } from "sequelize";

class Rastreio extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        pedido_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true, // garante 1:1 — um pedido só pode ter um rastreio
        },

        codigo: {
          type: Sequelize.STRING,
          allowNull: false,
        },

        transportadora: {
          type: Sequelize.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "rastreios",
        timestamps: true,
        createdAt: "data_add",
        updatedAt: "data_upd",
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Pedido, {
      foreignKey: "pedido_id",
      as: "pedido",
    });
  }
}

export default Rastreio;