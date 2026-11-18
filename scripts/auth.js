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

        linkUsuario.href = "/cliente.html";
        linkUsuario.innerHTML = `<i class="fa-solid fa-user"></i> ${cliente.nome.split(" ")[0]}`;
        // sem onclick de logout aqui — o link normal já leva pra cliente.html
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