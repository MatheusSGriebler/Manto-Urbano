const API_BASE_URL = ["5500", "5501"].includes(window.location.port)
    ? "http://localhost:3000"
    : "";

const TOKEN_KEY = "token";
const CLIENTE_KEY = "cliente";

function salvarSessao(token, cliente) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CLIENTE_KEY, JSON.stringify(cliente));
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getClienteLogado() {
    const dados = localStorage.getItem(CLIENTE_KEY);
    return dados ? JSON.parse(dados) : null;
}

function estaLogado() {
    return !!getToken();
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CLIENTE_KEY);
    window.location.href = "/index.html";
}

async function fetchAutenticado(url, options = {}) {
    const token = getToken();

    const headers = {
        ...(options.headers ?? {}),
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return fetch(url, { ...options, headers });
}

function atualizarMenuUsuario() {
    const linkUsuario = document.querySelector('.menu-right a[href="/login.html"]');

    if (!linkUsuario) return;

    if (estaLogado()) {
        const cliente = getClienteLogado();
        const primeiroNome = String(cliente?.nome ?? "").trim().split(" ")[0] || "Conta";

        linkUsuario.href = "/cliente.html";
        linkUsuario.replaceChildren();
        const icone = document.createElement("i");
        icone.className = "fa-solid fa-user";
        linkUsuario.append(icone, ` ${primeiroNome}`);
        // sem onclick de logout aqui — o link normal já leva pra cliente.html

        const menuDireito = linkUsuario.closest(".menu-right");
        if (isAdmin() && menuDireito && !menuDireito.querySelector(".menu-admin-item")) {
            const liAdmin = document.createElement("li");
            liAdmin.className = "menu-admin-item";

            const linkAdmin = document.createElement("a");
            linkAdmin.href = "/admin.html";
            linkAdmin.className = "menu-admin-link";
            linkAdmin.setAttribute("aria-label", "Painel Admin");

            const iconeAdmin = document.createElement("i");
            iconeAdmin.className = "fa-solid fa-shield-halved";
            linkAdmin.append(iconeAdmin, " Admin");

            liAdmin.appendChild(linkAdmin);
            menuDireito.appendChild(liAdmin);
        }
    }
}
function getRole() {
    const cliente = getClienteLogado();
    return cliente?.role ?? null;
}

function isAdmin() {
    return getRole() === "admin";
}

document.addEventListener("DOMContentLoaded", atualizarMenuUsuario);