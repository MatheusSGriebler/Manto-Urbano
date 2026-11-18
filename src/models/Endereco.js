import Sequelize, { Model } from "sequelize";

class Endereco extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        cliente_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        identificacao: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        nome_recebedor: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        cep: {
          type: Sequelize.STRING(8),
          allowNull: false,
        },
        endereco: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        numero: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        complemento: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        bairro: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        cidade: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        estado: {
          type: Sequelize.STRING(2),
          allowNull: false,
        },
        referencia: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        telefone: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        ativo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: "enderecos",
        timestamps: true,
        createdAt: "data_add",
        updatedAt: "data_upd",
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Cliente, {
      foreignKey: "cliente_id",
      as: "cliente",
    });
  }
}

export default Endereco;