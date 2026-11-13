// =========================================================================
// URLs DOS WEBHOOKS DO MAKE
// =========================================================================
const WEBHOOK_CADASTRO = "https://hook.us2.make.com/oze3i52yd2cevi69jg1wxsko67r78k4e";
const WEBHOOK_LOGIN = "https://hook.us2.make.com/oze3i52yd2cevi69jg1wxsko67r78k4e"; // mesmo webhook do cadastro; o campo "acao" separa os dois
const WEBHOOK_GOOGLE = "https://hook.us2.make.com/SEU_WEBHOOK_GOOGLE"; // trocar quando criar o cenário do Google

// Verifica se uma URL ainda é o texto de exemplo
function webhookNaoConfigurado(url) {
    return url.includes("SEU_WEBHOOK");
}

document.addEventListener("DOMContentLoaded", function () {
    const formCadastro = document.getElementById("formCadastro");
    const formLogin = document.getElementById("formLogin");
    const btnGoogleCustom = document.getElementById("btnGoogleCustom");

    // ---------------------------------------------------------------------
    // 1. FLUXO DE CRIAR CONTA (Cadastrar.html)
    // ---------------------------------------------------------------------
    if (formCadastro) {
        formCadastro.addEventListener("submit", async function (e) {
            e.preventDefault();

            const nome = document.getElementById("nome").value.trim();
            const telefone = document.getElementById("telefone").value.trim();
            const email = document.getElementById("email").value.trim().toLowerCase();
            const senha = document.getElementById("senha").value;
            const confirmar = document.getElementById("confirmar").value;

            if (senha !== confirmar) {
                alert("As senhas não coincidem. Verifique e tente novamente.");
                return;
            }

            const btnSubmit = formCadastro.querySelector("button[type='submit']");
            const textoOriginal = btnSubmit.textContent;
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Criando conta...";

            try {
                const response = await fetch(WEBHOOK_CADASTRO, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        acao: "cadastrar",
                        nome: nome,
                        telefone: telefone,
                        email: email,
                        senha: senha
                    })
                });

                // O Make responde 200 com {"ok": true} ou 409 com {"ok": false, "mensagem": "..."}
                const resultado = await response.json().catch(() => ({}));

                if (response.ok && resultado.ok === true) {
                    alert("Conta criada com sucesso! Agora você já pode entrar.");
                    window.location.href = "entrar.html";
                } else {
                    alert(resultado.mensagem || "Não foi possível criar a conta. Tente novamente.");
                }
            } catch (error) {
                console.error("Erro no cadastro:", error);
                alert("Erro de conexão com o servidor. Tente novamente.");
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = textoOriginal;
            }
        });
    }

    // ---------------------------------------------------------------------
    // 2. FLUXO DE LOGIN TRADICIONAL (entrar.html)
    // ---------------------------------------------------------------------
    if (formLogin) {
        formLogin.addEventListener("submit", async function (e) {
            e.preventDefault();

            if (webhookNaoConfigurado(WEBHOOK_LOGIN)) {
                alert("O login ainda não foi configurado. Falta colocar a URL do webhook de login no auth.js.");
                return;
            }

            const email = document.getElementById("email").value.trim().toLowerCase();
            const senha = document.getElementById("senha").value;

            const btnSubmit = formLogin.querySelector("button[type='submit']");
            const textoOriginal = btnSubmit.textContent;
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Entrando...";

            try {
                const response = await fetch(WEBHOOK_LOGIN, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        acao: "login",
                        email: email,
                        senha: senha
                    })
                });

                const resultado = await response.json().catch(() => ({}));

                if (response.ok && resultado.ok === true) {
                    // Guarda os dados básicos do usuário no navegador
                    localStorage.setItem("usuarioCorteAqui", JSON.stringify({
                        nome: resultado.nome || "",
                        telefone: resultado.telefone || "",
                        email: email
                    }));

                    alert("Bem-vindo(a) de volta!");
                    window.location.href = "agendamento.html";
                } else {
                    alert(resultado.mensagem || "E-mail ou senha incorretos.");
                }
            } catch (error) {
                console.error("Erro no login:", error);
                alert("Erro de conexão com o servidor. Tente novamente.");
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = textoOriginal;
            }
        });
    }

    // ---------------------------------------------------------------------
    // 3. ACIONAR POPUP DO GOOGLE AO CLICAR NO BOTÃO PERSONALIZADO
    // ---------------------------------------------------------------------
    if (btnGoogleCustom) {
        btnGoogleCustom.addEventListener("click", function () {
            if (webhookNaoConfigurado(WEBHOOK_GOOGLE)) {
                alert("O login com o Google ainda não foi configurado.");
                return;
            }

            if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
                google.accounts.id.prompt(); // Abre o seletor de contas Google
            } else {
                alert("Serviço do Google ainda carregando ou Client ID não configurado.");
            }
        });
    }
});

// =========================================================================
// 4. CALLBACK OFICIAL DO GOOGLE (Recebe o token JWT após o usuário logar)
// =========================================================================
function decodificarJwtGoogle(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(atob(base64).split("").map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
    return JSON.parse(jsonPayload);
}

async function handleCredentialResponse(response) {
    try {
        const dadosGoogle = decodificarJwtGoogle(response.credential);

        const usuario = {
            acao: "login_google",
            nome: dadosGoogle.name,
            email: dadosGoogle.email,
            google_id: dadosGoogle.sub,
            foto: dadosGoogle.picture
        };

        // Envia para o Make registrar/atualizar o usuário na planilha
        const resMake = await fetch(WEBHOOK_GOOGLE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario)
        });

        const resultado = await resMake.json().catch(() => ({}));

        if (!resMake.ok || resultado.ok === false) {
            alert(resultado.mensagem || "Não foi possível concluir o login com o Google.");
            return;
        }

        localStorage.setItem("usuarioCorteAqui", JSON.stringify({
            nome: dadosGoogle.name,
            telefone: resultado.telefone || "",
            email: dadosGoogle.email
        }));

        alert("Conectado como " + dadosGoogle.name + "!");
        window.location.href = "agendamento.html";
    } catch (error) {
        console.error("Erro na autenticação com o Google:", error);
        alert("Falha ao concluir o login com o Google.");
    }
}