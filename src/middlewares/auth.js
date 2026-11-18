import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token não fornecido." });
  }

  const [, token] = authHeader.split(" "); // formato: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ erro: "Token mal formatado." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.cliente_id = decoded.cliente_id;
    req.role = decoded.role;
    return next();
  } catch (err) {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}