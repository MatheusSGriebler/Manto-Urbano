"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("produtos", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      desc: {
        type: Sequelize.STRING,
      },
      preco: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      categoria_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "categorias",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      liga_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'ligas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.dropTable("produtos");
  },
};