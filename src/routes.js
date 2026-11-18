import { Router } from "express";

import ProdutosController from "./controllers/ProdutosController.js";
import CategoriaController from "./controllers/CategoriaController.js";
import LigaController from "./controllers/LigaController.js";
import ImagemController from "./controllers/ImagemController.js";
import authController from "./controllers/authController.js";
import PedidosController from "./controllers/PedidosController.js";
import authMiddleware from "./middlewares/auth.js";
import adminMiddleware from "./middlewares/admin.js";
import RastreioController from "./controllers/RastreioController.js";
import EnderecoController from "./controllers/EnderecoController.js";
import authRateLimit from "./middlewares/authRateLimit.js";

const routes = new Router();

/*
|--------------------------------------------------------------------------
| CATEGORIAS
|--------------------------------------------------------------------------
*/

routes.get("/categorias", CategoriaController.index);
routes.get("/categorias/:id", CategoriaController.show);
routes.post("/categorias", authMiddleware, adminMiddleware, CategoriaController.store);
routes.put("/categorias/:id", authMiddleware, adminMiddleware, CategoriaController.update);
routes.delete("/categorias/:id", authMiddleware, adminMiddleware, CategoriaController.destroy);

/*
|--------------------------------------------------------------------------
| LIGAS
|--------------------------------------------------------------------------
*/

routes.get("/ligas", LigaController.index);
routes.post("/ligas", authMiddleware, adminMiddleware, LigaController.store);
routes.put("/ligas/:id", authMiddleware, adminMiddleware, LigaController.update);
routes.delete("/ligas/:id", authMiddleware, adminMiddleware, LigaController.destroy);

/*
|--------------------------------------------------------------------------
| PRODUTOS
|--------------------------------------------------------------------------
*/

routes.get("/produtos", ProdutosController.index);
routes.get("/produtos/categoria/:categoria_id", ProdutosController.categoria);
routes.get("/produtos/:id", ProdutosController.show);
routes.post("/produtos", authMiddleware, adminMiddleware, ProdutosController.store);
routes.put("/produtos/:id", authMiddleware, adminMiddleware, ProdutosController.update);
routes.delete("/produtos/:id", authMiddleware, adminMiddleware, ProdutosController.destroy);

/*
|--------------------------------------------------------------------------
| IMAGENS
|--------------------------------------------------------------------------
*/

routes.get("/produtos/:produto_id/imagens", ImagemController.index);
routes.post("/imagens", authMiddleware, adminMiddleware, ImagemController.store);
routes.put("/imagens/:id/principal", authMiddleware, adminMiddleware, ImagemController.setPrincipal);
routes.delete("/imagens/:id", authMiddleware, adminMiddleware, ImagemController.destroy);

/*
|--------------------------------------------------------------------------
| PEDIDOS
|--------------------------------------------------------------------------
*/

routes.get("/pedidos", authMiddleware, adminMiddleware, PedidosController.index);
routes.get("/pedidos/meus", authMiddleware, PedidosController.meusPedidos);
routes.post("/pedidos/cotacao", PedidosController.cotacao);
routes.get("/pedidos/:id", authMiddleware, PedidosController.show);
routes.post("/pedidos", authMiddleware, PedidosController.store);
routes.put("/pedidos/:id", authMiddleware, adminMiddleware, PedidosController.update);
routes.delete("/pedidos/:id", authMiddleware, adminMiddleware, PedidosController.destroy);
routes.patch("/pedidos/:id/cancelar", authMiddleware, adminMiddleware, PedidosController.cancelar);

//LOGIN
routes.post("/cadastro", authRateLimit, authController.cadastrar);
routes.post("/login", authRateLimit, authController.login);
routes.post("/verificar-email", authRateLimit, authController.verificarEmail);

routes.get("/pedidos/:pedido_id/rastreio", authMiddleware, RastreioController.show);
routes.post("/pedidos/:pedido_id/rastreio", authMiddleware, adminMiddleware, RastreioController.store);
routes.put("/pedidos/:pedido_id/rastreio", authMiddleware, adminMiddleware, RastreioController.update);


//ENDERECO
routes.get("/enderecos", authMiddleware, EnderecoController.index);
routes.post("/enderecos", authMiddleware, EnderecoController.store);
routes.delete("/enderecos/:id", authMiddleware, EnderecoController.destroy);

export default routes;
