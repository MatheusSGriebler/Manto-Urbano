"use strict";

module.exports = {
  async up(queryInterface) {
    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query("CREATE EXTENSION IF NOT EXISTS unaccent;");
    }
  },

  async down() {
    // Extensão pode ser compartilhada; não removemos no down.
  },
};
