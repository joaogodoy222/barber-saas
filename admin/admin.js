document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTOS PRINCIPAIS
    // =====================================================

    const loginAdmin =
        document.querySelector("#login-admin");

    const painelAdmin =
        document.querySelector("#painel-admin");

    const formLogin =
        document.querySelector("#form-login-admin");

    const emailAdmin =
        document.querySelector("#email-admin");

    const senhaAdmin =
        document.querySelector("#senha-admin");

    const botaoLogin =
        document.querySelector("#botao-login");

    const mensagemLogin =
        document.querySelector("#mensagem-login");

    const botaoSair =
        document.querySelector("#botao-sair-admin");

    const itensMenu =
        document.querySelectorAll(".admin-menu-item");

    const paginas =
        document.querySelectorAll(".pagina-admin");

    const atalhosPagina =
        document.querySelectorAll("[data-atalho-pagina]");


    // =====================================================
    // ESTADO
    // =====================================================

    let usuarioAtual = null;
    let inicializando = false;


    // =====================================================
    // AUXILIARES
    // =====================================================

    function mostrarMensagemLogin(
        mensagem = "",
        tipo = ""
    ) {

        if (!mensagemLogin) {
            return;
        }

        mensagemLogin.textContent = mensagem;

        mensagemLogin.classList.remove(
            "erro",
            "sucesso"
        );

        if (tipo) {
            mensagemLogin.classList.add(tipo);
        }
    }


    function gerarIniciais(nome) {

        const partes =
            String(nome || "")
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        if (!partes.length) {
            return "B";
        }

        if (partes.length === 1) {
            return partes[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            partes[0][0] +
            partes[partes.length - 1][0]
        ).toUpperCase();
    }


    function mostrarSomenteBlocoLogin() {

        if (window.adminOnboarding?.mostrarLogin) {
            window.adminOnboarding.mostrarLogin();
        }
    }


    function mostrarOnboarding() {

        usuarioAtual =
            usuarioAtual || null;

        if (painelAdmin) {
            painelAdmin.style.display = "none";
        }

        if (loginAdmin) {
            loginAdmin.style.display = "flex";
        }

        if (window.adminOnboarding?.mostrarOnboarding) {
            window.adminOnboarding.mostrarOnboarding();
        }
    }


    function mostrarLogin() {

        usuarioAtual = null;

        if (painelAdmin) {
            painelAdmin.style.display = "none";
        }

        if (loginAdmin) {
            loginAdmin.style.display = "flex";
        }

        mostrarSomenteBlocoLogin();
    }


    async function usuarioPossuiBarbearia(userId) {

        const {
            data,
            error
        } =
            await supabaseV2
                .from("usuarios_barbearias")
                .select(`
                    id,
                    barbearia_id,
                    papel,
                    ativo
                `)
                .eq("user_id", userId)
                .eq("ativo", true)
                .limit(1)
                .maybeSingle();

        if (error) {
            throw error;
        }

        return Boolean(data?.barbearia_id);
    }


    function obterBarbeariaDoContexto() {

        const contexto =
            window.contextoSaaS?.obter?.() || null;

        if (!contexto) {
            return null;
        }

        return (
            contexto.barbearia ||
            contexto.barbershop ||
            contexto
        );
    }


    function aplicarIdentidadeBarbearia() {

        const barbearia =
            obterBarbeariaDoContexto();

        const nome =
            barbearia?.nome ||
            "Barbearia";

        const iniciais =
            gerarIniciais(nome);

        const titulo =
            document.querySelector(
                "#titulo-admin"
            );

        const simbolo =
            document.querySelector(
                "#sidebar-logo-simbolo"
            );

        const nomeSidebar =
            document.querySelector(
                "#sidebar-barbearia-nome"
            );

        if (titulo) {
            titulo.textContent =
                `Painel Administrativo | ${nome}`;
        }

        document.title =
            `Painel Administrativo | ${nome}`;

        if (simbolo) {
            simbolo.textContent = iniciais;
        }

        if (nomeSidebar) {
            nomeSidebar.textContent = nome;
        }
    }


    // =====================================================
    // MOSTRAR PAINEL
    // =====================================================

    async function mostrarPainel(session) {

        usuarioAtual =
            session?.user || null;

        if (!usuarioAtual) {
            mostrarLogin();
            return false;
        }

        try {

            await window.contextoSaaS.carregar();

        } catch (erro) {

            console.error(
                "Erro ao carregar contexto da barbearia:",
                erro
            );

            if (painelAdmin) {
                painelAdmin.style.display = "none";
            }

            if (loginAdmin) {
                loginAdmin.style.display = "flex";
            }

            mostrarMensagemLogin(
                erro?.message ||
                "Não foi possível carregar os dados da barbearia.",
                "erro"
            );

            return false;
        }

        aplicarIdentidadeBarbearia();

        if (loginAdmin) {
            loginAdmin.style.display = "none";
        }

        if (painelAdmin) {
            painelAdmin.style.display = "grid";
        }

        return true;
    }


    // =====================================================
    // NAVEGAÇÃO
    // =====================================================

    function abrirPagina(nomePagina) {

        paginas.forEach(function (pagina) {

            pagina.classList.remove("ativa");
            pagina.style.display = "none";
        });


        itensMenu.forEach(function (item) {

            item.classList.remove("ativo");
        });


        const paginaSelecionada =
            document.querySelector(
                `#pagina-${nomePagina}`
            );

        const menuSelecionado =
            document.querySelector(
                `.admin-menu-item[data-pagina="${nomePagina}"]`
            );


        if (!paginaSelecionada) {

            console.warn(
                `Página administrativa não encontrada: ${nomePagina}`
            );

            return;
        }


        paginaSelecionada.style.display =
            "block";

        paginaSelecionada.classList.add(
            "ativa"
        );


        if (menuSelecionado) {
            menuSelecionado.classList.add(
                "ativo"
            );
        }


        document.dispatchEvent(
            new CustomEvent(
                "admin:pagina-aberta",
                {
                    detail: {
                        pagina: nomePagina
                    }
                }
            )
        );
    }


    // =====================================================
    // ENTRADA DE USUÁRIO AUTENTICADO
    // =====================================================

    async function processarUsuarioAutenticado(
        session,
        emitirEvento = true
    ) {

        if (!session?.user) {
            mostrarLogin();
            return false;
        }

        usuarioAtual =
            session.user;

        let possuiBarbearia = false;

        try {

            possuiBarbearia =
                await usuarioPossuiBarbearia(
                    session.user.id
                );

        } catch (erro) {

            console.error(
                "Erro ao verificar vínculo da barbearia:",
                erro
            );

            mostrarLogin();

            mostrarMensagemLogin(
                "Não foi possível verificar sua barbearia.",
                "erro"
            );

            return false;
        }


        // Usuário já criou a conta, mas ainda não concluiu
        // a configuração inicial da barbearia.
        if (!possuiBarbearia) {

            if (window.contextoSaaS?.limpar) {
                window.contextoSaaS.limpar();
            }

            mostrarOnboarding();

            return false;
        }


        const painelCarregado =
            await mostrarPainel(session);

        if (!painelCarregado) {
            return false;
        }


        abrirPagina(
            "visao-geral"
        );


        if (emitirEvento) {

            document.dispatchEvent(
                new CustomEvent(
                    "admin:autenticado",
                    {
                        detail: {
                            session: session,
                            contexto:
                                window.contextoSaaS?.obter?.() ||
                                null
                        }
                    }
                )
            );
        }

        return true;
    }


    // =====================================================
    // CLIQUES DO MENU
    // =====================================================

    itensMenu.forEach(function (item) {

        item.addEventListener(
            "click",
            function () {

                const pagina =
                    item.dataset.pagina;

                if (!pagina) {
                    return;
                }

                abrirPagina(pagina);
            }
        );
    });


    atalhosPagina.forEach(function (botao) {

        botao.addEventListener(
            "click",
            function () {

                const pagina =
                    botao.dataset.atalhoPagina;

                if (!pagina) {
                    return;
                }

                abrirPagina(pagina);
            }
        );
    });


    // =====================================================
    // LOGIN
    // =====================================================

    async function fazerLogin(event) {

        event.preventDefault();


        const email =
            emailAdmin?.value.trim();

        const senha =
            senhaAdmin?.value;


        if (!email || !senha) {

            mostrarMensagemLogin(
                "Preencha o e-mail e a senha.",
                "erro"
            );

            return;
        }


        if (botaoLogin) {
            botaoLogin.disabled = true;
            botaoLogin.textContent =
                "Entrando...";
        }

        mostrarMensagemLogin();


        try {

            const {
                data,
                error
            } =
                await supabaseV2.auth
                    .signInWithPassword({
                        email: email,
                        password: senha
                    });


            if (error) {

                console.error(
                    "Erro no login:",
                    error
                );

                mostrarMensagemLogin(
                    "E-mail ou senha inválidos.",
                    "erro"
                );

                return;
            }


            if (!data.session) {

                mostrarMensagemLogin(
                    "Não foi possível iniciar a sessão.",
                    "erro"
                );

                return;
            }


            await processarUsuarioAutenticado(
                data.session,
                true
            );


        } catch (erro) {

            console.error(
                "Erro inesperado no login:",
                erro
            );

            mostrarMensagemLogin(
                "Não foi possível entrar. Tente novamente.",
                "erro"
            );

        } finally {

            if (botaoLogin) {
                botaoLogin.disabled = false;
                botaoLogin.textContent =
                    "Entrar";
            }
        }
    }


    // =====================================================
    // LOGOUT
    // =====================================================

    async function fazerLogout() {

        if (botaoSair) {

            botaoSair.disabled = true;
            botaoSair.textContent =
                "Saindo...";
        }


        try {

            const {
                error
            } =
                await supabaseV2.auth.signOut();


            if (error) {
                throw error;
            }


            if (window.contextoSaaS?.limpar) {
                window.contextoSaaS.limpar();
            }


            if (formLogin) {
                formLogin.reset();
            }


            mostrarMensagemLogin();
            mostrarLogin();


        } catch (erro) {

            console.error(
                "Erro ao sair:",
                erro
            );

            alert(
                "Não foi possível sair da conta."
            );

        } finally {

            if (botaoSair) {
                botaoSair.disabled = false;
                botaoSair.textContent =
                    "Sair";
            }
        }
    }


    // =====================================================
    // VERIFICAR SESSÃO EXISTENTE
    // =====================================================

    async function verificarSessao() {

        if (inicializando) {
            return;
        }

        inicializando = true;


        try {

            const {
                data,
                error
            } =
                await supabaseV2.auth.getSession();


            if (error) {
                throw error;
            }


            if (!data.session) {

                mostrarLogin();
                return;
            }


            await processarUsuarioAutenticado(
                data.session,
                true
            );


        } catch (erro) {

            console.error(
                "Erro ao verificar sessão:",
                erro
            );

            mostrarLogin();

            mostrarMensagemLogin(
                "Não foi possível verificar sua sessão.",
                "erro"
            );

        } finally {

            inicializando = false;
        }
    }


    // =====================================================
    // EVENTOS DE AUTENTICAÇÃO
    // =====================================================

    supabaseV2.auth.onAuthStateChange(
        function (evento, session) {

            if (
                evento === "SIGNED_OUT" ||
                !session
            ) {

                if (window.contextoSaaS?.limpar) {
                    window.contextoSaaS.limpar();
                }

                mostrarLogin();
            }
        }
    );


    // =====================================================
    // ONBOARDING CONCLUÍDO
    // =====================================================

    document.addEventListener(
        "onboarding:concluido",
        function () {

            if (window.contextoSaaS?.limpar) {
                window.contextoSaaS.limpar();
            }
        }
    );


    // =====================================================
    // EVENTOS
    // =====================================================

    if (formLogin) {

        formLogin.addEventListener(
            "submit",
            fazerLogin
        );
    }


    if (botaoSair) {

        botaoSair.addEventListener(
            "click",
            fazerLogout
        );
    }


    // =====================================================
    // API INTERNA DO ADMIN
    // =====================================================

    window.adminApp = {

        abrirPagina: abrirPagina,

        obterUsuario: function () {
            return usuarioAtual;
        },

        obterContexto: function () {
            return (
                window.contextoSaaS?.obter?.() ||
                null
            );
        },

        obterBarbeariaId: function () {
            return (
                window.contextoSaaS
                    ?.obterBarbeariaId?.() ||
                null
            );
        },

        estaAutenticado: function () {
            return Boolean(usuarioAtual);
        },

        aplicarIdentidade:
            aplicarIdentidadeBarbearia,

        verificarSessao:
            verificarSessao
    };


    // =====================================================
    // INICIAR
    // =====================================================

    verificarSessao();

});
