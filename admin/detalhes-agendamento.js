(function () {

    "use strict";


    const BARBEARIA_ID =
        "53b67b8e-f037-4371-b9e2-3de1d911d092";


    let modal = null;

    let agendamentoAtual = null;


    // =====================================================
    // FORMATADORES
    // =====================================================

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


    function formatarDataHora(dataString) {

        if (!dataString) {

            return "—";

        }


        return new Date(
            dataString
        ).toLocaleString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    function formatarHora(dataString) {

        if (!dataString) {

            return "—";

        }


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


    function formatarWhatsapp(numero) {

        const digitos =
            String(
                numero || ""
            ).replace(
                /\D/g,
                ""
            );


        if (
            digitos.length === 11
        ) {

            return (
                `(${digitos.slice(0, 2)}) ` +
                `${digitos.slice(2, 7)}-` +
                digitos.slice(7)
            );

        }


        if (
            digitos.length === 10
        ) {

            return (
                `(${digitos.slice(0, 2)}) ` +
                `${digitos.slice(2, 6)}-` +
                digitos.slice(6)
            );

        }


        return numero || "—";

    }


    function formatarStatus(status) {

        const nomes = {

            agendado:
                "Agendado",

            confirmado:
                "Confirmado",

            concluido:
                "Concluído",

            cancelado:
                "Cancelado"

        };


        return nomes[status] ||
            status ||
            "—";

    }


    // =====================================================
    // CSS DO MODAL
    // =====================================================

    function adicionarEstilos() {

        if (
            document.querySelector(
                "#estilos-detalhes-agendamento"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "estilos-detalhes-agendamento";


        style.textContent = `

            .modal-detalhes-agendamento-overlay {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 24px;
                background: rgba(0, 0, 0, .68);
                backdrop-filter: blur(5px);
            }

            .modal-detalhes-agendamento-overlay.ativo {
                display: flex;
            }

            .modal-detalhes-agendamento-card {
                width: min(560px, 100%);
                max-height: 90vh;
                overflow-y: auto;
                padding: 26px;
                border: 1px solid var(--cor-borda);
                border-radius: 20px;
                background: var(--cor-superficie);
                color: var(--cor-texto);
                box-shadow: 0 30px 80px rgba(0,0,0,.35);
            }

            .detalhes-agendamento-topo {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 20px;
                margin-bottom: 24px;
            }

            .detalhes-agendamento-topo h2 {
                margin: 6px 0 0;
                font-size: 25px;
                letter-spacing: -.6px;
            }

            .detalhes-agendamento-fechar {
                width: 40px;
                height: 40px;
                flex: 0 0 40px;
                border: 1px solid var(--cor-borda);
                border-radius: 10px;
                background: var(--cor-superficie-2);
                color: var(--cor-texto);
                cursor: pointer;
                font-size: 20px;
            }

            .detalhes-agendamento-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                margin-bottom: 18px;
            }

            .detalhes-agendamento-item {
                padding: 14px;
                border: 1px solid var(--cor-borda);
                border-radius: 12px;
                background: var(--cor-superficie-2);
            }

            .detalhes-agendamento-item span {
                display: block;
                margin-bottom: 6px;
                color: var(--cor-texto-3);
                font-size: 8px;
                font-weight: 900;
                letter-spacing: .8px;
                text-transform: uppercase;
            }

            .detalhes-agendamento-item strong {
                display: block;
                color: var(--cor-texto);
                font-size: 13px;
                line-height: 1.4;
            }

            .detalhes-agendamento-servicos {
                margin-top: 18px;
                padding: 18px;
                border: 1px solid var(--cor-borda);
                border-radius: 14px;
                background: var(--cor-superficie-2);
            }

            .detalhes-agendamento-servicos h3 {
                margin: 0 0 12px;
                font-size: 15px;
            }

            .detalhes-agendamento-servico {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                padding: 11px 0;
                border-bottom: 1px solid var(--cor-borda);
            }

            .detalhes-agendamento-servico:last-child {
                border-bottom: 0;
            }

            .detalhes-agendamento-servico div {
                min-width: 0;
            }

            .detalhes-agendamento-servico strong {
                display: block;
                font-size: 12px;
            }

            .detalhes-agendamento-servico small {
                color: var(--cor-texto-2);
                font-size: 10px;
            }

            .detalhes-agendamento-total {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                margin-top: 18px;
                padding-top: 16px;
                border-top: 1px solid var(--cor-borda);
            }

            .detalhes-agendamento-total span {
                color: var(--cor-texto-2);
                font-size: 11px;
            }

            .detalhes-agendamento-total strong {
                font-size: 21px;
            }

            .detalhes-agendamento-status {
                min-height: 20px;
                margin-top: 16px;
                color: var(--cor-texto-2);
                font-size: 11px;
            }

            .detalhes-agendamento-acoes {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }

            .detalhes-agendamento-cancelar,
            .detalhes-agendamento-concluir {
                min-height: 44px;
                padding: 0 17px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 800;
            }

            .detalhes-agendamento-cancelar {
                border: 1px solid var(--cor-borda);
                background: var(--cor-superficie-2);
                color: var(--cor-texto-2);
            }

            .detalhes-agendamento-concluir {
                border: 0;
                background: #df1d28;
                color: #fff;
            }

            .detalhes-agendamento-cancelar:disabled,
            .detalhes-agendamento-concluir:disabled {
                opacity: .45;
                cursor: not-allowed;
            }

            @media (max-width: 620px) {

                .detalhes-agendamento-grid {
                    grid-template-columns: 1fr;
                }

                .detalhes-agendamento-acoes {
                    flex-direction: column-reverse;
                }

                .detalhes-agendamento-cancelar,
                .detalhes-agendamento-concluir {
                    width: 100%;
                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    // =====================================================
    // CRIAR MODAL
    // =====================================================

    function criarModal() {

        if (modal) {

            return;

        }


        adicionarEstilos();


        modal =
            document.createElement(
                "div"
            );


        modal.className =
            "modal-detalhes-agendamento-overlay";


        modal.innerHTML = `

            <section
                class="modal-detalhes-agendamento-card"
                role="dialog"
                aria-modal="true"
            >

                <header
                    class="detalhes-agendamento-topo"
                >

                    <div>

                        <span
                            class="admin-etiqueta"
                        >
                            ATENDIMENTO
                        </span>

                        <h2>
                            Detalhes do agendamento
                        </h2>

                    </div>


                    <button
                        class="detalhes-agendamento-fechar"
                        type="button"
                        aria-label="Fechar"
                    >
                        ×
                    </button>

                </header>


                <div
                    id="detalhes-agendamento-conteudo"
                >

                    <p
                        class="texto-secundario-admin"
                    >
                        Carregando informações...
                    </p>

                </div>


                <p
                    id="detalhes-agendamento-status"
                    class="detalhes-agendamento-status"
                    aria-live="polite"
                ></p>


                <footer
                    class="detalhes-agendamento-acoes"
                >

                    <button
                        id="detalhes-agendamento-cancelar"
                        class="detalhes-agendamento-cancelar"
                        type="button"
                    >
                        Cancelar agendamento
                    </button>


                    <button
                        id="detalhes-agendamento-concluir"
                        class="detalhes-agendamento-concluir"
                        type="button"
                    >
                        Concluir atendimento
                    </button>

                </footer>

            </section>

        `;


        document.body.appendChild(
            modal
        );


        modal
            .querySelector(
                ".detalhes-agendamento-fechar"
            )
            .addEventListener(
                "click",
                fecharModal
            );


        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    modal
                ) {

                    fecharModal();

                }

            }
        );


        modal
            .querySelector(
                "#detalhes-agendamento-concluir"
            )
            .addEventListener(
                "click",
                concluirAgendamento
            );


        modal
            .querySelector(
                "#detalhes-agendamento-cancelar"
            )
            .addEventListener(
                "click",
                cancelarAgendamento
            );

    }


    function fecharModal() {

        if (!modal) {

            return;

        }


        modal.classList.remove(
            "ativo"
        );


        agendamentoAtual =
            null;

    }


    // =====================================================
    // CARREGAR DETALHES
    // =====================================================

    async function abrirAgendamento(
        agendamentoId
    ) {

        criarModal();


        const conteudo =
            modal.querySelector(
                "#detalhes-agendamento-conteudo"
            );


        const statusMensagem =
            modal.querySelector(
                "#detalhes-agendamento-status"
            );


        const botaoConcluir =
            modal.querySelector(
                "#detalhes-agendamento-concluir"
            );


        const botaoCancelar =
            modal.querySelector(
                "#detalhes-agendamento-cancelar"
            );


        statusMensagem.textContent =
            "";


        botaoConcluir.disabled =
            true;

        botaoCancelar.disabled =
            true;


        conteudo.innerHTML = `

            <p
                class="texto-secundario-admin"
            >
                Carregando informações...
            </p>

        `;


        modal.classList.add(
            "ativo"
        );


        try {

            const {
                data: agendamento,
                error: erroAgendamento
            } =
                await supabaseV2
                    .from(
                        "agendamentos_v2"
                    )
                    .select(`
                        id,
                        cliente_id,
                        inicio,
                        fim,
                        status,
                        valor_total,
                        observacoes
                    `)
                    .eq(
                        "barbearia_id",
                        BARBEARIA_ID
                    )
                    .eq(
                        "id",
                        agendamentoId
                    )
                    .single();


            if (erroAgendamento) {

                console.error(
                    "Erro ao carregar agendamento:",
                    erroAgendamento
                );

                throw new Error(
                    "Não foi possível carregar o agendamento."
                );

            }


            const [
                resultadoCliente,
                resultadoServicos
            ] =
                await Promise.all([


                    supabaseV2
                        .from(
                            "clientes_v2"
                        )
                        .select(`
                            id,
                            nome,
                            whatsapp
                        `)
                        .eq(
                            "id",
                            agendamento.cliente_id
                        )
                        .single(),


                    supabaseV2
                        .from(
                            "agendamento_servicos"
                        )
                        .select(`
                            id,
                            nome_servico,
                            preco,
                            duracao_minutos,
                            adicional
                        `)
                        .eq(
                            "agendamento_id",
                            agendamento.id
                        )
                        .order(
                            "nome_servico",
                            {
                                ascending:
                                    true
                            }
                        )

                ]);


            if (
                resultadoCliente.error
            ) {

                console.error(
                    "Erro ao carregar cliente:",
                    resultadoCliente.error
                );

            }


            if (
                resultadoServicos.error
            ) {

                console.error(
                    "Erro ao carregar serviços do agendamento:",
                    resultadoServicos.error
                );

            }


            const cliente =
                resultadoCliente.data ||
                {
                    nome:
                        "Cliente não encontrado",

                    whatsapp:
                        ""
                };


            const servicos =
                resultadoServicos.data ||
                [];


            agendamentoAtual = {

                ...agendamento,

                cliente,

                servicos

            };


            renderizarDetalhes();


        } catch (erro) {

            console.error(
                "Erro nos detalhes do agendamento:",
                erro
            );


            conteudo.innerHTML = `

                <p
                    class="texto-secundario-admin"
                >
                    ${
                        erro.message ||
                        "Não foi possível carregar os detalhes."
                    }
                </p>

            `;

        }

    }


    // =====================================================
    // RENDERIZAR
    // =====================================================

    function renderizarDetalhes() {

        if (
            !agendamentoAtual ||
            !modal
        ) {

            return;

        }


        const conteudo =
            modal.querySelector(
                "#detalhes-agendamento-conteudo"
            );


        const botaoConcluir =
            modal.querySelector(
                "#detalhes-agendamento-concluir"
            );


        const botaoCancelar =
            modal.querySelector(
                "#detalhes-agendamento-cancelar"
            );


        const agendamento =
            agendamentoAtual;


        const cliente =
            agendamento.cliente;


        const servicos =
            agendamento.servicos;


        const listaServicos =
            servicos.length

                ? servicos
                    .map(
                        function (
                            servico
                        ) {

                            return `

                                <div
                                    class="detalhes-agendamento-servico"
                                >

                                    <div>

                                        <strong>
                                            ${
                                                servico.nome_servico ||
                                                "Serviço"
                                            }
                                        </strong>

                                        <small>
                                            ${
                                                Number(
                                                    servico.duracao_minutos ||
                                                    0
                                                )
                                            } min
                                        </small>

                                    </div>


                                    <strong>
                                        ${
                                            formatarDinheiro(
                                                servico.preco
                                            )
                                        }
                                    </strong>

                                </div>

                            `;

                        }
                    )
                    .join("")

                : `

                    <p
                        class="texto-secundario-admin"
                    >
                        Nenhum serviço encontrado.
                    </p>

                `;


        conteudo.innerHTML = `

            <div
                class="detalhes-agendamento-grid"
            >

                <div
                    class="detalhes-agendamento-item"
                >
                    <span>
                        Cliente
                    </span>

                    <strong>
                        ${
                            cliente.nome ||
                            "—"
                        }
                    </strong>
                </div>


                <div
                    class="detalhes-agendamento-item"
                >
                    <span>
                        WhatsApp
                    </span>

                    <strong>
                        ${
                            formatarWhatsapp(
                                cliente.whatsapp
                            )
                        }
                    </strong>
                </div>


                <div
                    class="detalhes-agendamento-item"
                >
                    <span>
                        Data
                    </span>

                    <strong>
                        ${
                            formatarDataHora(
                                agendamento.inicio
                            )
                        }
                    </strong>
                </div>


                <div
                    class="detalhes-agendamento-item"
                >
                    <span>
                        Horário
                    </span>

                    <strong>
                        ${
                            formatarHora(
                                agendamento.inicio
                            )
                        }
                        até
                        ${
                            formatarHora(
                                agendamento.fim
                            )
                        }
                    </strong>
                </div>


                <div
                    class="detalhes-agendamento-item"
                >
                    <span>
                        Status
                    </span>

                    <strong>
                        ${
                            formatarStatus(
                                agendamento.status
                            )
                        }
                    </strong>
                </div>


                <div
                    class="detalhes-agendamento-item"
                >
                    <span>
                        Valor
                    </span>

                    <strong>
                        ${
                            formatarDinheiro(
                                agendamento.valor_total
                            )
                        }
                    </strong>
                </div>

            </div>


            <section
                class="detalhes-agendamento-servicos"
            >

                <h3>
                    Serviços
                </h3>

                ${listaServicos}


                <div
                    class="detalhes-agendamento-total"
                >

                    <span>
                        Total do atendimento
                    </span>

                    <strong>
                        ${
                            formatarDinheiro(
                                agendamento.valor_total
                            )
                        }
                    </strong>

                </div>

            </section>

        `;


        const finalizado =
            agendamento.status ===
                "concluido" ||
            agendamento.status ===
                "cancelado";


        botaoConcluir.disabled =
            finalizado;


        botaoCancelar.disabled =
            finalizado;


        if (
            agendamento.status ===
            "concluido"
        ) {

            botaoConcluir.textContent =
                "Atendimento concluído";

        } else {

            botaoConcluir.textContent =
                "Concluir atendimento";

        }


        if (
            agendamento.status ===
            "cancelado"
        ) {

            botaoCancelar.textContent =
                "Agendamento cancelado";

        } else {

            botaoCancelar.textContent =
                "Cancelar agendamento";

        }

    }


    // =====================================================
    // ATUALIZAR MÓDULOS
    // =====================================================

    async function atualizarPainel() {

        const tarefas =
            [];


        if (
            window.adminAgenda &&
            typeof window
                .adminAgenda
                .carregar ===
                "function"
        ) {

            tarefas.push(
                window
                    .adminAgenda
                    .carregar()
            );

        }


        if (
            window.adminFinanceiro &&
            typeof window
                .adminFinanceiro
                .carregar ===
                "function"
        ) {

            tarefas.push(
                window
                    .adminFinanceiro
                    .carregar()
            );

        }


        if (
            window.adminClientes &&
            typeof window
                .adminClientes
                .carregar ===
                "function"
        ) {

            tarefas.push(
                window
                    .adminClientes
                    .carregar()
            );

        }


        if (
            window.adminVisaoGeral &&
            typeof window
                .adminVisaoGeral
                .carregar ===
                "function"
        ) {

            tarefas.push(
                window
                    .adminVisaoGeral
                    .carregar()
            );

        }


        if (
            tarefas.length
        ) {

            await Promise.allSettled(
                tarefas
            );

        }

    }


    // =====================================================
    // CONCLUIR
    // =====================================================

    async function concluirAgendamento() {

        if (
            !agendamentoAtual
        ) {

            return;

        }


        const confirmou =
            window.confirm(
                "Confirmar que este atendimento foi concluído?"
            );


        if (!confirmou) {

            return;

        }


        const statusMensagem =
            modal.querySelector(
                "#detalhes-agendamento-status"
            );


        const botao =
            modal.querySelector(
                "#detalhes-agendamento-concluir"
            );


        botao.disabled =
            true;


        botao.textContent =
            "Concluindo...";


        statusMensagem.textContent =
            "Atualizando atendimento...";


        try {

            const {
                error
            } =
                await supabaseV2
                    .from(
                        "agendamentos_v2"
                    )
                    .update({
                        status:
                            "concluido"
                    })
                    .eq(
                        "barbearia_id",
                        BARBEARIA_ID
                    )
                    .eq(
                        "id",
                        agendamentoAtual.id
                    );


            if (error) {

                console.error(
                    "Erro ao concluir atendimento:",
                    error
                );

                throw new Error(
                    "Não foi possível concluir o atendimento."
                );

            }


            agendamentoAtual.status =
                "concluido";


            renderizarDetalhes();


            statusMensagem.textContent =
                "Atendimento concluído com sucesso.";


            await atualizarPainel();


        } catch (erro) {

            console.error(
                erro
            );


            statusMensagem.textContent =
                erro.message ||
                "Não foi possível concluir o atendimento.";


            botao.disabled =
                false;


            botao.textContent =
                "Concluir atendimento";

        }

    }


    // =====================================================
    // CANCELAR
    // =====================================================

    async function cancelarAgendamento() {

        if (
            !agendamentoAtual
        ) {

            return;

        }


        const confirmou =
            window.confirm(
                "Tem certeza que deseja cancelar este agendamento?"
            );


        if (!confirmou) {

            return;

        }


        const statusMensagem =
            modal.querySelector(
                "#detalhes-agendamento-status"
            );


        const botao =
            modal.querySelector(
                "#detalhes-agendamento-cancelar"
            );


        botao.disabled =
            true;


        botao.textContent =
            "Cancelando...";


        statusMensagem.textContent =
            "Cancelando agendamento...";


        try {

            const {
                error
            } =
                await supabaseV2
                    .from(
                        "agendamentos_v2"
                    )
                    .update({
                        status:
                            "cancelado"
                    })
                    .eq(
                        "barbearia_id",
                        BARBEARIA_ID
                    )
                    .eq(
                        "id",
                        agendamentoAtual.id
                    );


            if (error) {

                console.error(
                    "Erro ao cancelar agendamento:",
                    error
                );

                throw new Error(
                    "Não foi possível cancelar o agendamento."
                );

            }


            agendamentoAtual.status =
                "cancelado";


            renderizarDetalhes();


            statusMensagem.textContent =
                "Agendamento cancelado com sucesso.";


            await atualizarPainel();


        } catch (erro) {

            console.error(
                erro
            );


            statusMensagem.textContent =
                erro.message ||
                "Não foi possível cancelar o agendamento.";


            botao.disabled =
                false;


            botao.textContent =
                "Cancelar agendamento";

        }

    }


    // =====================================================
    // CAPTURAR CLIQUE DA AGENDA
    // =====================================================

    document.addEventListener(
        "click",
        function (event) {

            const item =
                event.target.closest(
                    ".evento-agenda-visual.agendamento"
                );


            if (!item) {

                return;

            }


            const id =
                item.dataset
                    .agendamentoId;


            if (!id) {

                return;

            }


            /*
             * O agenda.js ainda possui temporariamente
             * aquele alert de teste.
             *
             * Capturamos o clique antes dele chegar
             * ao card para impedir esse alert.
             */

            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            abrirAgendamento(
                id
            );

        },
        true
    );


    // =====================================================
    // ESC
    // =====================================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                    "Escape" &&
                modal &&
                modal.classList
                    .contains(
                        "ativo"
                    )
            ) {

                fecharModal();

            }

        }
    );


    // =====================================================
    // API
    // =====================================================

    window.adminDetalhesAgendamento = {

        abrir:
            abrirAgendamento

    };


})();