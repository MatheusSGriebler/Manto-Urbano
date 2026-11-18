
async function createProduct() {

    const nome = document.getElementById("nome").value;
    const desc = document.getElementById("desc").value;
    const preco = document.getElementById("preco").value;
    const categoria_id = document.getElementById("categoria").value;
    const liga_id = document.getElementById("liga").value;

    // o botão é type="button", então o required do HTML não barra sozinho
    if (!liga_id) {
        alert("Selecione a liga do produto.");
        return;
    }

    const tamanhos = {};

    document.querySelectorAll('input[name="tamanhos"]:checked').forEach((checkbox) => {

        const tamanho = checkbox.value;

        const estoque = document.querySelector(
            `input[name="estoque_${tamanho}"]`
        ).value;

        tamanhos[tamanho] = Number(estoque);
    });

    const produto = {
        nome,
        desc,
        preco: Number(preco),
        categoria_id: Number(categoria_id),
        liga_id: Number(liga_id),
        tamanhos
    };

    console.log(produto);

    try {

        const response = await fetchAutenticado("http://127.0.0.1:3000/produtos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(produto)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erro ao cadastrar produto.");
        }

        for (const imagem of imagens) {

    const imagemResponse = await fetchAutenticado("http://127.0.0.1:3000/imagens", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            produto_id: data.id,
            url: imagem.url,
            principal: imagem.principal
            })
        });

        if (!imagemResponse.ok) {
            const erroImagem = await imagemResponse.json();
            throw new Error(
                erroImagem.error || "Erro ao cadastrar imagem."
            );
        }
    }

        console.log("Produto cadastrado:", data);

        alert("Produto cadastrado com sucesso!");
        imagens = [];
        mostrarImagens();


    } catch (error) {

        console.error(error);
        alert(error.message);

    }
}


let imagens = [];

function validarUrlImagemHttps(valor) {
    try {
        const url = new URL(valor);
        return url.protocol === "https:" && !url.username && !url.password
            ? url.href
            : null;
    } catch {
        return null;
    }
}

function adicionarImagem() {
    const valorUrl = document.getElementById("imagemUrl").value.trim();
    const url = validarUrlImagemHttps(valorUrl);
    const principal = document.getElementById("imagemPrincipal").checked;

    if (!url) {
        alert("Informe uma URL HTTPS válida para a imagem.");
        return;
    }

    if (principal) {
        imagens.forEach(imagem => imagem.principal = false);
    }

    imagens.push({
        url: url,
        principal: principal
    });

    document.getElementById("imagemUrl").value = "";
    document.getElementById("imagemPrincipal").checked = false;

    mostrarImagens();
}

function mostrarImagens() {
    const lista = document.getElementById("listaImagens");
    lista.replaceChildren();

    imagens.forEach((imagem, index) => {
        const item = document.createElement("div");
        item.className = "imagem-item";

        const img = document.createElement("img");
        img.src = validarUrlImagemHttps(imagem.url) ?? "/imgs/sem-imagem.png";
        img.alt = "Imagem do produto";

        const info = document.createElement("div");
        info.className = "imagem-info";

        const legenda = document.createElement("span");
        legenda.textContent = imagem.principal ? "⭐ Imagem principal" : `Imagem ${index + 1}`;

        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = "Remover";
        botao.addEventListener("click", () => removerImagem(index));

        info.append(legenda, botao);
        item.append(img, info);
        lista.appendChild(item);
    });
}

function removerImagem(index) {

    imagens.splice(index, 1);

    mostrarImagens();
}
