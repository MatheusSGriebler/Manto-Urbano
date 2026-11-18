import Sequelize, { Model } from "sequelize";

class ItensPedido extends Model {
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
        },

        produto_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        tamanho_prod_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        quantidade: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },

        preco_unitario: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },

        subtotal: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "itens_pedido",
        timestamps: false,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Pedido, {
      foreignKey: "pedido_id",
      as: "pedido",
    });

    this.belongsTo(models.Produtos, {
      foreignKey: "produto_id",
      as: "produto",
    });

    this.belongsTo(models.Tamanho_prod, {
      foreignKey: "tamanho_prod_id",
      as: "tamanho_prod",
    });
  }
}

export default ItensPedido;