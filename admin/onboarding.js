(function () {
    "use strict";

    const blocoLogin =
        document.querySelector("#bloco-login-admin");

    const blocoCadastro =
        document.querySelector("#bloco-cadastro-admin");

    const blocoOnboarding =
        document.querySelector("#bloco-onboarding-admin");

    const formCadastro =
        document.querySelector("#form-cadastro-admin");

    const formOnboarding =
        document.querySelector("#form-onboarding-admin");

    const botaoAbrirCadastro =
        document.querySelector("#botao-abrir-cadastro");

    const botaoVoltarLogin =
        document.querySelector("#botao-voltar-login");

    const botaoSairOnboarding =
        document.querySelector("#botao-sair-onboarding");

    const mensagemCadastro =
        document.querySelector("#mensagem-cadastro");

    const mensagemOnboarding =
        document.querySelector("#mensagem-onboarding");

    const inputSlug =
        document.querySelector("#onboarding-slug");

    const inputNomeBarbearia =
        document.querySelector("#onboarding-barbearia");

    const inputTelefone =
        document.querySelector("#onboarding-telefone");

    const previewLink =
        document.querySelector("#preview-link-onboarding");


    function mostrarBloco(nome) {

        if (blocoLogin) {
            blocoLogin.style.display =
                nome === "login" ? "" : "none";
        }

        if (blocoCadastro) {
            blocoCadastro.style.display =
                nome === "cadastro" ? "" : "none";
        }

        if (blocoOnboarding) {
            blocoOnboarding.style.display =
                nome === "onboarding" ? "" : "none";
        }
    }


    function definirMensagem(elemento, texto, erro = false) {

        if (!elemento) return;

        elemento.textContent = texto || "";

        elemento.style.color =
            erro ? "#d9534f" : "";
    }


    function normalizarSlug(valor) {

        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .replace(/-{2,}/g, "-");
    }


    function mascararTelefone(valor) {

        const numeros =
            String(valor || "")
                .replace(/\D/g, "")
                .slice(0, 11);

        if (numeros.length <= 2) {
            return numeros;
        }

        if (numeros.length <= 6) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        }

        if (numeros.length <= 10) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
        }

        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }


    function atualizarPreviewSlug() {

        if (!inputSlug || !previewLink) {
            return;
        }

        const slug =
            normalizarSlug(inputSlug.value);

        inputSlug.value = slug;

        previewLink.textContent =
            `?barbearia=${slug || "sua-barbearia"}`;
    }


    async function usuarioJaTemBarbearia(userId) {

        const { data, error } =
            await supabaseV2
                .from("usuarios_barbearias")
                .select("id")
                .eq("user_id", userId)
                .eq("ativo", true)
                .limit(1)
                .maybeSingle();

        if (error) {
            throw error;
        }

        return Boolean(data);
    }


    async function verificarOnboardingPendente() {

        const {
            data: { session },
            error
        } =
            await supabaseV2.auth.getSession();

        if (error) {
            return;
        }

        if (!session?.user) {
            return;
        }

        try {

            const possuiBarbearia =
                await usuarioJaTemBarbearia(
                    session.user.id
                );

            if (!possuiBarbearia) {

                const loginAdmin =
                    document.querySelector(
                        "#login-admin"
                    );

                const painelAdmin =
                    document.querySelector(
                        "#painel-admin"
                    );

                if (painelAdmin) {
                    painelAdmin.style.display = "none";
                }

                if (loginAdmin) {
                    loginAdmin.style.display = "";
                }

                mostrarBloco("onboarding");
            }

        } catch (erroVerificacao) {

            console.error(
                "Erro ao verificar onboarding:",
                erroVerificacao
            );
        }
    }


    if (botaoAbrirCadastro) {

        botaoAbrirCadastro.addEventListener(
            "click",
            function () {

                definirMensagem(
                    mensagemCadastro,
                    ""
                );

                mostrarBloco("cadastro");
            }
        );
    }


    if (botaoVoltarLogin) {

        botaoVoltarLogin.addEventListener(
            "click",
            function () {

                definirMensagem(
                    mensagemCadastro,
                    ""
                );

                mostrarBloco("login");
            }
        );
    }


    if (inputNomeBarbearia) {

        inputNomeBarbearia.addEventListener(
            "input",
            function () {

                if (
                    inputSlug &&
                    !inputSlug.dataset.editadoManualmente
                ) {

                    inputSlug.value =
                        normalizarSlug(
                            inputNomeBarbearia.value
                        );

                    atualizarPreviewSlug();
                }
            }
        );
    }


    if (inputSlug) {

        inputSlug.addEventListener(
            "input",
            function () {

                inputSlug.dataset.editadoManualmente =
                    "true";

                atualizarPreviewSlug();
            }
        );
    }


    if (inputTelefone) {

        inputTelefone.addEventListener(
            "input",
            function () {

                inputTelefone.value =
                    mascararTelefone(
                        inputTelefone.value
                    );
            }
        );
    }


    if (formCadastro) {

        formCadastro.addEventListener(
            "submit",
            async function (evento) {

                evento.preventDefault();

                const email =
                    document
                        .querySelector("#cadastro-email")
                        ?.value
                        .trim();

                const senha =
                    document
                        .querySelector("#cadastro-senha")
                        ?.value || "";

                const confirmarSenha =
                    document
                        .querySelector(
                            "#cadastro-confirmar-senha"
                        )
                        ?.value || "";

                const botao =
                    document.querySelector(
                        "#botao-cadastrar"
                    );


                definirMensagem(
                    mensagemCadastro,
                    ""
                );


                if (senha !== confirmarSenha) {

                    definirMensagem(
                        mensagemCadastro,
                        "As senhas não são iguais.",
                        true
                    );

                    return;
                }


                if (senha.length < 6) {

                    definirMensagem(
                        mensagemCadastro,
                        "A senha precisa ter pelo menos 6 caracteres.",
                        true
                    );

                    return;
                }


                if (botao) {
                    botao.disabled = true;
                    botao.textContent =
                        "Criando conta...";
                }


                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseV2.auth.signUp({
                            email,
                            password: senha
                        });


                    if (error) {
                        throw error;
                    }


                    if (!data.session) {

                        definirMensagem(
                            mensagemCadastro,
                            "Conta criada. Confirme seu e-mail e depois entre normalmente."
                        );

                        return;
                    }


                    mostrarBloco("onboarding");


                } catch (erroCadastro) {

                    console.error(
                        "Erro ao criar conta:",
                        erroCadastro
                    );

                    definirMensagem(
                        mensagemCadastro,
                        erroCadastro?.message ||
                        "Não foi possível criar sua conta.",
                        true
                    );

                } finally {

                    if (botao) {
                        botao.disabled = false;
                        botao.textContent =
                            "Criar conta";
                    }
                }
            }
        );
    }


    if (formOnboarding) {

        formOnboarding.addEventListener(
            "submit",
            async function (evento) {

                evento.preventDefault();

                const nomeBarbearia =
                    inputNomeBarbearia?.value.trim();

                const nomeProfissional =
                    document
                        .querySelector(
                            "#onboarding-profissional"
                        )
                        ?.value
                        .trim();

                const telefone =
                    String(
                        inputTelefone?.value || ""
                    )
                        .replace(/\D/g, "");

                const slug =
                    normalizarSlug(
                        inputSlug?.value
                    );

                const botao =
                    document.querySelector(
                        "#botao-finalizar-onboarding"
                    );


                definirMensagem(
                    mensagemOnboarding,
                    ""
                );


                if (!nomeBarbearia) {

                    definirMensagem(
                        mensagemOnboarding,
                        "Informe o nome da barbearia.",
                        true
                    );

                    return;
                }


                if (!nomeProfissional) {

                    definirMensagem(
                        mensagemOnboarding,
                        "Informe seu nome.",
                        true
                    );

                    return;
                }


                if (slug.length < 3) {

                    definirMensagem(
                        mensagemOnboarding,
                        "O link precisa ter pelo menos 3 caracteres.",
                        true
                    );

                    return;
                }


                if (botao) {
                    botao.disabled = true;
                    botao.textContent =
                        "Criando barbearia...";
                }


                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseV2.rpc(
                            "criar_barbearia_onboarding",
                            {
                                p_nome_barbearia:
                                    nomeBarbearia,

                                p_slug:
                                    slug,

                                p_telefone:
                                    telefone || null,

                                p_nome_profissional:
                                    nomeProfissional,

                                p_timezone:
                                    "America/Sao_Paulo"
                            }
                        );


                    if (error) {
                        throw error;
                    }


                    if (
                        window.contextoSaaS?.limpar
                    ) {
                        window.contextoSaaS.limpar();
                    }


                    definirMensagem(
                        mensagemOnboarding,
                        "Barbearia criada com sucesso."
                    );


                    document.dispatchEvent(
                        new CustomEvent(
                            "onboarding:concluido",
                            {
                                detail: data
                            }
                        )
                    );


                    window.location.reload();


                } catch (erroOnboarding) {

                    console.error(
                        "Erro no onboarding:",
                        erroOnboarding
                    );

                    definirMensagem(
                        mensagemOnboarding,
                        erroOnboarding?.message ||
                        "Não foi possível criar a barbearia.",
                        true
                    );

                } finally {

                    if (botao) {
                        botao.disabled = false;
                        botao.textContent =
                            "Criar minha barbearia";
                    }
                }
            }
        );
    }


    if (botaoSairOnboarding) {

        botaoSairOnboarding.addEventListener(
            "click",
            async function () {

                await supabaseV2.auth.signOut();

                if (
                    window.contextoSaaS?.limpar
                ) {
                    window.contextoSaaS.limpar();
                }

                mostrarBloco("login");
            }
        );
    }


    document.addEventListener(
        "DOMContentLoaded",
        verificarOnboardingPendente
    );


    window.adminOnboarding = {
        mostrarLogin() {
            mostrarBloco("login");
        },

        mostrarCadastro() {
            mostrarBloco("cadastro");
        },

        mostrarOnboarding() {
            mostrarBloco("onboarding");
        },

        verificar:
            verificarOnboardingPendente
    };

})();
