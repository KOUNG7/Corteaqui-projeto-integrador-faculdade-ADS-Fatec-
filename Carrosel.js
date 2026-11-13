document.addEventListener("DOMContentLoaded", function () {
    const carrossel = document.querySelector(".carrossel");
    if (!carrossel) return;

    const pista = carrossel.querySelector(".carrossel-pista");
    const slides = Array.from(pista.children);
    const areaPontos = carrossel.querySelector(".carrossel-pontos");
    const btnAnterior = carrossel.querySelector(".carrossel-seta-anterior");
    const btnProximo = carrossel.querySelector(".carrossel-seta-proximo");

    const INTERVALO = 7000; // tempo entre as trocas automáticas (ms)
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let indice = 0;
    let timer = null;
    let emInteracao = false; // mouse em cima, foco do teclado ou dedo na tela

    // ---------- Bolinhas ----------
    const pontos = slides.map((_, i) => {
        const ponto = document.createElement("button");
        ponto.type = "button";
        ponto.className = "ponto";
        ponto.setAttribute("aria-label", "Ir para o serviço " + (i + 1) + " de " + slides.length);
        ponto.addEventListener("click", () => {
            mostrar(i);
            reiniciarAutoplay();
        });
        areaPontos.appendChild(ponto);
        return ponto;
    });

    // ---------- Mostrar um slide ----------
    function mostrar(i) {
        indice = (i + slides.length) % slides.length;
        pista.style.transform = "translateX(-" + (indice * 100) + "%)";

        slides.forEach((slide, k) => {
            const escondido = k !== indice;
            slide.inert = escondido; // links dos slides escondidos não recebem foco
            slide.setAttribute("aria-hidden", String(escondido));
        });

        pontos.forEach((ponto, k) => {
            const ativo = k === indice;
            ponto.classList.toggle("ativo", ativo);
            if (ativo) {
                ponto.setAttribute("aria-current", "true");
            } else {
                ponto.removeAttribute("aria-current");
            }
        });
    }

    // ---------- Setas ----------
    btnAnterior.addEventListener("click", () => {
        mostrar(indice - 1);
        reiniciarAutoplay();
    });

    btnProximo.addEventListener("click", () => {
        mostrar(indice + 1);
        reiniciarAutoplay();
    });

    // Teclado: setas esquerda e direita
    carrossel.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            mostrar(indice - 1);
            reiniciarAutoplay();
        } else if (e.key === "ArrowRight") {
            mostrar(indice + 1);
            reiniciarAutoplay();
        }
    });

    // ---------- Arrastar com o dedo (celular) ----------
    let inicioX = 0;
    let inicioY = 0;

    carrossel.addEventListener("touchstart", (e) => {
        inicioX = e.touches[0].clientX;
        inicioY = e.touches[0].clientY;
        emInteracao = true;
        reiniciarAutoplay();
    }, { passive: true });

    carrossel.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - inicioX;
        const dy = e.changedTouches[0].clientY - inicioY;

        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            mostrar(dx < 0 ? indice + 1 : indice - 1);
        }

        emInteracao = false;
        reiniciarAutoplay();
    }, { passive: true });

    // ---------- Troca automática ----------
    function reiniciarAutoplay() {
        clearInterval(timer);
        timer = null;

        const rodando = !reduzirMovimento && !emInteracao && !document.hidden;
        if (rodando) {
            timer = setInterval(() => mostrar(indice + 1), INTERVALO);
        }
    }

    // Para de trocar enquanto o mouse está em cima
    carrossel.addEventListener("mouseenter", () => {
        emInteracao = true;
        reiniciarAutoplay();
    });

    carrossel.addEventListener("mouseleave", () => {
        emInteracao = false;
        reiniciarAutoplay();
    });

    // Para de trocar quando o foco vem do teclado
    carrossel.addEventListener("focusin", (e) => {
        if (e.target.matches(":focus-visible")) {
            emInteracao = true;
            reiniciarAutoplay();
        }
    });

    carrossel.addEventListener("focusout", () => {
        emInteracao = false;
        reiniciarAutoplay();
    });

    document.addEventListener("visibilitychange", reiniciarAutoplay);

    // ---------- Início ----------
    mostrar(0);
    reiniciarAutoplay();
});