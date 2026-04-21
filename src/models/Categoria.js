import Sequelize, { Model } from "sequelize";

class Categoria extends Model {
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
      },
      {
        sequelize,
        tableName: "categorias",
        timestamps: true,
        createdAt: "data_add",
        updatedAt: "data_upd",
      }
    );

    return this;
  }

  static associate(models) {
    this.hasMany(models.Produtos, {
      foreignKey: "categoria_id",
      as: "produtos",
    });
  }
}

export default Categoria;