export default function adminMiddleware(req, res, next) {
  if (req.role !== "admin") {
    return res.status(403).json({ erro: "Acesso restrito a administradores." });
  }
  return next();
}