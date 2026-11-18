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
        role: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: "cliente",
        },
        aceite_documentos_em: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        versao_termos_aceita: {
            type: Sequelize.STRING(20),
            allowNull: true,
        },
        versao_politica_ciente: {
            type: Sequelize.STRING(20),
            allowNull: true,
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
static associate(models) {
  this.hasMany(models.Pedido, {
    foreignKey: "cliente_id",
    as: "pedidos",
  });
  this.hasMany(models.Endereco, {
  foreignKey: "cliente_id",
  as: "enderecos",
  });
}
  
}

export default Cliente;
