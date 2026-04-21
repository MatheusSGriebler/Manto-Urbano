import Sequelize, { Model } from "sequelize";

class Cliente extends Model {
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
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
            isEmail: true
            }
        },
        senha: {
            type: Sequelize.STRING,
            allowNull: false
        },
        data_nasc:{
          type: Sequelize.DATE,
          allowNull: false
        },
      },
      {
        sequelize,
        tableName: "clientes",
        timestamps: true,
        createdAt: "data_add",
        updatedAt: "data_upd",
      }
    );

    return this;
  }
}

export default Cliente;