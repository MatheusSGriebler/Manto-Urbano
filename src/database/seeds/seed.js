// src/database/seeds/seed.js (localização do arquivo)

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Caminhos corrigidos baseados na localização de seed.js em 'src/database/seeds/'
// Alterado para 'db' caso 'index.js' exporte um objeto com a instância Sequelize
import db from "../index.js"; // Para src/database/index.js
import Clientes from "../../models/Clientes.js"; // Para src/models/Clientes.js
import Carros from "../../models/Carros.js"; // Para src/models/Carros.js
import Locacao from "../../models/Locacao.js"; // Para src/models/Locacao.js

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para converter data de DD-MM-YYYY para YYYY-MM-DD (formato ISO)
function convertDateToISO(dateString) {
  const [day, month, year] = dateString.split("-");
  return `${year}-${month}-${day}`;
}

async function seedDatabase() {
  // DEBUG: Adicione um log para verificar o que 'db' realmente contém
  console.log("Tipo de db após importação:", typeof db);
  console.log("Conteúdo de db após importação:", db);
  // CORREÇÃO: A instância do Sequelize está em db.connection
  const sequelizeInstance = db.connection; // Agora aponta diretamente para a conexão Sequelize

  try {
    // 1. Leia o arquivo JSON
    // Se 'locadora.json' estiver na raiz do projeto (SEQUELIZE-FK/locadora.json)
    // O caminho deve ser ajustado para subir várias pastas:
    const jsonDataPath = path.resolve(__dirname, "../../../locadora.json");
    // Ou, se você colocou 'locadora.json' dentro de 'src/database/seeds/' (não recomendado, mas possível)
    // const jsonDataPath = path.resolve(__dirname, 'locadora.json');

    const data = JSON.parse(readFileSync(jsonDataPath, "utf8"));

    // 2. Sincronize os modelos com o banco de dados
    // Usando sequelizeInstance para garantir que estamos chamando sync na instância correta do Sequelize
    await sequelizeInstance.sync({ force: true });
    console.log("Tabelas sincronizadas com sucesso.");

    // 3. Insira os Clientes
    console.log("Inserindo Clientes...");
    for (const cliente of data.clientes) {
      await Clientes.create(cliente);
    }
    console.log("Clientes inseridos com sucesso.");

    // 4. Insira os Carros
    console.log("Inserindo Carros...");
    for (const carro of data.carros) {
      await Carros.create(carro);
    }
    console.log("Carros inseridos com sucesso.");

    // 5. Insira as Locações
    console.log("Inserindo Locações...");
    for (const locacao of data.locacoes) {
      const locacaoData = {
        ...locacao,
        data_inicio: convertDateToISO(locacao.data_inicio),
        data_fim: convertDateToISO(locacao.data_fim),
      };
      await Locacao.create(locacaoData);
    }
    console.log("Locações inseridas com sucesso.");

    console.log("Dados importados para o banco de dados com sucesso!");
  } catch (error) {
    console.error("Erro ao importar dados para o banco de dados:", error);
  } finally {
    // Usando sequelizeInstance para garantir que estamos chamando close na instância correta do Sequelize
    if (sequelizeInstance && typeof sequelizeInstance.close === "function") {
      await sequelizeInstance.close();
      console.log("Conexão com o banco de dados fechada.");
    } else {
      console.log(
        "Não foi possível fechar a conexão do banco de dados (sequelizeInstance.close não é uma função)."
      );
    }
  }
}

// Execute a função de seed
seedDatabase();
