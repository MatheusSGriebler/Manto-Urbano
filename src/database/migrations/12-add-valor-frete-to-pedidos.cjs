"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("pedidos");
    if (!columns.valor_frete) {
      await queryInterface.addColumn("pedidos", "valor_frete", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable("pedidos");
    if (columns.valor_frete) {
      await queryInterface.removeColumn("pedidos", "valor_frete");
    }
  },
};
