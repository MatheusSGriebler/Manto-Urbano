import Sequelize, { Model } from "sequelize";

class Liga extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },

        nome: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
      },
      {
        sequelize,
        tableName: "ligas",
        timestamps: true,
        createdAt: "data_add",
        updatedAt: "data_upd",
      }
    );

    return this;
  }

  static associate(models) {
    this.hasMany(models.Produtos, {
      foreignKey: "liga_id",
      as: "produtos",
    });
  }
}

export default Liga;