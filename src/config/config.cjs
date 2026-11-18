require("dotenv").config();

const development = {
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "manto_urbano",
};

const production = {
  dialect: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

if ([production.host, production.username, production.password, production.database].some(v => !v)) {
  // A configuração development continua disponível para rodar migrations localmente.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Configure DB_HOST, DB_USER, DB_PASSWORD e DB_NAME para produção.");
  }
}

module.exports = { development, production };
