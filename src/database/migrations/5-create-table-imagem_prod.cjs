"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("imagem_prod", {
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
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("imagem_prod");
  },
};