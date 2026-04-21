import { Router } from "express";

import ProdutosController from "./controllers/ProdutosController.js";
import CategoriaController from "./controllers/CategoriaController.js";
import ImagemController from "./controllers/ImagemController.js";
import authController from "./controllers/authController.js";

const routes = new Router();

/*
|--------------------------------------------------------------------------
| CATEGORIAS
|--------------------------------------------------------------------------
*/

routes.get("/categorias", CategoriaController.index);
routes.get("/categorias/:id", CategoriaController.show);
routes.post("/categorias", CategoriaController.store);
routes.put("/categorias/:id", CategoriaController.update);
routes.delete("/categorias/:id", CategoriaController.destroy);

/*
|--------------------------------------------------------------------------
| PRODUTOS
|--------------------------------------------------------------------------
*/

routes.get("/produtos", ProdutosController.index);
routes.get("/produtos/:id", ProdutosController.show);
routes.post("/produtos", ProdutosController.store);
routes.put("/produtos/:id", ProdutosController.update);
routes.delete("/produtos/:id", ProdutosController.destroy);

/*
|--------------------------------------------------------------------------
| IMAGENS
|--------------------------------------------------------------------------
*/

// listar imagens de um produto
routes.get("/produtos/:produto_id/imagens", ImagemController.index);

// adicionar imagem
routes.post("/imagens", ImagemController.store);

// definir imagem principal
routes.put("/imagens/:id/principal", ImagemController.setPrincipal);

// deletar imagem
routes.delete("/imagens/:id", ImagemController.destroy);

//LOGIN
routes.post("/cadastro", authController.cadastrar);
routes.post("/login", authController.login);
routes.post("/verificar-email", authController.verificarEmail);

export default routes;