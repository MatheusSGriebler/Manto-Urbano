"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("pedidos");
    if (!columns.stripe_session_id) {
      await queryInterface.addColumn("pedidos", "stripe_session_id", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable("pedidos");
    if (columns.stripe_session_id) {
      await queryInterface.removeColumn("pedidos", "stripe_session_id");
    }
  },
};
