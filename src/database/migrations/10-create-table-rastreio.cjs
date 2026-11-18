"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rastreios", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      pedido_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true, // um pedido tem um rastreio só
        references: { model: "pedidos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // apagou o pedido, apaga o rastreio junto
      },
      codigo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      transportadora: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      data_add: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      data_upd: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rastreios");
  },
};