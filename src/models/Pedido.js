import Sequelize, { Model } from "sequelize";

class Pedido extends Model {
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

        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "PENDENTE",
        },

        valor_total: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        valor_frete: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        endereco_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      },
      {
        sequelize,
        tableName: "pedidos",
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

    this.hasMany(models.ItensPedido, {
      foreignKey: "pedido_id",
      as: "itens",
    });

    // NOVO
    this.hasOne(models.Rastreio, {
      foreignKey: "pedido_id",
      as: "rastreio",
    });
    this.belongsTo(models.Endereco, {
      foreignKey: "endereco_id",
      as: "endereco",
    });
}
}

export default Pedido;
