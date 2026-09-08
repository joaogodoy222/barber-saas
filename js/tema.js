const CHAVE_TEMA = "barberSaasTema";

function aplicarTema(tema) {
    const escuro = tema === "escuro";

    document.body.classList.toggle("tema-escuro", escuro);

    document.querySelectorAll(".botao-tema").forEach(function (botao) {
        botao.textContent = escuro ? "☀️" : "🌙";

        botao.setAttribute(
            "aria-label",
            escuro ? "Ativar modo claro" : "Ativar modo escuro"
        );
    });
}

function alternarTema() {
    const estaEscuro =
        document.body.classList.contains("tema-escuro");

    const novoTema = estaEscuro ? "claro" : "escuro";

    localStorage.setItem(CHAVE_TEMA, novoTema);

    aplicarTema(novoTema);
}

function iniciarTema() {
    const temaSalvo = localStorage.getItem(CHAVE_TEMA);

    const temaInicial =
        temaSalvo === "escuro" ? "escuro" : "claro";

    aplicarTema(temaInicial);

    document.querySelectorAll(".botao-tema").forEach(function (botao) {
        botao.addEventListener("click", alternarTema);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarTema);
} else {
    iniciarTema();
}