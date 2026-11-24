async function validarLogin() {
    event.preventDefault();
    
    const emailInput = document.getElementById("email");
    const email = emailInput.value;

    if (!emailInput.checkValidity()) {
        console.log("Sem email");
        emailInput.style.border= "1px solid #ff0000";
        return;
    }

    const res = await fetch(API_BASE_URL + "/verificar-email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        alert(data.erro || "Não foi possível verificar o e-mail. Tente novamente.");
        return;
    }

    if (data.existe) {
        console.log("Email existe → fluxo de LOGIN");
        document.getElementById("login").style.display = "block";
        document.getElementById("cadastro").style.display = "none";
        document.getElementById("botao").style.display = "none";
    } else {
        cadastro();
    }
}

async function cadastro(){
        const emailInput = document.getElementById("email");
        const email = emailInput.value;
        document.getElementById("login").style.display = "none";
        document.getElementById("cadastro").style.display = "block";
        document.getElementById("botao").style.display = "none";
        document.getElementById("titulo").textContent = "Crie sua conta";
}
async function login(){

    const emailInput = document.getElementById("email");
    const email = emailInput.value;
    const senhaInput = document.getElementById("senhaL");
    const senha = senhaInput.value;

    const res = await fetch(API_BASE_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
        salvarSessao(data.token, data.cliente);
        window.location.replace("/index.html");
    } else {
        const mensagemErro = document.getElementById("erro");
        mensagemErro.textContent = data.erro || "Email ou senha inválidos.";
        mensagemErro.style.display = "block";
    }
}

async function registrar() {

    const email = document.getElementById("email").value;
    const nome = document.getElementById("nome").value;
    const senha = document.getElementById("senha").value;
    const aceiteDocumentos = document.getElementById("aceite-documentos");

    if (!aceiteDocumentos.checked) {
        aceiteDocumentos.reportValidity();
        return;
    }

    const res = await fetch(API_BASE_URL + "/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email,
            senha,
            nome,
            aceite_documentos: aceiteDocumentos.checked,
        })
    });

    const data = await res.json();

    if (res.ok) {
        salvarSessao(data.token, data.cliente); // já loga automaticamente
        redirecionar();
    } else {
        alert(data.erro || "Erro no cadastro.");
    }
}

async function redirecionar(){

    document.getElementById("email").style.display = "none";
    document.getElementById("nome").style.display = "none";
    document.getElementById("senha").style.display = "none";
    document.getElementById("botaoC").style.display = "none";

    document.getElementById("titulo").textContent = "Cadastro realizado! Seja bem vindo! Redirecionando para a tela inicial em 5 segundos!";

    let contador = 0;

const intervalo = setInterval(() => {
    contador++;

    if (contador === 5) {
        clearInterval(intervalo);
        window.location.replace("/index.html");
    }
}, 1000);
}
