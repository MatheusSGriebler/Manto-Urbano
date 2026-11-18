const jwtSecret = process.env.JWT_SECRET;

if (typeof jwtSecret !== "string" || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres.");
}

if (process.env.NODE_ENV === "production") {
  const variaveisBanco = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const faltando = variaveisBanco.filter(nome => !process.env[nome]);
  if (faltando.length) {
    throw new Error(`Configure as variáveis de banco: ${faltando.join(", ")}.`);
  }
  if (process.env.DB_USER.toLowerCase() === "root") {
    throw new Error("Configure um usuário de banco sem privilégios de root.");
  }
}
