const production = process.env.NODE_ENV === "production";

const databaseConfig = {
  dialect: "mysql",
  host: process.env.DB_HOST || (production ? undefined : "localhost"),
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || (production ? undefined : "root"),
  password: process.env.DB_PASSWORD || (production ? undefined : ""),
  database: process.env.DB_NAME || (production ? undefined : "manto_urbano"),
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
    underscoredAll: false,
    freezeTableName: true,
  },
};

if (production) {
  const obrigatorias = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const faltando = obrigatorias.filter(nome => !process.env[nome]);
  if (faltando.length) {
    throw new Error(`Variáveis de banco ausentes: ${faltando.join(", ")}`);
  }
  if (process.env.DB_USER.toLowerCase() === "root") {
    throw new Error("O usuário root não pode ser usado em produção.");
  }
}

export default databaseConfig;
