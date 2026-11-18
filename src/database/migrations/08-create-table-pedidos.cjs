"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pedidos", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "clientes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
      references: { model: "enderecos", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
      },

      data_add: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      data_upd: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("pedidos");
  },
};
