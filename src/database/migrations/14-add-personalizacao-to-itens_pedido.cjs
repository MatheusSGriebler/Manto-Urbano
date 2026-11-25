"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("itens_pedido");
    if (!columns.personalizacao) {
      await queryInterface.addColumn("itens_pedido", "personalizacao", {
        type: Sequelize.STRING(60),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable("itens_pedido");
    if (columns.personalizacao) {
      await queryInterface.removeColumn("itens_pedido", "personalizacao");
    }
  },
};
