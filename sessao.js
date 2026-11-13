// =========================================================================
// SESSÃO DO USUÁRIO (Corte Aqui)
// - Troca "Entrar / Criar conta" por um ícone com a inicial do nome
// - Só deixa agendar quem está logado
// - Preenche nome e telefone no formulário de agendamento
// O login grava "usuarioCorteAqui" no navegador (feito pelo auth.js).
// =========================================================================
(function () {
    const CHAVE = "usuarioCorteAqui";

    function lerUsuario() {
        try {
            const u = JSON.parse(localStorage.getItem(CHAVE) || "null");
            return u && u.email ? u : null;
        } catch (e) {
            return null;
        }
    }

    function sair() {
        try { localStorage.removeItem(CHAVE); } catch (e) { /* ignora */ }
        window.location.href = "index.html";
    }

    function inicialDe(usuario) {
        const base = (usuario.nome || usuario.email || "?").trim();
        return base.charAt(0).toUpperCase();
    }

    function primeiroNome(usuario) {
        const nome = (usuario.nome || "").trim();
        return nome ? nome.split(/\s+/)[0] : usuario.email;
    }

    // ---------- Estilos ----------
    function injetarEstilos() {
        const css = `
        .perfil { position: relative; }
        .perfil-botao {
            width: 46px; height: 46px; border-radius: 50%;
            border: 2px solid #FFFFFF; background: #FFFFFF; color: var(--roxo, #791194);
            font: 700 1.2rem system-ui, sans-serif; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s, background-color 0.2s;
        }
        .perfil-botao:hover { transform: translateY(-2px); background: #F3E6F7; }
        .perfil-botao:focus-visible { outline: 3px solid #FFFFFF; outline-offset: 3px; }
        .perfil-menu {
            position: absolute; right: 0; top: calc(100% + 10px); z-index: 50;
            min-width: 220px; padding: 14px; background: #FFFFFF; color: #2C333F;
            border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }
        .perfil-menu[hidden] { display: none; }
        .perfil-menu strong { display: block; font-size: 1rem; }
        .perfil-menu span { display: block; margin: 2px 0 12px; font-size: 0.85rem; color: #5b6472; word-break: break-all; }
        .perfil-menu a, .perfil-menu button {
            display: block; width: 100%; padding: 9px 12px; margin-top: 6px; box-sizing: border-box;
            border: 2px solid var(--roxo, #791194); border-radius: 8px; background: #FFFFFF;
            color: var(--roxo, #791194); font: 600 0.9rem system-ui, sans-serif; text-align: center;
            text-decoration: none; cursor: pointer;
        }
        .perfil-menu a:hover, .perfil-menu button:hover { background: #F3E6F7; }
        .cabecalho .perfil-menu a { color: var(--roxo, #791194); }

        .aviso-login {
            margin: 0 0 20px; padding: 18px 20px; border: 2px solid var(--amarelo, #FDB71D);
            border-radius: 12px; background: #FFF8E6; color: #2C333F;
        }
        .aviso-login p { margin: 0 0 12px; font-weight: 600; }
        .aviso-login a {
            display: inline-block; margin-right: 8px; padding: 9px 20px; border-radius: 10px;
            border: 2px solid var(--roxo, #791194); color: var(--roxo, #791194);
            font-weight: 600; text-decoration: none;
        }
        .aviso-login a.principal { background: var(--roxo, #791194); color: #FFFFFF; }
        .formulario.bloqueado { opacity: 0.55; pointer-events: none; }
        .logado-como { margin: 0 0 16px; font-size: 0.95rem; color: #2C333F; }
        `;
        const estilo = document.createElement("style");
        estilo.textContent = css;
        document.head.appendChild(estilo);
    }

    // ---------- Cabeçalho ----------
    function montarCabecalho(usuario) {
        const area = document.querySelector(".cabecalho .botao");
        if (!area) return;

        area.innerHTML = "";

        const perfil = document.createElement("div");
        perfil.className = "perfil";

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "perfil-botao";
        botao.textContent = inicialDe(usuario);
        botao.setAttribute("aria-haspopup", "true");
        botao.setAttribute("aria-expanded", "false");
        botao.setAttribute("aria-label", "Menu da conta de " + primeiroNome(usuario));

        const menu = document.createElement("div");
        menu.className = "perfil-menu";
        menu.hidden = true;

        const nome = document.createElement("strong");
        nome.textContent = usuario.nome || "Minha conta";
        const email = document.createElement("span");
        email.textContent = usuario.email;

        const linkAgendar = document.createElement("a");
        linkAgendar.href = "agendamento.html";
        linkAgendar.textContent = "Agendar horário";

        const btnSair = document.createElement("button");
        btnSair.type = "button";
        btnSair.textContent = "Sair";
        btnSair.addEventListener("click", sair);

        menu.append(nome, email, linkAgendar, btnSair);
        perfil.append(botao, menu);
        area.appendChild(perfil);

        function fechar() {
            menu.hidden = true;
            botao.setAttribute("aria-expanded", "false");
        }

        botao.addEventListener("click", function (e) {
            e.stopPropagation();
            const abrir = menu.hidden;
            menu.hidden = !abrir;
            botao.setAttribute("aria-expanded", String(abrir));
        });

        document.addEventListener("click", function (e) {
            if (!perfil.contains(e.target)) fechar();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") { fechar(); botao.focus(); }
        });
    }

    // ---------- Formulário de agendamento ----------
    function protegerFormulario(usuario) {
        const form = document.getElementById("formAgendamento");
        if (!form) return;

        if (!usuario) {
            // Bloqueia o formulário e mostra o aviso
            form.classList.add("bloqueado");
            form.querySelectorAll("input, select, button, textarea").forEach(function (el) {
                el.disabled = true;
            });

            const aviso = document.createElement("div");
            aviso.className = "aviso-login";
            aviso.innerHTML =
                "<p>Para agendar pelo site, entre na sua conta.</p>" +
                '<a class="principal" href="entrar.html">Entrar</a>' +
                '<a href="Cadastrar.html">Criar conta</a>';
            form.parentNode.insertBefore(aviso, form);

            // Segurança extra: nada é enviado sem login
            form.addEventListener("submit", function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                alert("Entre na sua conta para agendar.");
            }, true);
            return;
        }

        // Logado: confere de novo na hora de enviar e preenche os dados
        form.addEventListener("submit", function (e) {
            if (!lerUsuario()) {
                e.preventDefault();
                e.stopImmediatePropagation();
                alert("Sua sessão expirou. Entre na sua conta novamente.");
                window.location.href = "entrar.html";
            }
        }, true);

        const info = document.createElement("p");
        info.className = "logado-como";
        info.textContent = "Agendando como " + (usuario.nome || usuario.email) + ".";
        const titulo = form.querySelector("h2");
        if (titulo) titulo.insertAdjacentElement("afterend", info);

        function preencher() {
            const campoNome = document.getElementById("nome");
            const campoTel = document.getElementById("telefone");
            if (campoNome && !campoNome.value) campoNome.value = usuario.nome || "";
            if (campoTel && !campoTel.value) campoTel.value = usuario.telefone || "";
        }
        preencher();

        // Depois de agendar, o formulário é limpo; preenche de novo
        form.addEventListener("reset", function () { setTimeout(preencher, 0); });
    }

    // ---------- Início ----------
    document.addEventListener("DOMContentLoaded", function () {
        const usuario = lerUsuario();
        const pagina = window.location.pathname.toLowerCase();

        // Quem já está logado não precisa ver as telas de entrar/cadastrar
        if (usuario && (pagina.endsWith("entrar.html") || pagina.endsWith("cadastrar.html"))) {
            window.location.replace("agendamento.html");
            return;
        }

        injetarEstilos();
        if (usuario) montarCabecalho(usuario);
        protegerFormulario(usuario);
    });
})();