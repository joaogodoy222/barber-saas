document.addEventListener(
    "DOMContentLoaded",
    function () {

        const itensMenu =
            document.querySelectorAll(
                ".admin-menu-item"
            );

        const paginas =
            document.querySelectorAll(
                ".pagina-admin"
            );


        function abrirPagina(nomePagina) {

            paginas.forEach(
                function (pagina) {

                    pagina.classList.remove(
                        "ativa"
                    );

                    pagina.style.display =
                        "none";

                }
            );


            itensMenu.forEach(
                function (item) {

                    item.classList.remove(
                        "ativo"
                    );

                }
            );


            const paginaSelecionada =
                document.querySelector(
                    `#pagina-${nomePagina}`
                );


            const botaoSelecionado =
                document.querySelector(
                    `.admin-menu-item[data-pagina="${nomePagina}"]`
                );


            if (paginaSelecionada) {

                paginaSelecionada.style.display =
                    "block";

                paginaSelecionada.classList.add(
                    "ativa"
                );

            }


            if (botaoSelecionado) {

                botaoSelecionado.classList.add(
                    "ativo"
                );

            }

        }


        itensMenu.forEach(
            function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        abrirPagina(
                            item.dataset.pagina
                        );

                    }
                );

            }
        );


        // Página inicial
        abrirPagina("visao-geral");

    }
);