"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tamanho_prod", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      produto_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "produtos",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      tamanho_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "tamanhos",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      estoque: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tamanho_prod");
  },
};