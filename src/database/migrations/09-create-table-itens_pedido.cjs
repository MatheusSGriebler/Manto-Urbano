"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("itens_pedido", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      pedido_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "pedidos",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      produto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "produtos",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      tamanho_prod_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "tamanho_prod",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("itens_pedido");
  },
};