(function () {
    "use strict";

    const inputLink =
        document.querySelector("#link-publico-barbearia");

    const botaoCopiar =
        document.querySelector("#botao-copiar-link-publico");

    const mensagem =
        document.querySelector("#mensagem-link-publico");


    function obterContexto() {

        return (
            window.contextoSaaS?.obter?.() ||
            window.adminApp?.obterContexto?.() ||
            null
        );
    }


    function obterBarbearia() {

        const contexto =
            obterContexto();

        if (!contexto) {
            return null;
        }

        return (
            contexto.barbearia ||
            contexto.barbershop ||
            contexto
        );
    }


    function montarLinkPublico(slug) {

        const url =
            new URL(
                "../index.html",
                window.location.href
            );

        url.searchParams.set(
            "barbearia",
            slug
        );

        return url.toString();
    }


    function renderizarLinkPublico() {

        if (!inputLink) {
            return;
        }

        const barbearia =
            obterBarbearia();

        const slug =
            String(
                barbearia?.slug || ""
            ).trim();


        if (!slug) {

            inputLink.value =
                "Link indisponível";

            if (botaoCopiar) {
                botaoCopiar.disabled = true;
            }

            if (mensagem) {
                mensagem.textContent =
                    "A barbearia ainda não possui um link público configurado.";
            }

            return;
        }


        inputLink.value =
            montarLinkPublico(slug);

        if (botaoCopiar) {
            botaoCopiar.disabled = false;
        }

        if (mensagem) {
            mensagem.textContent =
                `Identificador público: ${slug}`;
        }
    }


    async function copiarTexto(texto) {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                texto
            );

            return;
        }


        const area =
            document.createElement("textarea");

        area.value = texto;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";

        document.body.appendChild(area);

        area.select();

        const copiou =
            document.execCommand("copy");

        document.body.removeChild(area);

        if (!copiou) {
            throw new Error(
                "Não foi possível copiar o link."
            );
        }
    }


    async function copiarLink() {

        const link =
            inputLink?.value?.trim();

        if (
            !link ||
            link === "Carregando..." ||
            link === "Link indisponível"
        ) {
            return;
        }


        if (botaoCopiar) {
            botaoCopiar.disabled = true;
            botaoCopiar.textContent =
                "Copiando...";
        }


        try {

            await copiarTexto(link);

            if (mensagem) {
                mensagem.textContent =
                    "Link copiado. Agora é só enviar para seus clientes.";
            }


        } catch (erro) {

            console.error(
                "Erro ao copiar link público:",
                erro
            );

            if (mensagem) {
                mensagem.textContent =
                    "Não foi possível copiar automaticamente. Selecione o link acima e copie.";
            }


        } finally {

            if (botaoCopiar) {

                botaoCopiar.disabled = false;
                botaoCopiar.textContent =
                    "Copiar link";
            }
        }
    }


    if (botaoCopiar) {

        botaoCopiar.addEventListener(
            "click",
            copiarLink
        );
    }


    document.addEventListener(
        "admin:autenticado",
        renderizarLinkPublico
    );


    document.addEventListener(
        "admin:pagina-aberta",
        function (evento) {

            if (
                evento.detail?.pagina ===
                "visao-geral"
            ) {
                renderizarLinkPublico();
            }
        }
    );


    document.addEventListener(
        "onboarding:concluido",
        renderizarLinkPublico
    );


    window.adminLinkPublico = {
        renderizar:
            renderizarLinkPublico,

        obterLink: function () {

            const barbearia =
                obterBarbearia();

            const slug =
                String(
                    barbearia?.slug || ""
                ).trim();

            return slug
                ? montarLinkPublico(slug)
                : null;
        }
    };

})();
