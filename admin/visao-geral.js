(function () {
    "use strict";
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


    function obterInicioFimHoje() {

        const agora = new Date();

        const inicio = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate(),
            0,
            0,
            0,
            0
        );

        const fim = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate() + 1,
            0,
            0,
            0,
            0
        );

        return {
            inicio: inicio.toISOString(),
            fim: fim.toISOString()
        };
    }


    function formatarDinheiro(valor) {

        return Number(valor || 0).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
    }


    function formatarHora(data) {

        if (!data) {
            return "--:--";
        }

        return new Date(data).toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    function definirTexto(seletor, texto) {

        const elemento =
            document.querySelector(seletor);

        if (elemento) {
            elemento.textContent = texto;
        }
    }


    async function buscarAgendamentosHoje() {

        const periodo =
            obterInicioFimHoje();

        const { data, error } =
            await supabaseV2
                .from("agendamentos_v2")
                .select(`
                    id,
                    inicio,
                    fim,
                    status,
                    valor_total,
                    cliente_id,
                    profissional_id
                `)
                .eq(
                    "barbearia_id",
                    obterBarbeariaId()
                )
                .gte(
                    "inicio",
                    periodo.inicio
                )
                .lt(
                    "inicio",
                    periodo.fim
                )
                .neq(
                    "status",
                    "cancelado"
                )
                .order(
                    "inicio",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        return data || [];
    }


    async function buscarClientes() {

        const { count, error } =
            await supabaseV2
                .from("clientes_v2")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "barbearia_id",
                    obterBarbeariaId()
                );

        if (error) {
            throw error;
        }

        return count || 0;
    }


    async function buscarServicosAtivos() {

        const { count, error } =
            await supabaseV2
                .from("servicos_v2")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "barbearia_id",
                    obterBarbeariaId()
                )
                .eq(
                    "ativo",
                    true
                );

        if (error) {
            throw error;
        }

        return count || 0;
    }


    async function buscarClientesDosAgendamentos(
        agendamentos
    ) {

        const ids = [
            ...new Set(
                agendamentos
                    .map(
                        agendamento =>
                            agendamento.cliente_id
                    )
                    .filter(Boolean)
            )
        ];

        if (!ids.length) {
            return {};
        }

        const { data, error } =
            await supabaseV2
                .from("clientes_v2")
                .select(
                    "id, nome, whatsapp"
                )
                .in(
                    "id",
                    ids
                );

        if (error) {
            throw error;
        }

        const clientesPorId = {};

        (data || []).forEach(
            function (cliente) {

                clientesPorId[
                    cliente.id
                ] = cliente;

            }
        );

        return clientesPorId;
    }


    async function buscarProfissionaisDosAgendamentos(
        agendamentos
    ) {

        const ids = [
            ...new Set(
                agendamentos
                    .map(
                        agendamento =>
                            agendamento.profissional_id
                    )
                    .filter(Boolean)
            )
        ];


        if (!ids.length) {
            return {};
        }


        const { data, error } =
            await supabaseV2
                .from("profissionais")
                .select("id, nome")
                .eq(
                    "barbearia_id",
                    obterBarbeariaId()
                )
                .in(
                    "id",
                    ids
                );


        if (error) {
            throw error;
        }


        const profissionaisPorId =
            {};


        (data || []).forEach(
            function (profissional) {

                profissionaisPorId[
                    profissional.id
                ] = profissional;

            }
        );


        return profissionaisPorId;
    }


    async function buscarExpedienteHoje() {

        const hoje =
            new Date().getDay();


        const {
            data: profissionais,
            error: erroProfissionais
        } =
            await supabaseV2
                .from("profissionais")
                .select("id, nome")
                .eq(
                    "barbearia_id",
                    obterBarbeariaId()
                )
                .eq(
                    "ativo",
                    true
                )
                .order(
                    "nome",
                    {
                        ascending: true
                    }
                );


        if (erroProfissionais) {
            throw erroProfissionais;
        }


        if (!profissionais?.length) {
            return [];
        }


        const ids =
            profissionais.map(
                profissional =>
                    profissional.id
            );


        const {
            data: horarios,
            error: erroHorarios
        } =
            await supabaseV2
                .from(
                    "horarios_profissionais"
                )
                .select(`
                    profissional_id,
                    dia_semana,
                    hora_inicio,
                    hora_fim,
                    ativo
                `)
                .in(
                    "profissional_id",
                    ids
                )
                .eq(
                    "dia_semana",
                    hoje
                )
                .eq(
                    "ativo",
                    true
                );


        if (erroHorarios) {
            throw erroHorarios;
        }


        const horariosPorProfissional =
            {};

        (horarios || []).forEach(
            function (horario) {
                horariosPorProfissional[
                    horario.profissional_id
                ] = horario;
            }
        );


        return profissionais.map(
            function (profissional) {

                return {
                    ...profissional,
                    horario:
                        horariosPorProfissional[
                            profissional.id
                        ] || null
                };

            }
        );
    }

    function preencherIndicadores(
        agendamentos,
        totalClientes,
        totalServicos
    ) {

        const faturamento =
            agendamentos.reduce(
                function (
                    total,
                    agendamento
                ) {

                    return total +
                        Number(
                            agendamento.valor_total ||
                            0
                        );

                },
                0
            );


        definirTexto(
            "#dashboard-agendamentos-hoje",
            String(
                agendamentos.length
            )
        );


        definirTexto(
            "#dashboard-faturamento-hoje",
            formatarDinheiro(
                faturamento
            )
        );


        definirTexto(
            "#dashboard-total-clientes",
            String(
                totalClientes
            )
        );


        definirTexto(
            "#dashboard-servicos-ativos",
            String(
                totalServicos
            )
        );
    }


    function preencherProximosAtendimentos(
        agendamentos,
        clientesPorId,
        profissionaisPorId
    ) {

        const container =
            document.querySelector(
                "#dashboard-proximos-agendamentos"
            );

        if (!container) {
            return;
        }


        const agora =
            new Date();


        const proximos =
            agendamentos
                .filter(
                    function (
                        agendamento
                    ) {

                        return new Date(
                            agendamento.fim
                        ) >= agora;
                    }
                )
                .slice(
                    0,
                    5
                );


        if (!proximos.length) {

            container.innerHTML = `
                <div class="dashboard-vazio">
                    Nenhum atendimento restante para hoje.
                </div>
            `;

            return;
        }


        container.innerHTML =
            proximos
                .map(
                    function (
                        agendamento
                    ) {

                        const cliente =
                            clientesPorId[
                                agendamento.cliente_id
                            ];

                        const nome =
                            cliente?.nome ||
                            "Cliente";

                        const profissional =
                            profissionaisPorId[
                                agendamento.profissional_id
                            ];

                        const nomeProfissional =
                            profissional?.nome ||
                            "Profissional";

                        return `
                            <div class="dashboard-atendimento">

                                <div class="dashboard-atendimento-hora">
                                    ${formatarHora(
                                        agendamento.inicio
                                    )}
                                </div>

                                <div class="dashboard-atendimento-info">

                                    <strong>
                                        ${nome}
                                    </strong>

                                    <span>
                                        ${nomeProfissional} •
                                        ${agendamento.status}
                                    </span>

                                </div>

                                <div class="dashboard-atendimento-valor">
                                    ${formatarDinheiro(
                                        agendamento.valor_total
                                    )}
                                </div>

                            </div>
                        `;
                    }
                )
                .join("");
    }


    function preencherExpediente(
        profissionais
    ) {

        if (!profissionais?.length) {

            definirTexto(
                "#dashboard-expediente-hoje",
                "Nenhum profissional ativo"
            );

            return;
        }


        const trabalhando =
            profissionais.filter(
                profissional =>
                    profissional.horario &&
                    profissional.horario.ativo
            );


        if (!trabalhando.length) {

            definirTexto(
                "#dashboard-expediente-hoje",
                "Equipe fechada hoje"
            );

            return;
        }


        if (profissionais.length === 1) {

            const horario =
                trabalhando[0]?.horario;

            const texto =
                horario
                    ? `${horario.hora_inicio.slice(0, 5)} às ` +
                      `${horario.hora_fim.slice(0, 5)}`
                    : "Fechado hoje";

            definirTexto(
                "#dashboard-expediente-hoje",
                texto
            );

            return;
        }


        definirTexto(
            "#dashboard-expediente-hoje",
            `${trabalhando.length} de ` +
            `${profissionais.length} profissionais trabalhando`
        );
    }

    async function carregarVisaoGeral() {

        try {

            const [
                agendamentos,
                totalClientes,
                totalServicos,
                expediente
            ] =
                await Promise.all([
                    buscarAgendamentosHoje(),
                    buscarClientes(),
                    buscarServicosAtivos(),
                    buscarExpedienteHoje()
                ]);


            const [
                clientesPorId,
                profissionaisPorId
            ] =
                await Promise.all([
                    buscarClientesDosAgendamentos(
                        agendamentos
                    ),
                    buscarProfissionaisDosAgendamentos(
                        agendamentos
                    )
                ]);


            preencherIndicadores(
                agendamentos,
                totalClientes,
                totalServicos
            );


            preencherProximosAtendimentos(
                agendamentos,
                clientesPorId,
                profissionaisPorId
            );


            preencherExpediente(
                expediente
            );


        } catch (erro) {

            console.error(
                "Erro ao carregar Visão Geral:",
                erro
            );

        }
    }


    document.addEventListener(
        "admin:pagina-aberta",
        async function (
            event
        ) {

            if (
                event.detail?.pagina !==
                "visao-geral"
            ) {
                return;
            }

            await carregarVisaoGeral();

        }
    );


    document.addEventListener(
        "saas:contexto-carregado",
        async function () {

            const pagina =
                document.querySelector(
                    "#pagina-visao-geral"
                );

            if (
                pagina &&
                pagina.classList.contains("ativa")
            ) {

                await carregarVisaoGeral();

            }

        }
    );


    document.addEventListener(
        "admin:profissionais-atualizados",
        async function () {

            const pagina =
                document.querySelector(
                    "#pagina-visao-geral"
                );

            if (
                pagina &&
                pagina.classList.contains("ativa")
            ) {

                await carregarVisaoGeral();

            }

        }
    );


    window.adminVisaoGeral = {
        carregar: carregarVisaoGeral
    };

})();


