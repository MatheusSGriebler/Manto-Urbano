async function validarLogin() {
    event.preventDefault();
    
    const emailInput = document.getElementById("email");
    const email = emailInput.value;

    if (!emailInput.checkValidity()) {
        console.log("Sem email");
        emailInput.style.border= "1px solid #ff0000";
        return;
    }

    const res = await fetch("http://localhost:3000/verificar-email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
    });

    const data = await res.json();

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
async function registrar() {

    const emailInput = document.getElementById("email");
    const email = emailInput.value;

    const nomeInput = document.getElementById("nome");
    const nome = nomeInput.value;

    const senhaInput = document.getElementById("senha");
    const senha = senhaInput.value;

    const dataInput = document.getElementById("datanasc");
    const data_nasc = dataInput.value;

    console.log({nome});
    
    const res = await fetch("http://localhost:3000/cadastro", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email,senha,nome,data_nasc})
    });
    redirecionar();
}
async function login(){
    
    const emailInput = document.getElementById("email");
    const email = emailInput.value;
    const senhaInput = document.getElementById("senhaL");
    const senha = senhaInput.value;

    const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email,senha})
    });
    const data = await res.json();

    if(res.ok){
        console.log("Login feito");
    window.location.replace("/index.html");
    } else {
    console.log(data.erro);
    document.getElementById("erro").style.display = "block";
    }
}

async function redirecionar(){

    document.getElementById("email").style.display = "none";
    document.getElementById("nome").style.display = "none";
    document.getElementById("senha").style.display = "none";
    document.getElementById("datanasc").style.display = "none";
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