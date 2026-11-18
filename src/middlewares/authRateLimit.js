import { rateLimit } from "express-rate-limit";

// Limite compartilhado entre login, cadastro e verificação de e-mail.
// O armazenamento em memória atende a uma única instância; produção com
// múltiplas instâncias deve usar um store compartilhado (ex.: Redis).
const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { erro: "Muitas tentativas. Aguarde um minuto e tente novamente." },
});

export default authRateLimit;
