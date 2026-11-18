"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Clientes já existentes não aceitaram necessariamente a versão atual;
    // manter nulo evita fabricar um registro retroativo.
    await queryInterface.addColumn("clientes", "aceite_documentos_em", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "versao_termos_aceita", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "versao_politica_ciente", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("clientes", "versao_politica_ciente");
    await queryInterface.removeColumn("clientes", "versao_termos_aceita");
    await queryInterface.removeColumn("clientes", "aceite_documentos_em");
  },
};
