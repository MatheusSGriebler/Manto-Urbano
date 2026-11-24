const production = process.env.NODE_ENV === "production";
const dialect = process.env.DB_DIALECT || "postgres";

let host = process.env.DB_HOST || (production ? undefined : "localhost");
let port = Number(process.env.DB_PORT || (dialect === "mysql" ? 3306 : 5432));
let username = process.env.DB_USER || (production ? undefined : "postgres");
let password = process.env.DB_PASSWORD || (production ? undefined : "");
let database = process.env.DB_NAME || (production ? undefined : "manto_urbano");

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  host = url.hostname;
  port = Number(url.port || 5432);
  username = decodeURIComponent(url.username);
  password = decodeURIComponent(url.password);
  database = url.pathname.replace(/^\//, "");
} else if (production) {
  const obrigatorias = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const faltando = obrigatorias.filter(nome => !process.env[nome]);
  if (faltando.length) {
    throw new Error(`Variáveis de banco ausentes: ${faltando.join(", ")}`);
  }
}

if (production && username && username.toLowerCase() === "root") {
  throw new Error("O usuário root não pode ser usado em produção.");
}

const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
const usarSsl =
  process.env.DB_SSL === "true" ||
  (process.env.DB_SSL !== "false" && Boolean(host) && !isLocal);

const databaseConfig = {
  dialect,
  host,
  port,
  username,
  password,
  database,
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  ...(usarSsl
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }
    : {}),
  define: {
    timestamps: true,
    underscored: false,
    underscoredAll: false,
    freezeTableName: true,
  },
};

export default databaseConfig;
