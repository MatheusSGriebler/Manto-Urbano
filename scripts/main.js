document.addEventListener("DOMContentLoaded", () => {
    const lupa = document.getElementById("btn-lupa");
    const form = document.getElementById("filtrosInicio");
    const input = document.getElementById("busca-lupa")

    if (!lupa || !form || !input) return;

    lupa.addEventListener("click", (e) => {
        e.preventDefault();
        form.classList.toggle("aberto");

        if (form.classList.contains("aberto")) {
            input.focus();
        }
    });

    // Esc fecha a busca
    input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            form.classList.remove("aberto");
        }
    });

    // Enter manda pra página de produtos já com a busca na URL
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const busca = input.value.trim();
        if (!busca) return;

        window.location.href = `/camisetas.html?busca=${encodeURIComponent(busca)}`;
    });
});



//////montar menu

async function carregarLigasMenu() {
    const submenu = document.getElementById("submenu-ligas");
    if (!submenu) return;

    try {
        const resposta = await fetch("http://localhost:3000/ligas");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar ligas");
        }

        const ligas = await resposta.json();

        ligas.forEach(liga => {
            const item = document.createElement("li");
            const link = document.createElement("a");

            link.href = `/camisetas.html?liga=${liga.id}`;
            link.textContent = liga.nome;

            item.appendChild(link);
            submenu.appendChild(item);
        });

    } catch (erro) {
        console.error(erro);
        // sem ligas, o submenu não aparece vazio ao passar o mouse
        submenu.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", carregarLigasMenu);