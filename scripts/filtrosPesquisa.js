import { Op, fn, col, where as seqWhere } from "sequelize";

// a ordenação vem de uma lista fechada: nunca usa o texto da URL como coluna
const ORDENACOES = {
  recentes: [["id", "DESC"]],
  preco_asc: [["preco", "ASC"], ["id", "ASC"]],
  preco_desc: [["preco", "DESC"], ["id", "ASC"]],
  nome: [["nome", "ASC"]],
};

function numeroOuNull(valor) {
  if (valor === undefined || valor === "") return null;
  const n = Number(String(valor).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// escapa % e _ pra o que o cliente digitar não virar curinga do LIKE
function escaparLike(texto) {
  return texto.replace(/[\\%_]/g, "\\$&");
}

function removerAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function montarFiltrosProdutos(query = {}) {
  const where = {};

  const busca = String(query.busca ?? "").trim().slice(0, 60);
  if (busca) {
    const ehPostgres = (process.env.DB_DIALECT || "postgres") === "postgres";
    if (ehPostgres) {
      const termo = `%${escaparLike(removerAcentos(busca))}%`;
      where[Op.or] = [
        seqWhere(fn("unaccent", col("Produtos.nome")), { [Op.iLike]: termo }),
        seqWhere(fn("unaccent", col("Produtos.desc")), { [Op.iLike]: termo }),
      ];
    } else {
      const termo = `%${escaparLike(busca)}%`;
      where[Op.or] = [
        { nome: { [Op.like]: termo } },
        { desc: { [Op.like]: termo } },
      ];
    }
  }

  let min = numeroOuNull(query.preco_min);
  let max = numeroOuNull(query.preco_max);

  if (min !== null && max !== null && min > max) {
    [min, max] = [max, min]; // digitou invertido: troca em vez de devolver vazio
  }

  if (min !== null || max !== null) {
    where.preco = {};
    if (min !== null) where.preco[Op.gte] = min;
    if (max !== null) where.preco[Op.lte] = max;
  }

  const order = ORDENACOES[query.ordem] ?? ORDENACOES.recentes;

  return { where, order };
}