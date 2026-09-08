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

    let agendamentosMes = [];


    function obterPeriodoMesAtual() {

        const agora = new Date();

        const inicio = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            1,
            0,
            0,
            0,
            0
        );

        const fim = new Date(
            agora.getFullYear(),
            agora.getMonth() + 1,
            1,
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


    function formatarData(data) {

        if (!data) {
            return "—";
        }

        return new Date(data).toLocaleDateString(
            "pt-BR"
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


    function formatarStatus(status) {

        const nomes = {
            agendado: "Agendado",
            confirmado: "Confirmado",
            concluido: "Concluído",
            cancelado: "Cancelado"
        };

        return nomes[status] || status || "—";
    }


    function definirTexto(seletor, valor) {

        const elemento =
            document.querySelector(seletor);

        if (elemento) {
            elemento.textContent = valor;
        }
    }


    async function buscarAgendamentosMes() {

        const periodo =
            obterPeriodoMesAtual();

        const { data, error } =
            await supabaseV2
                .from("agendamentos_v2")
                .select(`
                    id,
                    cliente_id,
                    profissional_id,
                    inicio,
                    fim,
                    status,
                    valor_total,
                    observacoes
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
                .order(
                    "inicio",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        return data || [];
    }


    async function buscarClientes(
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

        const clientes = {};

        (data || []).forEach(
            function (cliente) {

                clientes[cliente.id] =
                    cliente;

            }
        );

        return clientes;
    }


    async function buscarProfissionais(
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


        const profissionais = {};


        (data || []).forEach(
            function (profissional) {

                profissionais[
                    profissional.id
                ] = profissional;

            }
        );


        return profissionais;
    }


    function calcularResumo(
        agendamentos
    ) {

        const concluidos =
            agendamentos.filter(
                agendamento =>
                    agendamento.status ===
                    "concluido"
            );


        const previstos =
            agendamentos.filter(
                agendamento =>
                    agendamento.status !==
                    "cancelado" &&
                    agendamento.status !==
                    "concluido"
            );


        const faturamentoRealizado =
            concluidos.reduce(
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


        const faturamentoPrevisto =
            previstos.reduce(
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


        const ticketMedio =
            concluidos.length
                ? faturamentoRealizado /
                    concluidos.length
                : 0;


        return {
            faturamentoRealizado,
            faturamentoPrevisto,
            atendimentosConcluidos:
                concluidos.length,
            ticketMedio
        };
    }


    function preencherResumo(
        resumo
    ) {

        definirTexto(
            "#financeiro-realizado",
            formatarDinheiro(
                resumo.faturamentoRealizado
            )
        );


        definirTexto(
            "#financeiro-previsto",
            formatarDinheiro(
                resumo.faturamentoPrevisto
            )
        );


        definirTexto(
            "#financeiro-concluidos",
            String(
                resumo.atendimentosConcluidos
            )
        );


        definirTexto(
            "#financeiro-ticket-medio",
            formatarDinheiro(
                resumo.ticketMedio
            )
        );
    }


    function renderizarMovimentacoes(
        agendamentos,
        clientes,
        profissionais
    ) {

        const container =
            document.querySelector(
                "#financeiro-movimentacoes"
            );

        if (!container) {
            return;
        }


        if (!agendamentos.length) {

            container.innerHTML = `
                <div class="financeiro-vazio">
                    Nenhuma movimentação encontrada neste mês.
                </div>
            `;

            return;
        }


        container.innerHTML =
            agendamentos
                .map(
                    function (
                        agendamento
                    ) {

                        const cliente =
                            clientes[
                                agendamento.cliente_id
                            ];

                        const nome =
                            cliente?.nome ||
                            "Cliente";

                        const profissional =
                            profissionais[
                                agendamento.profissional_id
                            ];

                        const nomeProfissional =
                            profissional?.nome ||
                            "Profissional";

                        return `
                            <div class="financeiro-movimentacao">

                                <div class="financeiro-movimentacao-data">
                                    <strong>
                                        ${formatarData(
                                            agendamento.inicio
                                        )}
                                    </strong>

                                    <span>
                                        ${formatarHora(
                                            agendamento.inicio
                                        )}
                                    </span>
                                </div>

                                <div class="financeiro-movimentacao-cliente">
                                    <strong>
                                        ${nome}
                                    </strong>

                                    <span>
                                        ${nomeProfissional}
                                    </span>
                                </div>

                                <div class="financeiro-movimentacao-status">
                                    ${formatarStatus(
                                        agendamento.status
                                    )}
                                </div>

                                <div class="financeiro-movimentacao-valor">
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


    async function carregarFinanceiro() {

        try {

            agendamentosMes =
                await buscarAgendamentosMes();


            const [
                clientes,
                profissionais
            ] =
                await Promise.all([
                    buscarClientes(
                        agendamentosMes
                    ),
                    buscarProfissionais(
                        agendamentosMes
                    )
                ]);


            const resumo =
                calcularResumo(
                    agendamentosMes
                );


            preencherResumo(
                resumo
            );


            renderizarMovimentacoes(
                agendamentosMes,
                clientes,
                profissionais
            );


        } catch (erro) {

            console.error(
                "Erro ao carregar Financeiro:",
                erro
            );

        }
    }


    document.addEventListener(
        "admin:pagina-aberta",
        async function (event) {

            if (
                event.detail?.pagina !==
                "financeiro"
            ) {
                return;
            }

            await carregarFinanceiro();

        }
    );


    document.addEventListener(
        "saas:contexto-carregado",
        async function () {

            const pagina =
                document.querySelector(
                    "#pagina-financeiro"
                );

            if (
                pagina &&
                pagina.classList.contains("ativa")
            ) {

                await carregarFinanceiro();

            }

        }
    );


    document.addEventListener(
        "admin:profissionais-atualizados",
        async function () {

            const pagina =
                document.querySelector(
                    "#pagina-financeiro"
                );

            if (
                pagina &&
                pagina.classList.contains("ativa")
            ) {

                await carregarFinanceiro();

            }

        }
    );


    window.adminFinanceiro = {
        carregar: carregarFinanceiro
    };

})();