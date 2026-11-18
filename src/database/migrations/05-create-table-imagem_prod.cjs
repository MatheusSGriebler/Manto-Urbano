"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
await queryInterface.createTable("imagem_prod", {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },

    produto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },

    url: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    principal: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable("imagem_prod");
  },
};