(function () {

    "use strict";


    // =====================================================
    // CONFIGURAÇÕES
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

    let dataSelecionada =
        new Date();

    let eventosConfigurados =
        false;

    let carregandoAgenda =
        false;


    let profissionaisAgenda =
        [];

    let profissionalSelecionadoId =
        null;

    let seletorProfissionalAgenda =
        null;


    // =====================================================
    // MULTIPLOS PROFISSIONAIS
    // =====================================================

    function obterProfissionalSelecionadoId() {

        return profissionalSelecionadoId;

    }


    function obterProfissionalSelecionado() {

        return (
            profissionaisAgenda.find(
                function (profissional) {

                    return (
                        profissional.id ===
                        profissionalSelecionadoId
                    );

                }
            ) ||
            null
        );

    }


    async function carregarProfissionaisAgenda() {

        const barbeariaId =
            obterBarbeariaId();


        const {
            data,
            error
        } =
            await supabaseV2
                .from(
                    "profissionais"
                )
                .select(
                    "id, nome, telefone, foto_url, ativo"
                )
                .eq(
                    "barbearia_id",
                    barbeariaId
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


        if (error) {

            console.error(
                "Erro ao carregar profissionais da agenda:",
                error
            );

            throw error;

        }


        profissionaisAgenda =
            data ||
            [];


        if (!profissionaisAgenda.length) {

            profissionalSelecionadoId =
                null;

            renderizarSeletorProfissional();

            return;

        }


        const selecionadoAindaExiste =
            profissionaisAgenda.some(
                function (profissional) {

                    return (
                        profissional.id ===
                        profissionalSelecionadoId
                    );

                }
            );


        if (!selecionadoAindaExiste) {

            profissionalSelecionadoId =
                profissionaisAgenda[0].id;

        }


        renderizarSeletorProfissional();

    }


    function garantirSeletorProfissional() {

        const paginaAgenda =
            document.querySelector(
                "#pagina-agenda"
            );

        if (!paginaAgenda) {
            return;
        }


        seletorProfissionalAgenda =
            document.querySelector(
                "#seletor-profissional-agenda"
            );


        if (seletorProfissionalAgenda) {
            return;
        }


        const referencia =
            dataAgendaAdmin ||
            document.querySelector(
                "#data-agenda-admin"
            );


        const container =
            document.createElement(
                "div"
            );

        container.id =
            "seletor-profissional-agenda";

        container.className =
            "seletor-profissional-agenda";

        container.innerHTML = `
            <label for="profissional-agenda-admin">
                Profissional
            </label>

            <select id="profissional-agenda-admin">
                <option value="">
                    Carregando profissionais...
                </option>
            </select>
        `;


        if (
            referencia &&
            referencia.parentElement
        ) {

            referencia.parentElement.insertBefore(
                container,
                referencia
            );

        } else {

            paginaAgenda.insertBefore(
                container,
                paginaAgenda.firstChild
            );

        }


        seletorProfissionalAgenda =
            container;


        const select =
            container.querySelector(
                "#profissional-agenda-admin"
            );


        if (select) {

            select.addEventListener(
                "change",
                async function () {

                    profissionalSelecionadoId =
                        select.value ||
                        null;


                    if (
                        window.adminAgendamentoManual &&
                        typeof window.adminAgendamentoManual.definirProfissional ===
                            "function"
                    ) {

                        window.adminAgendamentoManual.definirProfissional(
                            profissionalSelecionadoId
                        );

                    }


                    await carregarAgenda();

                }
            );

        }

    }


    function renderizarSeletorProfissional() {

        garantirSeletorProfissional();


        if (!seletorProfissionalAgenda) {
            return;
        }


        const select =
            seletorProfissionalAgenda.querySelector(
                "#profissional-agenda-admin"
            );


        if (!select) {
            return;
        }


        if (!profissionaisAgenda.length) {

            select.innerHTML = `
                <option value="">
                    Nenhum profissional ativo
                </option>
            `;

            select.disabled =
                true;

            return;

        }


        select.disabled =
            false;


        select.innerHTML =
            profissionaisAgenda
                .map(
                    function (profissional) {

                        const selecionado =
                            profissional.id ===
                            profissionalSelecionadoId
                                ? "selected"
                                : "";

                        return `
                            <option
                                value="${profissional.id}"
                                ${selecionado}
                            >
                                ${profissional.nome}
                            </option>
                        `;

                    }
                )
                .join("");

    }


    function garantirEstilosSeletorProfissional() {

        if (
            document.querySelector(
                "#estilos-seletor-profissional-agenda"
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                "style"
            );

        style.id =
            "estilos-seletor-profissional-agenda";

        style.textContent = `
            .seletor-profissional-agenda {
                display: flex;
                flex-direction: column;
                gap: 6px;
                min-width: 220px;
                margin-bottom: 14px;
            }

            .seletor-profissional-agenda label {
                font-size: 12px;
                font-weight: 700;
                opacity: 0.72;
            }

            .seletor-profissional-agenda select {
                width: 100%;
                min-height: 42px;
                padding: 0 12px;
                border: 1px solid rgba(148, 163, 184, 0.22);
                border-radius: 10px;
                background: rgba(15, 23, 42, 0.75);
                color: inherit;
                outline: none;
            }

            .seletor-profissional-agenda select:focus {
                border-color: rgba(59, 130, 246, 0.75);
            }
        `;


        document.head.appendChild(
            style
        );

    }


    // =====================================================
    // ELEMENTOS
    // =====================================================

    let timelineAgenda;
    let dataSelecionadaTexto;
    let dataAgendaAdmin;
    let resumoAgendaDia;

    let totalAgendamentosDia;
    let totalAgendadosDia;
    let totalConcluidosDia;
    let totalCanceladosDia;
    let faturamentoPrevistoDia;
    let faturamentoRealizadoDia;

    let expedienteDia;

    let botaoHoje;
    let dataAnterior;
    let dataProxima;

    let botaoNovoBloqueio;

    let modalBloqueio;
    let fecharModalBloqueio;
    let formBloqueio;

    let bloqueioData;
    let bloqueioInicio;
    let bloqueioFim;
    let bloqueioMotivo;


    // =====================================================
    // BUSCAR ELEMENTOS
    // =====================================================

    function buscarElementos() {

        timelineAgenda =
            document.querySelector(
                "#timeline-agenda"
            );

        dataSelecionadaTexto =
            document.querySelector(
                "#data-selecionada-texto"
            );

        dataAgendaAdmin =
            document.querySelector(
                "#data-agenda-admin"
            );

        resumoAgendaDia =
            document.querySelector(
                "#resumo-agenda-dia"
            );


        const metricasAgenda =
            document.querySelector(
                ".metricas-agenda"
            );

        if (metricasAgenda) {

            metricasAgenda.innerHTML = `
                <div class="metrica-status-agenda metrica-status-agendado">
                    <span>Agendados</span>
                    <strong id="total-agendados-dia">0</strong>
                </div>

                <div class="metrica-status-agenda metrica-status-concluido">
                    <span>Concluídos</span>
                    <strong id="total-concluidos-dia">0</strong>
                </div>

                <div class="metrica-status-agenda metrica-status-cancelado">
                    <span>Cancelados</span>
                    <strong id="total-cancelados-dia">0</strong>
                </div>

                <div>
                    <span>Faturamento previsto</span>
                    <strong id="faturamento-previsto-dia">R$ 0,00</strong>
                </div>

                <div>
                    <span>Faturamento realizado</span>
                    <strong id="faturamento-realizado-dia">R$ 0,00</strong>
                </div>
            `;

        }

        totalAgendadosDia =
            document.querySelector(
                "#total-agendados-dia"
            );

        totalConcluidosDia =
            document.querySelector(
                "#total-concluidos-dia"
            );

        totalCanceladosDia =
            document.querySelector(
                "#total-cancelados-dia"
            );

        faturamentoPrevistoDia =
            document.querySelector(
                "#faturamento-previsto-dia"
            );

        faturamentoRealizadoDia =
            document.querySelector(
                "#faturamento-realizado-dia"
            );


        expedienteDia =
            document.querySelector(
                "#expediente-dia"
            );


        botaoHoje =
            document.querySelector(
                "#botao-hoje"
            );

        dataAnterior =
            document.querySelector(
                "#data-anterior"
            );

        dataProxima =
            document.querySelector(
                "#data-proxima"
            );


        botaoNovoBloqueio =
            document.querySelector(
                "#botao-novo-bloqueio"
            );


        modalBloqueio =
            document.querySelector(
                "#modal-bloqueio"
            );

        fecharModalBloqueio =
            document.querySelector(
                "#fechar-modal-bloqueio"
            );

        formBloqueio =
            document.querySelector(
                "#form-bloqueio"
            );


        bloqueioData =
            document.querySelector(
                "#bloqueio-data"
            );

        bloqueioInicio =
            document.querySelector(
                "#bloqueio-inicio"
            );

        bloqueioFim =
            document.querySelector(
                "#bloqueio-fim"
            );

        bloqueioMotivo =
            document.querySelector(
                "#bloqueio-motivo"
            );

    }


    // =====================================================
    // FORMATADORES
    // =====================================================

    function formatarDataInput(data) {

        const ano =
            data.getFullYear();

        const mes =
            String(
                data.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const dia =
            String(
                data.getDate()
            ).padStart(
                2,
                "0"
            );

        return `${ano}-${mes}-${dia}`;

    }


    function formatarDataTexto(data) {

        return data.toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

    }


    function formatarHora(dataString) {

        return new Date(
            dataString
        ).toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function formatarDinheiro(valor) {

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


    function formatarStatus(status) {

        const nomes = {
            agendado: "Agendado",
            confirmado: "Confirmado",
            concluido: "Concluído",
            cancelado: "Cancelado"
        };

        return nomes[status] || status || "";

    }


    // =====================================================
    // CORES DOS STATUS NA AGENDA
    // =====================================================

    function garantirEstilosStatusAgenda() {

        if (
            document.querySelector(
                "#estilos-status-agenda"
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "estilos-status-agenda";


        style.textContent = `

            .evento-agenda-visual.agendamento.status-agendado,
            .evento-agenda-visual.agendamento.status-confirmado {
                background: rgba(37, 99, 235, 0.16) !important;
                border: 1px solid rgba(59, 130, 246, 0.42) !important;
                border-left: 4px solid #3b82f6 !important;
            }

            .evento-agenda-visual.agendamento.status-agendado
            .evento-visual-conteudo span,
            .evento-agenda-visual.agendamento.status-confirmado
            .evento-visual-conteudo span {
                color: #60a5fa !important;
                font-weight: 700;
            }


            .evento-agenda-visual.agendamento.status-concluido {
                background: rgba(22, 163, 74, 0.16) !important;
                border: 1px solid rgba(34, 197, 94, 0.42) !important;
                border-left: 4px solid #22c55e !important;
            }

            .evento-agenda-visual.agendamento.status-concluido
            .evento-visual-conteudo span {
                color: #4ade80 !important;
                font-weight: 700;
            }


            .evento-agenda-visual.agendamento.status-cancelado {
                background: rgba(220, 38, 38, 0.14) !important;
                border: 1px solid rgba(239, 68, 68, 0.42) !important;
                border-left: 4px solid #ef4444 !important;
            }

            .evento-agenda-visual.agendamento.status-cancelado
            .evento-visual-conteudo span {
                color: #f87171 !important;
                font-weight: 700;
            }

            .metrica-status-agenda {
                border-left: 3px solid transparent;
                padding-left: 12px;
            }

            .metrica-status-agenda.metrica-status-agendado {
                border-left-color: #3b82f6;
            }

            .metrica-status-agenda.metrica-status-agendado strong {
                color: #60a5fa;
            }

            .metrica-status-agenda.metrica-status-concluido {
                border-left-color: #22c55e;
            }

            .metrica-status-agenda.metrica-status-concluido strong {
                color: #4ade80;
            }

            .metrica-status-agenda.metrica-status-cancelado {
                border-left-color: #ef4444;
            }

            .metrica-status-agenda.metrica-status-cancelado strong {
                color: #f87171;
            }

        `;


        document.head.appendChild(
            style
        );

    }


    // =====================================================
    // CARREGAMENTO
    // =====================================================

    async function carregarAgenda() {

        garantirEstilosStatusAgenda();
        garantirEstilosSeletorProfissional();
        garantirSeletorProfissional();


        if (!timelineAgenda) {
            return;
        }


        if (!profissionaisAgenda.length) {

            try {

                await carregarProfissionaisAgenda();

            } catch (erro) {

                timelineAgenda.innerHTML = `
                    <div class="estado-carregando-admin">
                        Não foi possível carregar os profissionais.
                    </div>
                `;

                return;

            }

        }


        if (!obterProfissionalSelecionadoId()) {

            timelineAgenda.innerHTML = `
                <div class="estado-carregando-admin">
                    Cadastre ou ative um profissional para visualizar a agenda.
                </div>
            `;

            if (expedienteDia) {

                expedienteDia.innerHTML = `
                    <p>
                        Nenhum profissional ativo.
                    </p>
                `;

            }

            return;

        }


        if (carregandoAgenda) {
            return;
        }


        carregandoAgenda = true;


        dataSelecionadaTexto.textContent =
            formatarDataTexto(
                dataSelecionada
            );

        dataAgendaAdmin.value =
            formatarDataInput(
                dataSelecionada
            );


        timelineAgenda.innerHTML = `
            <div class="estado-carregando-admin">
                Carregando agenda...
            </div>
        `;


        const inicioDia =
            new Date(
                dataSelecionada
            );

        inicioDia.setHours(
            0,
            0,
            0,
            0
        );


        const fimDia =
            new Date(
                dataSelecionada
            );

        fimDia.setHours(
            23,
            59,
            59,
            999
        );


        const diaSemana =
            dataSelecionada.getDay();


        try {

            const [
                resultadoExpediente,
                resultadoAgendamentos,
                resultadoBloqueios
            ] =
                await Promise.all([


                    // EXPEDIENTE

                    supabaseV2
                        .from(
                            "horarios_profissionais"
                        )
                        .select(
                            "hora_inicio, hora_fim"
                        )
                        .eq(
                            "profissional_id",
                            obterProfissionalSelecionadoId()
                        )
                        .eq(
                            "dia_semana",
                            diaSemana
                        )
                        .eq(
                            "ativo",
                            true
                        ),


                    // AGENDAMENTOS

                    supabaseV2
                        .from(
                            "agendamentos_v2"
                        )
                        .select(
                            `
                            id,
                            inicio,
                            fim,
                            status,
                            valor_total
                            `
                        )
                        .eq(
                            "barbearia_id",
                            obterBarbeariaId()
                        )
                        .eq(
                            "profissional_id",
                            obterProfissionalSelecionadoId()
                        )
                        .gte(
                            "inicio",
                            inicioDia.toISOString()
                        )
                        .lte(
                            "inicio",
                            fimDia.toISOString()
                        )
                        .order(
                            "inicio",
                            {
                                ascending: true
                            }
                        ),


                    // BLOQUEIOS

                    supabaseV2
                        .from(
                            "bloqueios_agenda"
                        )
                        .select(
                            `
                            id,
                            inicio,
                            fim,
                            motivo
                            `
                        )
                        .eq(
                            "profissional_id",
                            obterProfissionalSelecionadoId()
                        )
                        .lt(
                            "inicio",
                            fimDia.toISOString()
                        )
                        .gt(
                            "fim",
                            inicioDia.toISOString()
                        )
                        .order(
                            "inicio",
                            {
                                ascending: true
                            }
                        )

                ]);


            if (
                resultadoExpediente.error ||
                resultadoAgendamentos.error ||
                resultadoBloqueios.error
            ) {

                console.error(
                    "Erro ao carregar agenda:",
                    {
                        expediente:
                            resultadoExpediente.error,

                        agendamentos:
                            resultadoAgendamentos.error,

                        bloqueios:
                            resultadoBloqueios.error
                    }
                );


                timelineAgenda.innerHTML = `
                    <div class="estado-carregando-admin">
                        Não foi possível carregar a agenda.
                    </div>
                `;

                return;

            }


            const expediente =
                resultadoExpediente.data ||
                [];

            const agendamentos =
                resultadoAgendamentos.data ||
                [];

            const bloqueios =
                resultadoBloqueios.data ||
                [];


            renderizarExpediente(
                expediente
            );

            renderizarResumo(
                agendamentos,
                bloqueios
            );

            renderizarTimeline(
                expediente,
                agendamentos,
                bloqueios
            );


        } catch (erro) {

            console.error(
                "Erro inesperado ao carregar agenda:",
                erro
            );


            timelineAgenda.innerHTML = `
                <div class="estado-carregando-admin">
                    Não foi possível carregar a agenda.
                </div>
            `;

        } finally {

            carregandoAgenda =
                false;

        }

    }


    // =====================================================
    // EXPEDIENTE DO DIA
    // =====================================================

    function renderizarExpediente(
        expediente
    ) {

        if (!expedienteDia) {
            return;
        }


        if (!expediente.length) {

            expedienteDia.innerHTML = `
                <p>
                    Sem expediente configurado.
                </p>
            `;

            return;

        }


        expedienteDia.innerHTML =
            expediente
                .map(
                    function (item) {

                        return `
                            <p>
                                <strong>
                                    ${item.hora_inicio.slice(0, 5)}
                                </strong>

                                até

                                <strong>
                                    ${item.hora_fim.slice(0, 5)}
                                </strong>
                            </p>
                        `;

                    }
                )
                .join("");

    }


    // =====================================================
    // RESUMO
    // =====================================================

    function renderizarResumo(
        agendamentos,
        bloqueios
    ) {

        const agendados =
            agendamentos.filter(
                function (item) {

                    return (
                        item.status !== "cancelado" &&
                        item.status !== "concluido"
                    );

                }
            );


        const concluidos =
            agendamentos.filter(
                function (item) {

                    return (
                        item.status === "concluido"
                    );

                }
            );


        const cancelados =
            agendamentos.filter(
                function (item) {

                    return (
                        item.status === "cancelado"
                    );

                }
            );


        const faturamentoPrevisto =
            agendados.reduce(
                function (total, item) {

                    return (
                        total +
                        Number(
                            item.valor_total || 0
                        )
                    );

                },
                0
            );


        const faturamentoRealizado =
            concluidos.reduce(
                function (total, item) {

                    return (
                        total +
                        Number(
                            item.valor_total || 0
                        )
                    );

                },
                0
            );


        if (totalAgendadosDia) {
            totalAgendadosDia.textContent =
                agendados.length;
        }

        if (totalConcluidosDia) {
            totalConcluidosDia.textContent =
                concluidos.length;
        }

        if (totalCanceladosDia) {
            totalCanceladosDia.textContent =
                cancelados.length;
        }

        if (faturamentoPrevistoDia) {
            faturamentoPrevistoDia.textContent =
                formatarDinheiro(
                    faturamentoPrevisto
                );
        }

        if (faturamentoRealizadoDia) {
            faturamentoRealizadoDia.textContent =
                formatarDinheiro(
                    faturamentoRealizado
                );
        }


        if (resumoAgendaDia) {
            resumoAgendaDia.textContent =
                `${agendados.length} agendado(s), ${concluidos.length} concluído(s) e ${cancelados.length} cancelado(s)`;
        }

    }


    // =====================================================
    // CONVERTER HORA EM MINUTOS
    // =====================================================

    function horaParaMinutos(hora) {

        const partes =
            hora
                .slice(
                    0,
                    5
                )
                .split(":");


        return (
            Number(
                partes[0]
            ) * 60 +
            Number(
                partes[1]
            )
        );

    }


    // =====================================================
    // TIMELINE
    // =====================================================

    function renderizarTimeline(
        expediente,
        agendamentos,
        bloqueios
    ) {

        timelineAgenda.innerHTML =
            "";


        if (!expediente.length) {

            timelineAgenda.innerHTML = `
                <div class="estado-carregando-admin">
                    Sem expediente para este dia.
                </div>
            `;

            return;

        }


        // =================================================
        // INÍCIO E FIM DO EXPEDIENTE
        // =================================================

        const iniciosExpediente =
            expediente.map(
                function (item) {

                    return horaParaMinutos(
                        item.hora_inicio
                    );

                }
            );


        const finsExpediente =
            expediente.map(
                function (item) {

                    return horaParaMinutos(
                        item.hora_fim
                    );

                }
            );


        let minutoInicio =
            Math.min(
                ...iniciosExpediente
            );

        let minutoFim =
            Math.max(
                ...finsExpediente
            );


        minutoInicio =
            Math.floor(
                minutoInicio / 60
            ) * 60;


        minutoFim =
            Math.ceil(
                minutoFim / 60
            ) * 60;


        const totalMinutos =
            minutoFim -
            minutoInicio;


        const pixelsPorMinuto =
            80 / 60;


        const alturaAgenda =
            totalMinutos *
            pixelsPorMinuto;


        // =================================================
        // EVENTOS
        // =================================================

        const eventos =
            [];


        agendamentos.forEach(
            function (item) {

                eventos.push({

                    tipo:
                        "agendamento",

                    id:
                        item.id,

                    inicio:
                        item.inicio,

                    fim:
                        item.fim,

                    titulo:
                        "Agendamento",

                    detalhe:
                        formatarStatus(
                            item.status
                        ),

                    status:
                        item.status

                });

            }
        );


        bloqueios.forEach(
            function (item) {

                eventos.push({

                    tipo:
                        "bloqueio",

                    id:
                        item.id,

                    inicio:
                        item.inicio,

                    fim:
                        item.fim,

                    titulo:
                        item.motivo ||
                        "Horário bloqueado",

                    detalhe:
                        "Bloqueio"

                });

            }
        );


        eventos.sort(
            function (
                a,
                b
            ) {

                return (
                    new Date(
                        a.inicio
                    ) -
                    new Date(
                        b.inicio
                    )
                );

            }
        );


        // =================================================
        // ESTRUTURA
        // =================================================

        const agendaVisual =
            document.createElement(
                "div"
            );

        agendaVisual.className =
            "agenda-visual";


        const colunaHoras =
            document.createElement(
                "div"
            );

        colunaHoras.className =
            "agenda-coluna-horas";


        const grade =
            document.createElement(
                "div"
            );

        grade.className =
            "agenda-grade";

        grade.style.height =
            `${alturaAgenda}px`;


        // =================================================
        // LINHAS DE HORA
        // =================================================

        for (
            let minuto =
                minutoInicio;

            minuto <=
                minutoFim;

            minuto += 60
        ) {

            const hora =
                Math.floor(
                    minuto / 60
                );

            const minutos =
                minuto % 60;


            const textoHora =
                `${String(hora).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;


            const posicao =
                (
                    minuto -
                    minutoInicio
                ) *
                pixelsPorMinuto;


            const marcador =
                document.createElement(
                    "div"
                );

            marcador.className =
                "agenda-marcador-hora";

            marcador.style.top =
                `${posicao}px`;

            marcador.textContent =
                textoHora;


            colunaHoras.appendChild(
                marcador
            );


            if (
                minuto <
                minutoFim
            ) {

                const linha =
                    document.createElement(
                        "div"
                    );

                linha.className =
                    "agenda-linha-hora";

                linha.style.top =
                    `${posicao}px`;


                grade.appendChild(
                    linha
                );

            }

        }


        // =================================================
        // LINHAS DE 30 MINUTOS
        // =================================================

        for (
            let minuto =
                minutoInicio + 30;

            minuto <
                minutoFim;

            minuto += 60
        ) {

            const posicao =
                (
                    minuto -
                    minutoInicio
                ) *
                pixelsPorMinuto;


            const linha =
                document.createElement(
                    "div"
                );

            linha.className =
                "agenda-linha-meia-hora";

            linha.style.top =
                `${posicao}px`;


            grade.appendChild(
                linha
            );

        }


        // =================================================
        // EVENTOS NA GRADE
        // =================================================

        eventos.forEach(
            function (evento) {

                const inicioEvento =
                    new Date(
                        evento.inicio
                    );

                const fimEvento =
                    new Date(
                        evento.fim
                    );


                const minutoEventoInicio =
                    (
                        inicioEvento.getHours() *
                        60
                    ) +
                    inicioEvento.getMinutes();


                const minutoEventoFim =
                    (
                        fimEvento.getHours() *
                        60
                    ) +
                    fimEvento.getMinutes();


                const topo =
                    (
                        minutoEventoInicio -
                        minutoInicio
                    ) *
                    pixelsPorMinuto;


                const duracao =
                    minutoEventoFim -
                    minutoEventoInicio;


                const altura =
                    Math.max(
                        duracao *
                        pixelsPorMinuto,
                        44
                    );


                const item =
                    document.createElement(
                        "article"
                    );


                item.className =
                    `evento-agenda-visual ${evento.tipo}`;

                if (
                    evento.tipo ===
                    "agendamento"
                ) {

                    item.dataset.agendamentoId =
                        evento.id;

                    item.style.cursor =
                        "pointer";

                    item.classList.add(
                        `status-${evento.status || "agendado"}`
                    );

                }

                item.style.top =
                    `${topo}px`;

                item.style.height =
                    `${altura}px`;


                item.innerHTML = `

                    <div class="evento-visual-horario">

                        ${formatarHora(evento.inicio)}

                        <span>
                            ${formatarHora(evento.fim)}
                        </span>

                    </div>


                    <div class="evento-visual-conteudo">

                        <strong>
                            ${evento.titulo}
                        </strong>

                        ${
                            evento.detalhe
                                ? `
                                    <span>
                                        ${evento.detalhe}
                                    </span>
                                `
                                : ""
                        }

                    </div>


                    ${
                        evento.tipo ===
                        "bloqueio"

                            ? `
                                <button
                                    class="botao-remover-bloqueio"
                                    data-id="${evento.id}"
                                    type="button"
                                >
                                    Remover
                                </button>
                            `

                            : ""
                    }

                `;


                grade.appendChild(
                    item
                );

            }
        );


        // =================================================
        // DIA VAZIO
        // =================================================

        if (!eventos.length) {

            const vazio =
                document.createElement(
                    "div"
                );

            vazio.className =
                "agenda-dia-vazio";

            vazio.textContent =
                "Nenhum compromisso neste dia.";


            grade.appendChild(
                vazio
            );

        }


        agendaVisual.appendChild(
            colunaHoras
        );

        agendaVisual.appendChild(
            grade
        );

        timelineAgenda.appendChild(
            agendaVisual
        );

    }


    // =====================================================
    // REMOVER BLOQUEIO
    // =====================================================

    async function removerBloqueio(id) {

        if (!id) {
            return;
        }


        const confirmou =
            window.confirm(
                "Deseja remover este bloqueio?"
            );


        if (!confirmou) {
            return;
        }


        try {

            const {
                error
            } =
                await supabaseV2
                    .from(
                        "bloqueios_agenda"
                    )
                    .delete()
                    .eq(
                        "id",
                        id
                    )
                    .eq(
                        "profissional_id",
                        obterProfissionalSelecionadoId()
                    );


            if (error) {

                console.error(
                    "Erro ao remover bloqueio:",
                    error
                );

                alert(
                    "Não foi possível remover o bloqueio."
                );

                return;

            }


            await carregarAgenda();


        } catch (erro) {

            console.error(
                "Erro inesperado ao remover bloqueio:",
                erro
            );

            alert(
                "Não foi possível remover o bloqueio."
            );

        }

    }


    // =====================================================
    // MODAL BLOQUEIO
    // =====================================================

    function abrirModalBloqueio() {

        if (!modalBloqueio) {
            return;
        }


        bloqueioData.value =
            formatarDataInput(
                dataSelecionada
            );

        bloqueioInicio.value =
            "";

        bloqueioFim.value =
            "";

        bloqueioMotivo.value =
            "";


        modalBloqueio.classList.add(
            "ativo"
        );

        modalBloqueio.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function fecharModal() {

        if (!modalBloqueio) {
            return;
        }


        modalBloqueio.classList.remove(
            "ativo"
        );

        modalBloqueio.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    // =====================================================
    // SALVAR BLOQUEIO
    // =====================================================

    async function salvarBloqueio(
        event
    ) {

        event.preventDefault();


        if (
            !bloqueioData.value ||
            !bloqueioInicio.value ||
            !bloqueioFim.value
        ) {

            alert(
                "Preencha data, início e fim."
            );

            return;

        }


        if (
            bloqueioFim.value <=
            bloqueioInicio.value
        ) {

            alert(
                "O horário final precisa ser maior que o inicial."
            );

            return;

        }


        const inicio =
            new Date(
                `${bloqueioData.value}T${bloqueioInicio.value}:00`
            );


        const fim =
            new Date(
                `${bloqueioData.value}T${bloqueioFim.value}:00`
            );


        const botaoSalvar =
            formBloqueio.querySelector(
                'button[type="submit"]'
            );


        if (botaoSalvar) {

            botaoSalvar.disabled =
                true;

            botaoSalvar.textContent =
                "Salvando...";

        }


        try {

            // =================================================
            // VALIDAR CONFLITO COM AGENDAMENTOS EXISTENTES
            // Regra de sobreposição:
            // agendamento.inicio < bloqueio.fim
            // E agendamento.fim > bloqueio.inicio
            // =================================================

            const {
                data: agendamentosConflitantes,
                error: erroAgendamentos
            } =
                await supabaseV2
                    .from(
                        "agendamentos_v2"
                    )
                    .select(
                        "id, inicio, fim, status"
                    )
                    .eq(
                        "barbearia_id",
                        obterBarbeariaId()
                    )
                    .eq(
                        "profissional_id",
                        obterProfissionalSelecionadoId()
                    )
                    .neq(
                        "status",
                        "cancelado"
                    )
                    .lt(
                        "inicio",
                        fim.toISOString()
                    )
                    .gt(
                        "fim",
                        inicio.toISOString()
                    )
                    .limit(1);


            if (erroAgendamentos) {

                console.error(
                    "Erro ao verificar conflito com agendamentos:",
                    erroAgendamentos
                );

                alert(
                    "Não foi possível verificar a disponibilidade do horário."
                );

                return;

            }


            if (
                agendamentosConflitantes &&
                agendamentosConflitantes.length
            ) {

                const conflito =
                    agendamentosConflitantes[0];

                alert(
                    `Não é possível bloquear este período. Já existe um agendamento das ${formatarHora(conflito.inicio)} às ${formatarHora(conflito.fim)}.`
                );

                return;

            }


            // =================================================
            // VALIDAR CONFLITO COM OUTROS BLOQUEIOS
            // =================================================

            const {
                data: bloqueiosConflitantes,
                error: erroBloqueios
            } =
                await supabaseV2
                    .from(
                        "bloqueios_agenda"
                    )
                    .select(
                        "id, inicio, fim"
                    )
                    .eq(
                        "profissional_id",
                        obterProfissionalSelecionadoId()
                    )
                    .lt(
                        "inicio",
                        fim.toISOString()
                    )
                    .gt(
                        "fim",
                        inicio.toISOString()
                    )
                    .limit(1);


            if (erroBloqueios) {

                console.error(
                    "Erro ao verificar conflito com bloqueios:",
                    erroBloqueios
                );

                alert(
                    "Não foi possível verificar os bloqueios existentes."
                );

                return;

            }


            if (
                bloqueiosConflitantes &&
                bloqueiosConflitantes.length
            ) {

                const conflito =
                    bloqueiosConflitantes[0];

                alert(
                    `Este período já possui um bloqueio das ${formatarHora(conflito.inicio)} às ${formatarHora(conflito.fim)}.`
                );

                return;

            }


            // =================================================
            // SALVAR BLOQUEIO
            // =================================================

            const {
                error
            } =
                await supabaseV2
                    .from(
                        "bloqueios_agenda"
                    )
                    .insert({

                        profissional_id:
                            obterProfissionalSelecionadoId(),

                        inicio:
                            inicio.toISOString(),

                        fim:
                            fim.toISOString(),

                        motivo:
                            bloqueioMotivo
                                .value
                                .trim() ||
                            null

                    });


            if (error) {

                console.error(
                    "Erro ao salvar bloqueio:",
                    error
                );

                alert(
                    "Não foi possível salvar o bloqueio."
                );

                return;

            }


            dataSelecionada =
                new Date(
                    `${bloqueioData.value}T12:00:00`
                );


            fecharModal();


            await carregarAgenda();


        } catch (erro) {

            console.error(
                "Erro inesperado ao salvar bloqueio:",
                erro
            );

            alert(
                "Não foi possível salvar o bloqueio."
            );


        } finally {

            if (botaoSalvar) {

                botaoSalvar.disabled =
                    false;

                botaoSalvar.textContent =
                    "Salvar bloqueio";

            }

        }

    }


    // =====================================================
    // CONFIGURAR EVENTOS
    // =====================================================

    function configurarEventos() {

        if (eventosConfigurados) {
            return;
        }


        eventosConfigurados =
            true;


        if (botaoNovoBloqueio) {

            botaoNovoBloqueio
                .addEventListener(
                    "click",
                    abrirModalBloqueio
                );

        }


        if (fecharModalBloqueio) {

            fecharModalBloqueio
                .addEventListener(
                    "click",
                    fecharModal
                );

        }


        if (modalBloqueio) {

            modalBloqueio
                .addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            modalBloqueio
                        ) {

                            fecharModal();

                        }

                    }
                );

        }


        if (formBloqueio) {

            formBloqueio
                .addEventListener(
                    "submit",
                    salvarBloqueio
                );

        }


        if (dataAnterior) {

            dataAnterior
                .addEventListener(
                    "click",
                    async function () {

                        const novaData =
                            new Date(
                                dataSelecionada
                            );

                        novaData.setDate(
                            novaData.getDate() -
                            1
                        );

                        dataSelecionada =
                            novaData;


                        await carregarAgenda();

                    }
                );

        }


        if (dataProxima) {

            dataProxima
                .addEventListener(
                    "click",
                    async function () {

                        const novaData =
                            new Date(
                                dataSelecionada
                            );

                        novaData.setDate(
                            novaData.getDate() +
                            1
                        );

                        dataSelecionada =
                            novaData;


                        await carregarAgenda();

                    }
                );

        }


        if (botaoHoje) {

            botaoHoje
                .addEventListener(
                    "click",
                    async function () {

                        dataSelecionada =
                            new Date();


                        await carregarAgenda();

                    }
                );

        }


        if (dataAgendaAdmin) {

            dataAgendaAdmin
                .addEventListener(
                    "change",
                    async function () {

                        if (
                            !dataAgendaAdmin.value
                        ) {
                            return;
                        }


                        dataSelecionada =
                            new Date(
                                `${dataAgendaAdmin.value}T12:00:00`
                            );


                        await carregarAgenda();

                    }
                );

        }


        if (timelineAgenda) {

            timelineAgenda
                .addEventListener(
                    "click",
                    async function (event) {

                        const botao =
                            event.target.closest(
                                ".botao-remover-bloqueio"
                            );


                        if (!botao) {
                            return;
                        }


                        await removerBloqueio(
                            botao.dataset.id
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
    // INICIALIZAR MÓDULO
    // =====================================================

    function iniciarAgenda() {

        buscarElementos();

        garantirEstilosSeletorProfissional();

        garantirSeletorProfissional();

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
                "agenda"
            ) {
                return;
            }


            iniciarAgenda();


            try {

                await carregarProfissionaisAgenda();

            } catch (erro) {

                console.error(
                    "Erro ao preparar profissionais da agenda:",
                    erro
                );

            }


            await carregarAgenda();

        }
    );


    document.addEventListener(
        "saas:contexto-carregado",
        async function () {

            const pagina =
                document.querySelector(
                    "#pagina-agenda"
                );

            if (
                pagina &&
                pagina.classList.contains("ativa")
            ) {

                iniciarAgenda();

                try {

                    await carregarProfissionaisAgenda();

                } catch (erro) {

                    console.error(
                        "Erro ao preparar profissionais da agenda:",
                        erro
                    );

                }

                await carregarAgenda();

            }

        }
    );


    document.addEventListener(
        "admin:profissionais-atualizados",
        async function () {

            try {

                await carregarProfissionaisAgenda();
                await carregarAgenda();

            } catch (erro) {

                console.error(
                    "Erro ao atualizar profissionais da agenda:",
                    erro
                );

            }

        }
    );


    // =====================================================
    // API DA AGENDA
    // =====================================================

    window.adminAgenda = {

        carregar:
            carregarAgenda,

        irParaHoje:
            async function () {

                dataSelecionada =
                    new Date();

                await carregarAgenda();

            },

        obterData:
            function () {

                return new Date(
                    dataSelecionada
                );

            },

        obterProfissionalId:
            function () {

                return obterProfissionalSelecionadoId();

            },

        obterProfissional:
            function () {

                return obterProfissionalSelecionado();

            },

        recarregarProfissionais:
            async function () {

                await carregarProfissionaisAgenda();
                await carregarAgenda();

            }

    };


    // =====================================================
    // PREPARAÇÃO INICIAL
    // =====================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarAgenda
        );

    } else {

        iniciarAgenda();

    }

})();