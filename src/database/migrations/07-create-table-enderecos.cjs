"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("enderecos", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "clientes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
    await queryInterface.dropTable("enderecos");
  },
};