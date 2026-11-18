import express from "express";
import cors from "cors";
import routes from "./routes.js";
import { jsonError } from "./middlewares/error.js";
import "./database/index.js";

class App {
  constructor() {
    this.server = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    const trustProxyHops = process.env.TRUST_PROXY_HOPS;
    if (trustProxyHops !== undefined) {
      const hops = Number(trustProxyHops);
      if (!Number.isInteger(hops) || hops < 1) {
        throw new Error("TRUST_PROXY_HOPS deve ser um inteiro positivo.");
      }
      this.server.set("trust proxy", hops);
    }

    const origensPermitidas = (process.env.CORS_ORIGINS || "")
      .split(",")
      .map(origem => origem.trim())
      .filter(Boolean);

    if (process.env.NODE_ENV === "production" && origensPermitidas.length === 0) {
      throw new Error("Configure CORS_ORIGINS com o domínio do frontend em produção.");
    }

    this.server.use(cors({
      origin(origem, callback) {
        if (!origem || (origensPermitidas.length === 0 && process.env.NODE_ENV !== "production") || origensPermitidas.includes(origem)) {
          return callback(null, true);
        }
        return callback(new Error("Origem não permitida pelo CORS."));
      },
    }));
    this.server.use(express.json({ limit: "32kb" }));
    this.server.use(jsonError);
  }

  routes() {
    this.server.use(routes);
  }
}

export default new App().server;