// =========================================================
// STATUS DE CONFIGURAÇÃO DA BARBEARIA / ONBOARDING
// =========================================================

(function () {
    "use strict";

    let cardStatusConfiguracao = null;
    let carregandoStatus = false;


    function obterBarbeariaIdConfiguracao() {

        return (
            window.adminApp?.obterBarbeariaId?.() ||
            window.contextoSaaS?.obterBarbeariaId?.() ||
            null
        );
    }


    function escaparHtmlConfiguracao(valor) {

        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function garantirCardStatusConfiguracao() {

        if (cardStatusConfiguracao) {
            return cardStatusConfiguracao;
        }


        const pagina =
            document.querySelector(
                "#pagina-visao-geral"
            );

        if (!pagina) {
            return null;
        }


        const card =
            document.createElement("section");

        card.id =
            "card-status-configuracao";

        card.className =
            "card-admin";

        card.style.marginBottom =
            "24px";


        const primeiroBloco =
            pagina.querySelector(
                ".dashboard-grid"
            );


        if (primeiroBloco) {

            primeiroBloco.insertAdjacentElement(
                "beforebegin",
                card
            );

        } else {

            pagina.prepend(card);
        }


        cardStatusConfiguracao = card;

        return card;
    }


    function renderizarCarregandoConfiguracao() {

        const card =
            garantirCardStatusConfiguracao();

        if (!card) {
            return;
        }


        card.innerHTML = `
            <div class="card-admin-cabecalho">
                <div>
                    <span class="card-admin-etiqueta">
                        CONFIGURAÇÃO INICIAL
                    </span>

                    <h2>
                        Verificando sua barbearia...
                    </h2>
                </div>
            </div>

            <p class="texto-secundario-admin">
                Estamos conferindo serviços, profissionais e expediente.
            </p>
        `;
    }


    function renderizarStatusConfiguracao(status) {

        const card =
            garantirCardStatusConfiguracao();

        if (!card) {
            return;
        }


        const etapas = [
            {
                concluida:
                    status.temServico,
                texto:
                    "Cadastrar pelo menos um serviço ativo",
                pagina:
                    "servicos"
            },
            {
                concluida:
                    status.temVinculo,
                texto:
                    "Vincular um serviço ativo a um profissional ativo",
                pagina:
                    "profissionais"
            },
            {
                concluida:
                    status.temExpediente,
                texto:
                    "Configurar pelo menos um dia de expediente",
                pagina:
                    "expediente"
            }
        ];


        const totalConcluido =
            etapas.filter(
                function (etapa) {
                    return etapa.concluida;
                }
            ).length;


        const pronta =
            totalConcluido ===
            etapas.length;


        const itens =
            etapas.map(
                function (etapa) {

                    const simbolo =
                        etapa.concluida
                            ? "✓"
                            : "○";

                    const acao =
                        etapa.concluida
                            ? ""
                            : `
                                <button
                                    type="button"
                                    class="botao-secundario-admin"
                                    data-configuracao-pagina="${escaparHtmlConfiguracao(
                                        etapa.pagina
                                    )}"
                                    style="margin-left: auto;"
                                >
                                    Configurar
                                </button>
                            `;


                    return `
                        <div
                            style="
                                display: flex;
                                gap: 12px;
                                align-items: center;
                                padding: 12px 0;
                                border-bottom: 1px solid rgba(127, 127, 127, 0.15);
                            "
                        >
                            <strong
                                style="
                                    min-width: 24px;
                                    font-size: 18px;
                                "
                            >
                                ${simbolo}
                            </strong>

                            <span>
                                ${escaparHtmlConfiguracao(
                                    etapa.texto
                                )}
                            </span>

                            ${acao}
                        </div>
                    `;
                }
            ).join("");


        if (pronta) {

            card.innerHTML = `
                <div class="card-admin-cabecalho">
                    <div>
                        <span class="card-admin-etiqueta">
                            AGENDAMENTO ONLINE
                        </span>

                        <h2>
                            Sua barbearia está pronta para receber agendamentos ✓
                        </h2>

                        <p class="texto-secundario-admin">
                            Serviço, profissional e expediente estão configurados.
                            O link público da sua barbearia já pode ser enviado aos clientes.
                        </p>
                    </div>
                </div>
            `;

            return;
        }


        card.innerHTML = `
            <div class="card-admin-cabecalho">
                <div>
                    <span class="card-admin-etiqueta">
                        CONFIGURAÇÃO INICIAL
                    </span>

                    <h2>
                        Configuração ${totalConcluido} de ${etapas.length}
                    </h2>

                    <p class="texto-secundario-admin">
                        Complete os itens abaixo para começar a receber
                        agendamentos pelo seu link público.
                    </p>
                </div>
            </div>

            <div style="margin-top: 14px;">
                ${itens}
            </div>
        `;


        card.querySelectorAll(
            "[data-configuracao-pagina]"
        ).forEach(
            function (botao) {

                botao.addEventListener(
                    "click",
                    function () {

                        const pagina =
                            botao.dataset
                                .configuracaoPagina;

                        if (
                            pagina &&
                            window.adminApp
                                ?.abrirPagina
                        ) {
                            window.adminApp
                                .abrirPagina(
                                    pagina
                                );
                        }
                    }
                );
            }
        );
    }


    async function carregarStatusConfiguracao() {

        if (carregandoStatus) {
            return;
        }


        const barbeariaId =
            obterBarbeariaIdConfiguracao();

        if (!barbeariaId) {
            return;
        }


        carregandoStatus = true;

        renderizarCarregandoConfiguracao();


        try {

            const [
                resultadoServicos,
                resultadoProfissionais,
                resultadoVinculos,
                resultadoExpediente
            ] =
                await Promise.all([

                    supabaseV2
                        .from("servicos_v2")
                        .select("id")
                        .eq(
                            "barbearia_id",
                            barbeariaId
                        )
                        .eq(
                            "ativo",
                            true
                        ),

                    supabaseV2
                        .from("profissionais")
                        .select("id")
                        .eq(
                            "barbearia_id",
                            barbeariaId
                        )
                        .eq(
                            "ativo",
                            true
                        ),

                    supabaseV2
                        .from(
                            "profissional_servicos"
                        )
                        .select(`
                            profissional_id,
                            servico_id,
                            ativo,
                            profissionais!inner(
                                id,
                                barbearia_id,
                                ativo
                            ),
                            servicos_v2!inner(
                                id,
                                barbearia_id,
                                ativo
                            )
                        `)
                        .eq(
                            "ativo",
                            true
                        )
                        .eq(
                            "profissionais.barbearia_id",
                            barbeariaId
                        )
                        .eq(
                            "profissionais.ativo",
                            true
                        )
                        .eq(
                            "servicos_v2.barbearia_id",
                            barbeariaId
                        )
                        .eq(
                            "servicos_v2.ativo",
                            true
                        ),

                    supabaseV2
                        .from(
                            "horarios_profissionais"
                        )
                        .select(`
                            profissional_id,
                            ativo,
                            profissionais!inner(
                                id,
                                barbearia_id,
                                ativo
                            )
                        `)
                        .eq(
                            "ativo",
                            true
                        )
                        .eq(
                            "profissionais.barbearia_id",
                            barbeariaId
                        )
                        .eq(
                            "profissionais.ativo",
                            true
                        )
                ]);


            const resultados = [
                resultadoServicos,
                resultadoProfissionais,
                resultadoVinculos,
                resultadoExpediente
            ];


            const erro =
                resultados.find(
                    function (resultado) {
                        return resultado.error;
                    }
                )?.error;


            if (erro) {
                throw erro;
            }


            const servicos =
                resultadoServicos.data || [];

            const profissionais =
                resultadoProfissionais.data || [];

            const vinculos =
                resultadoVinculos.data || [];

            const expedientes =
                resultadoExpediente.data || [];


            const profissionaisAtivos =
                new Set(
                    profissionais.map(
                        function (item) {
                            return item.id;
                        }
                    )
                );


            const profissionaisComVinculo =
                new Set(
                    vinculos.map(
                        function (item) {
                            return item.profissional_id;
                        }
                    )
                );


            const profissionaisComExpediente =
                new Set(
                    expedientes.map(
                        function (item) {
                            return item.profissional_id;
                        }
                    )
                );


            // A barbearia só é considerada pronta quando existe
            // ao menos um MESMO profissional ativo que:
            // 1) tenha serviço ativo vinculado;
            // 2) tenha expediente ativo.
            const profissionalOperacional =
                [...profissionaisAtivos]
                    .some(
                        function (id) {

                            return (
                                profissionaisComVinculo
                                    .has(id) &&
                                profissionaisComExpediente
                                    .has(id)
                            );
                        }
                    );


            const status = {

                temServico:
                    servicos.length > 0,

                temVinculo:
                    vinculos.length > 0,

                temExpediente:
                    expedientes.length > 0,

                profissionalOperacional:
                    profissionalOperacional
            };


            // Mesmo que cada item exista isoladamente, não declaramos
            // "pronta" se serviço e expediente estiverem em profissionais
            // diferentes.
            if (
                status.temServico &&
                status.temVinculo &&
                status.temExpediente &&
                !status.profissionalOperacional
            ) {

                status.temExpediente =
                    false;
            }


            renderizarStatusConfiguracao(
                status
            );


            document.dispatchEvent(
                new CustomEvent(
                    "admin:status-configuracao",
                    {
                        detail: status
                    }
                )
            );


        } catch (erro) {

            console.error(
                "Erro ao verificar configuração da barbearia:",
                erro
            );


            const card =
                garantirCardStatusConfiguracao();


            if (card) {

                card.innerHTML = `
                    <div class="card-admin-cabecalho">
                        <div>
                            <span class="card-admin-etiqueta">
                                CONFIGURAÇÃO
                            </span>

                            <h2>
                                Não foi possível verificar a configuração
                            </h2>
                        </div>
                    </div>

                    <p class="texto-secundario-admin">
                        Os demais recursos do painel continuam disponíveis.
                    </p>
                `;
            }


        } finally {

            carregandoStatus = false;
        }
    }


    document.addEventListener(
        "admin:autenticado",
        carregarStatusConfiguracao
    );


    document.addEventListener(
        "admin:servicos-atualizados",
        carregarStatusConfiguracao
    );


    document.addEventListener(
        "admin:profissionais-atualizados",
        carregarStatusConfiguracao
    );


    document.addEventListener(
        "admin:expediente-atualizado",
        carregarStatusConfiguracao
    );


    document.addEventListener(
        "admin:pagina-aberta",
        function (evento) {

            if (
                evento.detail?.pagina ===
                "visao-geral"
            ) {
                carregarStatusConfiguracao();
            }
        }
    );


    window.adminStatusConfiguracao = {

        carregar:
            carregarStatusConfiguracao
    };

})();


// =========================================================
// CARD DO PLANO / CONSUMO DO SAAS
// =========================================================

(function () {
    "use strict";

    let cardPlanoSaaS = null;
    let carregandoPlano = false;


    function obterBarbeariaIdPlano() {

        return (
            window.adminApp?.obterBarbeariaId?.() ||
            window.contextoSaaS?.obterBarbeariaId?.() ||
            null
        );
    }


    function formatarMoedaPlano(valor) {

        return Number(valor || 0)
            .toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );
    }


    function formatarLimitePlano(valor) {

        return (
            valor === null ||
            valor === undefined
        )
            ? "Ilimitado"
            : String(valor);
    }


    function garantirCardPlano() {

        if (
            cardPlanoSaaS &&
            document.body.contains(
                cardPlanoSaaS
            )
        ) {
            return cardPlanoSaaS;
        }


        const pagina =
            document.querySelector(
                "#pagina-visao-geral"
            );

        if (!pagina) {
            return null;
        }


        const card =
            document.createElement(
                "section"
            );

        card.id =
            "card-plano-saas";

        card.className =
            "card-admin";

        card.style.marginBottom =
            "24px";


        const cardConfiguracao =
            document.querySelector(
                "#card-status-configuracao"
            );


        if (
            cardConfiguracao &&
            cardConfiguracao.parentElement ===
                pagina
        ) {

            cardConfiguracao
                .insertAdjacentElement(
                    "afterend",
                    card
                );

        } else {

            const dashboard =
                pagina.querySelector(
                    ".dashboard-grid"
                );

            if (dashboard) {

                dashboard
                    .insertAdjacentElement(
                        "beforebegin",
                        card
                    );

            } else {

                pagina.prepend(card);
            }
        }


        cardPlanoSaaS = card;

        return card;
    }


    function criarLinhaUso(
        titulo,
        usados,
        limite,
        permitido = true
    ) {

        if (!permitido) {

            return `
                <div
                    style="
                        padding: 14px 0;
                        border-bottom: 1px solid rgba(127,127,127,.15);
                    "
                >
                    <strong>${titulo}</strong>
                    <div class="texto-secundario-admin">
                        Não incluído neste plano
                    </div>
                </div>
            `;
        }


        const ilimitado =
            limite === null ||
            limite === undefined;


        const atingido =
            !ilimitado &&
            Number(usados) >=
                Number(limite);


        const proximo =
            !ilimitado &&
            Number(limite) > 0 &&
            Number(usados) /
                Number(limite) >= 0.8 &&
            !atingido;


        let situacao = "";

        if (atingido) {
            situacao =
                " · limite atingido";
        } else if (proximo) {
            situacao =
                " · próximo do limite";
        }


        return `
            <div
                style="
                    padding: 14px 0;
                    border-bottom: 1px solid rgba(127,127,127,.15);
                "
            >
                <strong>${titulo}</strong>

                <div class="texto-secundario-admin">
                    ${Number(usados || 0)}
                    de
                    ${formatarLimitePlano(limite)}
                    ${situacao}
                </div>
            </div>
        `;
    }


    function renderizarPlano(uso) {

        const card =
            garantirCardPlano();

        if (!card) {
            return;
        }


        const plano =
            uso?.plano || {};

        const profissionais =
            uso?.profissionais || {};

        const servicos =
            uso?.servicos || {};

        const whatsapp =
            uso?.whatsapp || {};

        const recursos =
            uso?.recursos || {};


        const nomePlano =
            plano.nome ||
            "Plano";

        const preco =
            formatarMoedaPlano(
                plano.preco_mensal
            );


        card.innerHTML = `
            <div class="card-admin-cabecalho">
                <div>
                    <span class="card-admin-etiqueta">
                        SEU PLANO
                    </span>

                    <h2>
                        ${nomePlano}
                    </h2>

                    <p class="texto-secundario-admin">
                        ${preco} / mês
                        · assinatura ${plano.status || "ativa"}
                    </p>
                </div>
            </div>

            <div
                style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
                    gap: 18px;
                    margin-top: 16px;
                "
            >
                <div>
                    ${criarLinhaUso(
                        "Profissionais",
                        profissionais.usados,
                        profissionais.limite
                    )}
                </div>

                <div>
                    ${criarLinhaUso(
                        "Serviços",
                        servicos.usados,
                        servicos.limite
                    )}
                </div>

                <div>
                    ${criarLinhaUso(
                        "WhatsApp no mês",
                        whatsapp.usados,
                        whatsapp.limite,
                        whatsapp.permitido === true
                    )}
                </div>
            </div>

            <div
                style="
                    margin-top: 16px;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                "
            >
                <span class="texto-secundario-admin">
                    Relatórios avançados:
                    <strong>
                        ${
                            recursos.relatorios_avancados
                                ? "incluídos"
                                : "não incluídos"
                        }
                    </strong>
                </span>

                <span class="texto-secundario-admin">
                    Recursos premium:
                    <strong>
                        ${
                            recursos.premium
                                ? "incluídos"
                                : "não incluídos"
                        }
                    </strong>
                </span>
            </div>
        `;
    }


    async function carregarPlanoSaaS() {

        if (carregandoPlano) {
            return;
        }


        const barbeariaId =
            obterBarbeariaIdPlano();

        if (!barbeariaId) {
            return;
        }


        carregandoPlano = true;


        try {

            const {
                data,
                error
            } =
                await supabaseV2.rpc(
                    "obter_uso_plano",
                    {
                        p_barbearia_id:
                            barbeariaId
                    }
                );


            if (error) {
                throw error;
            }


            renderizarPlano(
                data || {}
            );


            document.dispatchEvent(
                new CustomEvent(
                    "admin:plano-atualizado",
                    {
                        detail:
                            data || {}
                    }
                )
            );


        } catch (erro) {

            console.error(
                "Erro ao carregar plano:",
                erro
            );


            const card =
                garantirCardPlano();


            if (card) {

                card.innerHTML = `
                    <div class="card-admin-cabecalho">
                        <div>
                            <span class="card-admin-etiqueta">
                                SEU PLANO
                            </span>

                            <h2>
                                Não foi possível carregar o plano
                            </h2>

                            <p class="texto-secundario-admin">
                                Os demais recursos do painel continuam disponíveis.
                            </p>
                        </div>
                    </div>
                `;
            }


        } finally {

            carregandoPlano = false;
        }
    }


    document.addEventListener(
        "admin:autenticado",
        carregarPlanoSaaS
    );


    document.addEventListener(
        "admin:servicos-atualizados",
        carregarPlanoSaaS
    );


    document.addEventListener(
        "admin:profissionais-atualizados",
        carregarPlanoSaaS
    );


    document.addEventListener(
        "admin:pagina-aberta",
        function (evento) {

            if (
                evento.detail?.pagina ===
                "visao-geral"
            ) {
                carregarPlanoSaaS();
            }
        }
    );


    window.adminPlanoSaaS = {

        carregar:
            carregarPlanoSaaS
    };

})();
