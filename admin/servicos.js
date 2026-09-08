(function () {

    "use strict";


    // =====================================================
    // CONFIGURAÇÃO
    // =====================================================

    function obterBarbeariaId() {

        const barbeariaId =
            window.contextoSaaS?.obterBarbeariaId();

        if (!barbeariaId) {

            throw new Error(
                "Barbearia não identificada no contexto SaaS."
            );

        }

        return barbeariaId;

    }


    // =====================================================
    // ESTADO
    // =====================================================

    let servicosCarregados = [];

    let eventosConfigurados = false;

    let carregandoServicos = false;

    let primeiraConfiguracao = false;


    // =====================================================
    // ELEMENTOS
    // =====================================================

    let listaServicosAdmin;

    let totalServicos;
    let totalServicosAtivos;
    let totalServicosOnline;

    let buscaServico;

    let modalServico;
    let botaoNovoServico;
    let fecharModalServico;
    let cancelarServico;

    let formServico;
    let tituloModalServico;

    let servicoId;
    let servicoNome;
    let servicoDescricao;
    let servicoPreco;
    let servicoDuracao;
    let servicoCategoria;
    let servicoAtivo;
    let servicoOnline;

    let botaoSalvarServico;
    let usoPlano = null;


    // =====================================================
    // PLANO / LIMITES
    // =====================================================
    function mensagemLimitePlano(erro) {
        const mensagem = String(erro?.message || erro?.details || "");
        if (!mensagem.includes("LIMITE_PLANO_SERVICOS")) return null;
        return mensagem.replace("LIMITE_PLANO_SERVICOS:", "").trim();
    }

    async function carregarUsoPlano() {
        const { data, error } = await supabaseV2.rpc("obter_uso_plano", {
            p_barbearia_id: obterBarbeariaId()
        });
        if (error) throw error;
        usoPlano = data || null;
        atualizarInterfacePlano();
        return usoPlano;
    }

    function limitePlanoAtingido() {
        const usados = Number(usoPlano?.servicos?.usados ?? 0);
        const limite = usoPlano?.servicos?.limite;
        return limite != null && usados >= Number(limite);
    }

    function atualizarInterfacePlano() {
        if (!botaoNovoServico || !usoPlano) return;

        let aviso = document.querySelector("#aviso-plano-servicos");
        if (!aviso) {
            aviso = document.createElement("p");
            aviso.id = "aviso-plano-servicos";
            aviso.className = "texto-secundario-admin";
            aviso.style.marginTop = "8px";
            botaoNovoServico.insertAdjacentElement("afterend", aviso);
        }

        const usados = Number(usoPlano.servicos?.usados ?? 0);
        const limite = usoPlano.servicos?.limite;
        const plano = usoPlano.plano?.nome || "Plano atual";

        if (limite == null) {
            botaoNovoServico.disabled = false;
            aviso.textContent = `${usados} serviço(s) ativo(s) · ${plano} sem limite`;
            return;
        }

        const atingido = usados >= Number(limite);
        botaoNovoServico.disabled = atingido;
        botaoNovoServico.title = atingido
            ? `Limite de ${limite} serviço(s) atingido no plano ${plano}.`
            : "";
        aviso.textContent = atingido
            ? `${usados} de ${limite} serviço(s) utilizados · limite do ${plano} atingido`
            : `${usados} de ${limite} serviço(s) utilizados · ${plano}`;
    }


    // =====================================================
    // BUSCAR ELEMENTOS
    // =====================================================

    function buscarElementos() {

        listaServicosAdmin =
            document.querySelector(
                "#lista-servicos-admin"
            );

        totalServicos =
            document.querySelector(
                "#total-servicos"
            );

        totalServicosAtivos =
            document.querySelector(
                "#total-servicos-ativos"
            );

        totalServicosOnline =
            document.querySelector(
                "#total-servicos-online"
            );

        buscaServico =
            document.querySelector(
                "#busca-servico"
            );


        modalServico =
            document.querySelector(
                "#modal-servico"
            );

        botaoNovoServico =
            document.querySelector(
                "#botao-novo-servico"
            );

        fecharModalServico =
            document.querySelector(
                "#fechar-modal-servico"
            );

        cancelarServico =
            document.querySelector(
                "#cancelar-servico"
            );


        formServico =
            document.querySelector(
                "#form-servico"
            );

        tituloModalServico =
            document.querySelector(
                "#titulo-modal-servico"
            );


        servicoId =
            document.querySelector(
                "#servico-id"
            );

        servicoNome =
            document.querySelector(
                "#servico-nome"
            );

        servicoDescricao =
            document.querySelector(
                "#servico-descricao"
            );

        servicoPreco =
            document.querySelector(
                "#servico-preco"
            );

        servicoDuracao =
            document.querySelector(
                "#servico-duracao"
            );

        servicoCategoria =
            document.querySelector(
                "#servico-categoria"
            );

        servicoAtivo =
            document.querySelector(
                "#servico-ativo"
            );

        servicoOnline =
            document.querySelector(
                "#servico-online"
            );


        botaoSalvarServico =
            document.querySelector(
                "#salvar-servico"
            );

    }


    // =====================================================
    // FORMATADOR
    // =====================================================

    function formatarPrecoServico(
        valor
    ) {

        return Number(
            valor || 0
        ).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

    }


    // =====================================================
    // CARREGAR SERVIÇOS
    // =====================================================

    async function carregarServicos() {

        if (
            carregandoServicos ||
            !listaServicosAdmin
        ) {
            return;
        }


        carregandoServicos =
            true;


        listaServicosAdmin.innerHTML = `
            <div class="estado-carregando-admin">
                Carregando serviços...
            </div>
        `;


        try {

            const {
                data,
                error
            } =
                await supabaseV2
                    .from(
                        "servicos_v2"
                    )
                    .select(
                        `
                        id,
                        nome,
                        descricao,
                        preco,
                        duracao_minutos,
                        categoria,
                        ativo,
                        permite_agendamento_online
                        `
                    )
                    .eq(
                        "barbearia_id",
                        obterBarbeariaId()
                    )
                    .order(
                        "nome",
                        {
                            ascending: true
                        }
                    );


            if (error) {

                console.error(
                    "Erro ao carregar serviços:",
                    error
                );


                listaServicosAdmin.innerHTML = `
                    <div class="estado-carregando-admin">
                        Não foi possível carregar os serviços.
                    </div>
                `;

                return;

            }


            servicosCarregados =
                data || [];


            atualizarResumo();


            renderizarServicos(
                servicosCarregados
            );

            await carregarUsoPlano();


        } catch (erro) {

            console.error(
                "Erro inesperado ao carregar serviços:",
                erro
            );


            listaServicosAdmin.innerHTML = `
                <div class="estado-carregando-admin">
                    Não foi possível carregar os serviços.
                </div>
            `;


        } finally {

            carregandoServicos =
                false;

        }

    }


    // =====================================================
    // RESUMO
    // =====================================================

    function atualizarResumo() {

        const ativos =
            servicosCarregados.filter(
                function (servico) {

                    return (
                        servico.ativo ===
                        true
                    );

                }
            );


        const online =
            servicosCarregados.filter(
                function (servico) {

                    return (
                        servico.ativo ===
                            true &&
                        servico.permite_agendamento_online ===
                            true
                    );

                }
            );


        totalServicos.textContent =
            servicosCarregados.length;


        totalServicosAtivos.textContent =
            ativos.length;


        totalServicosOnline.textContent =
            online.length;

    }


    // =====================================================
    // RENDERIZAR
    // =====================================================

    function renderizarServicos(
        servicos
    ) {

        if (!listaServicosAdmin) {
            return;
        }


        listaServicosAdmin.innerHTML =
            "";


        if (!servicos.length) {

            primeiraConfiguracao = true;

            listaServicosAdmin.innerHTML = `
                <div class="estado-carregando-admin">
                    <strong>Cadastre seu primeiro serviço</strong>
                    <br>
                    Informe nome, preço e duração para começar
                    a montar o agendamento online da barbearia.
                </div>
            `;

            return;

        }

        primeiraConfiguracao = false;


        servicos.forEach(
            function (servico) {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "servico-admin-card";


                card.innerHTML = `

                    <div class="servico-admin-info">

                        <strong>
                            ${servico.nome}
                        </strong>

                        <p>
                            ${
                                servico.descricao ||
                                "Sem descrição"
                            }
                        </p>

                        ${
                            servico.categoria
                                ? `
                                    <span class="servico-categoria">
                                        ${servico.categoria}
                                    </span>
                                `
                                : ""
                        }

                    </div>


                    <div class="servico-admin-dado">

                        <span>
                            Preço
                        </span>

                        <strong>
                            ${formatarPrecoServico(
                                servico.preco
                            )}
                        </strong>

                    </div>


                    <div class="servico-admin-dado">

                        <span>
                            Duração
                        </span>

                        <strong>
                            ${servico.duracao_minutos} min
                        </strong>

                    </div>


                    <div>

                        <button
                            class="status-servico botao-status-servico ${
                                servico.ativo
                                    ? "ativo"
                                    : "inativo"
                            }"
                            type="button"
                            data-id="${servico.id}"
                            data-ativo="${servico.ativo}"
                        >
                            ${
                                servico.ativo
                                    ? "Ativo"
                                    : "Inativo"
                            }
                        </button>

                    </div>


                    <button
                        class="botao-editar-servico"
                        type="button"
                        data-id="${servico.id}"
                    >
                        Editar
                    </button>

                `;


                listaServicosAdmin.appendChild(
                    card
                );

            }
        );

    }


    // =====================================================
    // FILTRAR
    // =====================================================

    function filtrarServicos() {

        const termo =
            buscaServico
                .value
                .trim()
                .toLowerCase();


        if (!termo) {

            renderizarServicos(
                servicosCarregados
            );

            return;

        }


        const filtrados =
            servicosCarregados.filter(
                function (servico) {

                    const nome =
                        String(
                            servico.nome ||
                            ""
                        ).toLowerCase();


                    const descricao =
                        String(
                            servico.descricao ||
                            ""
                        ).toLowerCase();


                    const categoria =
                        String(
                            servico.categoria ||
                            ""
                        ).toLowerCase();


                    return (
                        nome.includes(
                            termo
                        ) ||
                        descricao.includes(
                            termo
                        ) ||
                        categoria.includes(
                            termo
                        )
                    );

                }
            );


        renderizarServicos(
            filtrados
        );

    }


    // =====================================================
    // ABRIR NOVO
    // =====================================================

    async function abrirNovoServico() {

        try {
            await carregarUsoPlano();
        } catch (erro) {
            console.error("Erro ao consultar plano:", erro);
        }

        if (limitePlanoAtingido()) {
            const limite = usoPlano?.servicos?.limite;
            const plano = usoPlano?.plano?.nome || "atual";
            alert(
                `Você já utiliza ${limite} de ${limite} serviço(s), limite do plano ${plano}. Para adicionar outro serviço, será necessário mudar de plano.`
            );
            return;
        }

        formServico.reset();


        servicoId.value =
            "";


        servicoAtivo.checked =
            true;


        servicoOnline.checked =
            true;


        tituloModalServico.textContent =
            "Novo serviço";


        modalServico.classList.add(
            "ativo"
        );


        modalServico.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    // =====================================================
    // ABRIR EDIÇÃO
    // =====================================================

    function abrirEdicaoServico(id) {

        const servico =
            servicosCarregados.find(
                function (item) {

                    return (
                        String(
                            item.id
                        ) ===
                        String(
                            id
                        )
                    );

                }
            );


        if (!servico) {

            console.error(
                "Serviço não encontrado:",
                id
            );

            return;

        }


        servicoId.value =
            servico.id;


        servicoNome.value =
            servico.nome || "";


        servicoDescricao.value =
            servico.descricao || "";


        servicoPreco.value =
            Number(
                servico.preco || 0
            );


        servicoDuracao.value =
            servico.duracao_minutos || "";


        servicoCategoria.value =
            servico.categoria || "";


        servicoAtivo.checked =
            servico.ativo === true;


        servicoOnline.checked =
            servico.permite_agendamento_online ===
            true;


        tituloModalServico.textContent =
            "Editar serviço";


        modalServico.classList.add(
            "ativo"
        );


        modalServico.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    // =====================================================
    // FECHAR MODAL
    // =====================================================

    function fecharModal() {

        if (!modalServico) {
            return;
        }


        modalServico.classList.remove(
            "ativo"
        );


        modalServico.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    // =====================================================
    // ALTERAR STATUS
    // =====================================================

    async function alterarStatusServico(
        botao
    ) {

        const id =
            botao.dataset.id;


        const estaAtivo =
            botao.dataset.ativo ===
            "true";


        const novoStatus =
            !estaAtivo;


        botao.disabled =
            true;


        try {

            const {
                error
            } =
                await supabaseV2
                    .from(
                        "servicos_v2"
                    )
                    .update({
                        ativo:
                            novoStatus
                    })
                    .eq(
                        "id",
                        id
                    )
                    .eq(
                        "barbearia_id",
                        obterBarbeariaId()
                    );


            if (error) {

                console.error(
                    "Erro ao alterar status:",
                    error
                );

                const mensagemLimite = mensagemLimitePlano(error);

                alert(
                    mensagemLimite ||
                    "Não foi possível alterar o status."
                );

                if (mensagemLimite) {
                    await carregarUsoPlano();
                }

                return;

            }


            await carregarServicos();


            document.dispatchEvent(
                new CustomEvent(
                    "admin:servicos-atualizados",
                    {
                        detail: {
                            barbeariaId:
                                obterBarbeariaId(),
                            servicoId:
                                id,
                            statusAlterado:
                                true
                        }
                    }
                )
            );


        } catch (erro) {

            console.error(
                "Erro inesperado ao alterar status:",
                erro
            );

            alert(
                "Não foi possível alterar o status."
            );


        } finally {

            botao.disabled =
                false;

        }

    }


    // =====================================================
    // VINCULAR SERVIÇO AO PRIMEIRO PROFISSIONAL
    // =====================================================

    async function vincularServicoAoProfissionalUnico(
        servicoIdCriado
    ) {

        if (!servicoIdCriado) {
            return;
        }


        try {

            const barbeariaId =
                obterBarbeariaId();


            const {
                data: profissionais,
                error: erroProfissionais
            } =
                await supabaseV2
                    .from("profissionais")
                    .select("id")
                    .eq(
                        "barbearia_id",
                        barbeariaId
                    )
                    .eq(
                        "ativo",
                        true
                    )
                    .limit(2);


            if (erroProfissionais) {

                console.error(
                    "Erro ao verificar profissionais do serviço:",
                    erroProfissionais
                );

                return;
            }


            // No onboarding existe apenas o profissional dono.
            // Também ajuda barbearias solo sem interferir em equipes:
            // se houver dois ou mais profissionais, o vínculo continua
            // sendo escolhido manualmente na tela Profissionais.
            if (
                !profissionais ||
                profissionais.length !== 1
            ) {
                return;
            }


            const {
                error: erroVinculo
            } =
                await supabaseV2
                    .from(
                        "profissional_servicos"
                    )
                    .upsert(
                        {
                            profissional_id:
                                profissionais[0].id,

                            servico_id:
                                servicoIdCriado,

                            ativo:
                                true
                        },
                        {
                            onConflict:
                                "profissional_id,servico_id"
                        }
                    );


            if (erroVinculo) {

                console.error(
                    "Serviço salvo, mas não foi possível vinculá-lo ao profissional:",
                    erroVinculo
                );
            }


        } catch (erro) {

            console.error(
                "Erro inesperado ao vincular serviço ao profissional:",
                erro
            );
        }
    }


    // =====================================================
    // SALVAR SERVIÇO
    // =====================================================

    async function salvarServico(
        event
    ) {

        event.preventDefault();


        const nome =
            servicoNome.value.trim();


        const descricao =
            servicoDescricao.value.trim();


        const preco =
            Number(
                servicoPreco.value
            );


        const duracao =
            Number(
                servicoDuracao.value
            );


        const categoria =
            servicoCategoria.value.trim();


        const ativo =
            servicoAtivo.checked;


        const online =
            servicoOnline.checked;


        if (!nome) {

            alert(
                "Informe o nome do serviço."
            );

            return;

        }


        if (
            Number.isNaN(preco) ||
            preco < 0
        ) {

            alert(
                "Informe um preço válido."
            );

            return;

        }


        if (
            Number.isNaN(duracao) ||
            duracao < 5
        ) {

            alert(
                "Informe uma duração válida."
            );

            return;

        }


        const dadosServico = {

            barbearia_id:
                obterBarbeariaId(),

            nome:
                nome,

            descricao:
                descricao || null,

            preco:
                preco,

            duracao_minutos:
                duracao,

            categoria:
                categoria || null,

            ativo:
                ativo,

            permite_agendamento_online:
                online

        };


        botaoSalvarServico.disabled =
            true;


        botaoSalvarServico.textContent =
            "Salvando...";


        try {

            let resultado;

            let servicoCriadoId = null;

            const editando =
                Boolean(
                    servicoId.value
                );


            if (editando) {

                resultado =
                    await supabaseV2
                        .from(
                            "servicos_v2"
                        )
                        .update(
                            dadosServico
                        )
                        .eq(
                            "id",
                            servicoId.value
                        )
                        .eq(
                            "barbearia_id",
                            obterBarbeariaId()
                        )
                        .select("id")
                        .single();

            } else {

                resultado =
                    await supabaseV2
                        .from(
                            "servicos_v2"
                        )
                        .insert(
                            dadosServico
                        )
                        .select("id")
                        .single();

            }


            if (resultado.error) {

                console.error(
                    "Erro ao salvar serviço:",
                    resultado.error
                );


                const mensagemLimite = mensagemLimitePlano(resultado.error);

                alert(
                    mensagemLimite ||
                    "Não foi possível salvar o serviço."
                );

                if (mensagemLimite) {
                    await carregarUsoPlano();
                }

                return;

            }


            servicoCriadoId =
                resultado.data?.id ||
                servicoId.value ||
                null;


            if (!editando) {

                await vincularServicoAoProfissionalUnico(
                    servicoCriadoId
                );
            }


            fecharModal();


            await carregarServicos();


            document.dispatchEvent(
                new CustomEvent(
                    "admin:servicos-atualizados",
                    {
                        detail: {
                            barbeariaId:
                                obterBarbeariaId(),

                            servicoId:
                                servicoCriadoId,

                            novo:
                                !editando,

                            primeiraConfiguracao:
                                primeiraConfiguracao
                        }
                    }
                )
            );


        } catch (erro) {

            console.error(
                "Erro inesperado ao salvar serviço:",
                erro
            );


            const mensagemLimite = mensagemLimitePlano(erro);

            alert(
                mensagemLimite ||
                "Não foi possível salvar o serviço."
            );

            if (mensagemLimite) {
                await carregarUsoPlano();
            }


        } finally {

            botaoSalvarServico.disabled =
                false;


            botaoSalvarServico.textContent =
                "Salvar serviço";

        }

    }


    // =====================================================
    // EVENTOS
    // =====================================================

    function configurarEventos() {

        if (eventosConfigurados) {
            return;
        }


        eventosConfigurados =
            true;


        if (buscaServico) {

            buscaServico.addEventListener(
                "input",
                filtrarServicos
            );

        }


        if (botaoNovoServico) {

            botaoNovoServico.addEventListener(
                "click",
                abrirNovoServico
            );

        }


        if (fecharModalServico) {

            fecharModalServico.addEventListener(
                "click",
                fecharModal
            );

        }


        if (cancelarServico) {

            cancelarServico.addEventListener(
                "click",
                fecharModal
            );

        }


        if (modalServico) {

            modalServico.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modalServico
                    ) {

                        fecharModal();

                    }

                }
            );

        }


        if (formServico) {

            formServico.addEventListener(
                "submit",
                salvarServico
            );

        }


        if (listaServicosAdmin) {

            listaServicosAdmin.addEventListener(
                "click",
                async function (event) {

                    const botaoStatus =
                        event.target.closest(
                            ".botao-status-servico"
                        );


                    if (botaoStatus) {

                        await alterarStatusServico(
                            botaoStatus
                        );

                        return;

                    }


                    const botaoEditar =
                        event.target.closest(
                            ".botao-editar-servico"
                        );


                    if (!botaoEditar) {
                        return;
                    }


                    abrirEdicaoServico(
                        botaoEditar.dataset.id
                    );

                }
            );

        }


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Escape"
                ) {

                    fecharModal();

                }

            }
        );

    }


    // =====================================================
    // INICIALIZAR
    // =====================================================

    function iniciarServicos() {

        buscarElementos();

        configurarEventos();

    }


    // =====================================================
    // EVENTO DO PAINEL
    // =====================================================

    document.addEventListener(
        "admin:pagina-aberta",
        async function (event) {

            if (
                event.detail?.pagina !==
                "servicos"
            ) {
                return;
            }


            iniciarServicos();


            await carregarServicos();

        }
    );


    document.addEventListener(
        "saas:contexto-carregado",
        async function () {

            const pagina =
                document.querySelector(
                    "#pagina-servicos"
                );

            if (
                pagina &&
                pagina.classList.contains("ativa")
            ) {

                iniciarServicos();
                await carregarServicos();

            }

        }
    );


    // =====================================================
    // API
    // =====================================================

    window.adminServicos = {

        carregar:
            carregarServicos,

        carregarUsoPlano:
            carregarUsoPlano,

        obterUsoPlano:
            function () {
                return usoPlano;
            },

        obterServicos:
            function () {

                return [
                    ...servicosCarregados
                ];

            },

        estaNaPrimeiraConfiguracao:
            function () {

                return (
                    servicosCarregados.length ===
                    0
                );

            }

    };


    // =====================================================
    // PREPARAÇÃO
    // =====================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarServicos
        );

    } else {

        iniciarServicos();

    }

})();