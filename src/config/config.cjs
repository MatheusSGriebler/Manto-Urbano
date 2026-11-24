require("dotenv").config();

function resolverConexao() {
  const dialect = process.env.DB_DIALECT || "postgres";
  let host = process.env.DB_HOST || "localhost";
  let port = Number(process.env.DB_PORT || (dialect === "mysql" ? 3306 : 5432));
  let username = process.env.DB_USER || "postgres";
  let password = process.env.DB_PASSWORD || "";
  let database = process.env.DB_NAME || "manto_urbano";

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    host = url.hostname;
    port = Number(url.port || 5432);
    username = decodeURIComponent(url.username);
    password = decodeURIComponent(url.password);
    database = url.pathname.replace(/^\//, "");
  }

  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
  const usarSsl =
    process.env.DB_SSL === "true" ||
    (process.env.DB_SSL !== "false" && !isLocal);

  return {
    dialect,
    host,
    port,
    username,
    password,
    database,
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
  };
}

const base = resolverConexao();

const development = { ...base };

const production = { ...base };

if (
  process.env.NODE_ENV === "production" &&
  !process.env.DATABASE_URL &&
  [process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME].some(v => !v)
) {
  throw new Error("Configure DATABASE_URL ou DB_HOST, DB_USER, DB_PASSWORD e DB_NAME para produção.");
}

module.exports = { development, production };
