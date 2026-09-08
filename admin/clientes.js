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

    let clientesCarregados = [];

    let eventosConfigurados = false;

    let carregandoClientes = false;


    // =====================================================
    // ELEMENTOS
    // =====================================================

    let listaClientes;

    let totalClientes;

    let clientesMes;

    let clientesNovos;

    let buscaCliente;


    // =====================================================
    // BUSCAR ELEMENTOS
    // =====================================================

    function buscarElementos() {

        listaClientes =
            document.querySelector(
                "#lista-clientes"
            );

        totalClientes =
            document.querySelector(
                "#total-clientes"
            );

        clientesMes =
            document.querySelector(
                "#clientes-mes"
            );

        clientesNovos =
            document.querySelector(
                "#clientes-novos"
            );

        buscaCliente =
            document.querySelector(
                "#busca-cliente"
            );

    }


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


    function formatarData(data) {

        if (!data) {
            return "—";
        }


        return new Date(
            data
        ).toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    }


    function obterIniciais(nome) {

        if (!nome) {
            return "?";
        }


        const partes =
            nome
                .trim()
                .split(/\s+/);


        if (
            partes.length === 1
        ) {

            return partes[0]
                .substring(
                    0,
                    2
                )
                .toUpperCase();

        }


        return (
            partes[0][0] +
            partes[
                partes.length - 1
            ][0]
        ).toUpperCase();

    }


    function formatarWhatsapp(
        whatsapp
    ) {

        const numeros =
            String(
                whatsapp || ""
            ).replace(
                /\D/g,
                ""
            );


        if (
            numeros.length === 11
        ) {

            return (
                `(${numeros.slice(0, 2)}) ` +
                `${numeros.slice(2, 7)}-` +
                `${numeros.slice(7)}`
            );

        }


        if (
            numeros.length === 10
        ) {

            return (
                `(${numeros.slice(0, 2)}) ` +
                `${numeros.slice(2, 6)}-` +
                `${numeros.slice(6)}`
            );

        }


        return whatsapp || "—";

    }


    function formatarDataHora(data) {

        if (!data) {
            return "—";
        }

        return new Date(data).toLocaleString(
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


    function formatarStatus(status) {

        const nomes = {
            agendado: "Agendado",
            confirmado: "Confirmado",
            concluido: "Concluído",
            cancelado: "Cancelado"
        };

        return nomes[status] || status || "—";

    }


    function escaparHtml(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // =====================================================
    // MODAL / FICHA DO CLIENTE
    // =====================================================

    function garantirModalCliente() {

        if (document.querySelector("#modal-ficha-cliente")) {
            return;
        }


        const style =
            document.createElement("style");

        style.id =
            "estilos-ficha-cliente";

        style.textContent = `
            .modal-ficha-cliente {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 24px;
                background: rgba(0, 0, 0, 0.68);
                backdrop-filter: blur(5px);
            }

            .modal-ficha-cliente.ativo {
                display: flex;
            }

            .ficha-cliente-caixa {
                width: min(760px, 100%);
                max-height: 88vh;
                overflow: auto;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 22px;
                background: #17181c;
                color: #f5f5f5;
                box-shadow: 0 24px 80px rgba(0,0,0,.45);
            }

            .ficha-cliente-topo {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 20px;
                padding: 24px 26px;
                border-bottom: 1px solid rgba(255,255,255,.08);
            }

            .ficha-cliente-topo small {
                display: block;
                margin-bottom: 6px;
                color: #ef4444;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: .16em;
                text-transform: uppercase;
            }

            .ficha-cliente-topo h2 {
                margin: 0;
                font-size: 25px;
            }

            .ficha-cliente-fechar {
                width: 38px;
                height: 38px;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 10px;
                background: #202126;
                color: #fff;
                font-size: 22px;
                cursor: pointer;
            }

            .ficha-cliente-conteudo {
                padding: 24px 26px 28px;
            }

            .ficha-cliente-resumo {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                margin-bottom: 26px;
            }

            .ficha-cliente-info {
                padding: 15px 16px;
                border: 1px solid rgba(255,255,255,.08);
                border-radius: 14px;
                background: #1d1e23;
            }

            .ficha-cliente-info span {
                display: block;
                margin-bottom: 6px;
                color: #8f929b;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
            }

            .ficha-cliente-info strong {
                font-size: 15px;
            }

            .ficha-cliente-historico-titulo {
                margin: 0 0 14px;
                font-size: 18px;
            }

            .historico-cliente-lista {
                display: grid;
                gap: 12px;
            }

            .historico-cliente-item {
                padding: 16px;
                border: 1px solid rgba(255,255,255,.08);
                border-radius: 14px;
                background: #1d1e23;
            }

            .historico-cliente-cabecalho {
                display: flex;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 10px;
            }

            .historico-cliente-status {
                font-size: 12px;
                font-weight: 800;
            }

            .historico-cliente-status.status-agendado,
            .historico-cliente-status.status-confirmado {
                color: #60a5fa;
            }

            .historico-cliente-status.status-concluido {
                color: #4ade80;
            }

            .historico-cliente-status.status-cancelado {
                color: #f87171;
            }

            .historico-cliente-servicos {
                color: #b8bac2;
                font-size: 13px;
                line-height: 1.55;
            }

            .historico-cliente-valor {
                margin-top: 10px;
                font-weight: 800;
            }

            .ficha-cliente-vazio {
                padding: 22px;
                border: 1px dashed rgba(255,255,255,.12);
                border-radius: 14px;
                color: #8f929b;
                text-align: center;
            }

            @media (max-width: 620px) {
                .modal-ficha-cliente {
                    padding: 12px;
                }

                .ficha-cliente-resumo {
                    grid-template-columns: 1fr;
                }

                .ficha-cliente-topo,
                .ficha-cliente-conteudo {
                    padding-left: 18px;
                    padding-right: 18px;
                }
            }
        `;

        document.head.appendChild(style);


        const modal =
            document.createElement("div");

        modal.id =
            "modal-ficha-cliente";

        modal.className =
            "modal-ficha-cliente";

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        modal.innerHTML = `
            <div
                class="ficha-cliente-caixa"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ficha-cliente-nome"
            >
                <div class="ficha-cliente-topo">
                    <div>
                        <small>Ficha do cliente</small>
                        <h2 id="ficha-cliente-nome">Cliente</h2>
                    </div>

                    <button
                        class="ficha-cliente-fechar"
                        type="button"
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </div>

                <div
                    id="ficha-cliente-conteudo"
                    class="ficha-cliente-conteudo"
                ></div>
            </div>
        `;

        document.body.appendChild(modal);


        modal
            .querySelector(".ficha-cliente-fechar")
            .addEventListener(
                "click",
                fecharFichaCliente
            );


        modal.addEventListener(
            "click",
            function (event) {

                if (event.target === modal) {
                    fecharFichaCliente();
                }

            }
        );

    }


    function fecharFichaCliente() {

        const modal =
            document.querySelector(
                "#modal-ficha-cliente"
            );

        if (!modal) {
            return;
        }

        modal.classList.remove("ativo");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    async function abrirFichaCliente(cliente) {

        garantirModalCliente();


        const modal =
            document.querySelector(
                "#modal-ficha-cliente"
            );

        const nome =
            document.querySelector(
                "#ficha-cliente-nome"
            );

        const conteudo =
            document.querySelector(
                "#ficha-cliente-conteudo"
            );


        nome.textContent =
            cliente.nome || "Cliente";

        conteudo.innerHTML = `
            <div class="ficha-cliente-vazio">
                Carregando histórico...
            </div>
        `;

        modal.classList.add("ativo");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        try {

            const {
                data: agendamentos,
                error: erroAgendamentos
            } =
                await supabaseV2
                    .from("agendamentos_v2")
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
                        "cliente_id",
                        cliente.id
                    )
                    .order(
                        "inicio",
                        {
                            ascending: false
                        }
                    );


            if (erroAgendamentos) {
                throw erroAgendamentos;
            }


            const listaAgendamentos =
                agendamentos || [];

            const idsAgendamentos =
                listaAgendamentos.map(
                    function (item) {
                        return item.id;
                    }
                );


            let servicos = [];


            if (idsAgendamentos.length) {

                const {
                    data,
                    error
                } =
                    await supabaseV2
                        .from("agendamento_servicos")
                        .select(
                            `
                            agendamento_id,
                            nome_servico,
                            preco,
                            duracao_minutos
                            `
                        )
                        .in(
                            "agendamento_id",
                            idsAgendamentos
                        );


                if (error) {
                    throw error;
                }


                servicos =
                    data || [];

            }


            const historicoHtml =
                listaAgendamentos.length
                    ? listaAgendamentos
                        .map(
                            function (agendamento) {

                                const servicosDoAgendamento =
                                    servicos.filter(
                                        function (servico) {

                                            return (
                                                String(servico.agendamento_id) ===
                                                String(agendamento.id)
                                            );

                                        }
                                    );


                                const servicosHtml =
                                    servicosDoAgendamento.length
                                        ? servicosDoAgendamento
                                            .map(
                                                function (servico) {

                                                    return `
                                                        <div>
                                                            ${escaparHtml(servico.nome_servico || "Serviço")}
                                                            · ${Number(servico.duracao_minutos || 0)} min
                                                            · ${formatarDinheiro(servico.preco)}
                                                        </div>
                                                    `;

                                                }
                                            )
                                            .join("")
                                        : `
                                            <div>
                                                Serviço não informado
                                            </div>
                                        `;


                                return `
                                    <article class="historico-cliente-item">

                                        <div class="historico-cliente-cabecalho">

                                            <strong>
                                                ${formatarDataHora(agendamento.inicio)}
                                            </strong>

                                            <span
                                                class="historico-cliente-status status-${escaparHtml(agendamento.status || "agendado")}"
                                            >
                                                ${escaparHtml(formatarStatus(agendamento.status))}
                                            </span>

                                        </div>

                                        <div class="historico-cliente-servicos">
                                            ${servicosHtml}
                                        </div>

                                        <div class="historico-cliente-valor">
                                            Total: ${formatarDinheiro(agendamento.valor_total)}
                                        </div>

                                    </article>
                                `;

                            }
                        )
                        .join("")
                    : `
                        <div class="ficha-cliente-vazio">
                            Este cliente ainda não possui agendamentos.
                        </div>
                    `;


            conteudo.innerHTML = `

                <div class="ficha-cliente-resumo">

                    <div class="ficha-cliente-info">
                        <span>WhatsApp</span>
                        <strong>
                            ${escaparHtml(formatarWhatsapp(cliente.whatsapp))}
                        </strong>
                    </div>

                    <div class="ficha-cliente-info">
                        <span>Cliente desde</span>
                        <strong>
                            ${formatarData(cliente.created_at)}
                        </strong>
                    </div>

                    <div class="ficha-cliente-info">
                        <span>Visitas concluídas</span>
                        <strong>
                            ${Number(cliente.visitas || 0)}
                        </strong>
                    </div>

                    <div class="ficha-cliente-info">
                        <span>Total gasto</span>
                        <strong>
                            ${formatarDinheiro(cliente.total_gasto)}
                        </strong>
                    </div>

                    <div class="ficha-cliente-info">
                        <span>Último atendimento</span>
                        <strong>
                            ${formatarData(cliente.ultimo_atendimento)}
                        </strong>
                    </div>

                </div>

                <h3 class="ficha-cliente-historico-titulo">
                    Histórico de agendamentos
                </h3>

                <div class="historico-cliente-lista">
                    ${historicoHtml}
                </div>
            `;


        } catch (erro) {

            console.error(
                "Erro ao carregar ficha do cliente:",
                erro
            );

            conteudo.innerHTML = `
                <div class="ficha-cliente-vazio">
                    Não foi possível carregar o histórico deste cliente.
                </div>
            `;

        }

    }


    // =====================================================
    // CARREGAR CLIENTES
    // =====================================================

    async function carregarClientes() {

        if (
            carregandoClientes ||
            !listaClientes
        ) {
            return;
        }


        carregandoClientes =
            true;


        listaClientes.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="clientes-vazio"
                >
                    Carregando clientes...
                </td>
            </tr>
        `;


        try {

            const [
                resultadoClientes,
                resultadoAgendamentos
            ] =
                await Promise.all([


                    supabaseV2
                        .from(
                            "clientes_v2"
                        )
                        .select(
                            `
                            id,
                            nome,
                            whatsapp,
                            created_at
                            `
                        )
                        .eq(
                            "barbearia_id",
                            obterBarbeariaId()
                        )
                        .order(
                            "nome",
                            {
                                ascending:
                                    true
                            }
                        ),


                    supabaseV2
                        .from(
                            "agendamentos_v2"
                        )
                        .select(
                            `
                            id,
                            cliente_id,
                            inicio,
                            status,
                            valor_total
                            `
                        )
                        .eq(
                            "barbearia_id",
                            obterBarbeariaId()
                        )

                ]);


            if (
                resultadoClientes.error ||
                resultadoAgendamentos.error
            ) {

                console.error(
                    "Erro ao carregar clientes:",
                    {
                        clientes:
                            resultadoClientes.error,

                        agendamentos:
                            resultadoAgendamentos.error
                    }
                );


                listaClientes.innerHTML = `
                    <tr>
                        <td
                            colspan="6"
                            class="clientes-vazio"
                        >
                            Não foi possível carregar os clientes.
                        </td>
                    </tr>
                `;

                return;

            }


            const clientes =
                resultadoClientes.data ||
                [];

            const agendamentos =
                resultadoAgendamentos.data ||
                [];


            montarClientes(
                clientes,
                agendamentos
            );


        } catch (erro) {

            console.error(
                "Erro inesperado ao carregar clientes:",
                erro
            );


            listaClientes.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="clientes-vazio"
                    >
                        Não foi possível carregar os clientes.
                    </td>
                </tr>
            `;


        } finally {

            carregandoClientes =
                false;

        }

    }


    // =====================================================
    // MONTAR DADOS
    // =====================================================

    function montarClientes(
        clientes,
        agendamentos
    ) {

        const agora =
            new Date();

        const anoAtual =
            agora.getFullYear();

        const mesAtual =
            agora.getMonth();


        const concluidos =
            agendamentos.filter(
                function (
                    agendamento
                ) {

                    return (
                        agendamento.status ===
                        "concluido"
                    );

                }
            );


        clientesCarregados =
            clientes.map(
                function (cliente) {

                    const atendimentosCliente =
                        concluidos
                            .filter(
                                function (
                                    agendamento
                                ) {

                                    return (
                                        String(
                                            agendamento.cliente_id
                                        ) ===
                                        String(
                                            cliente.id
                                        )
                                    );

                                }
                            )
                            .sort(
                                function (
                                    a,
                                    b
                                ) {

                                    return (
                                        new Date(
                                            b.inicio
                                        ) -
                                        new Date(
                                            a.inicio
                                        )
                                    );

                                }
                            );


                    const totalGasto =
                        atendimentosCliente
                            .reduce(
                                function (
                                    total,
                                    agendamento
                                ) {

                                    return (
                                        total +
                                        Number(
                                            agendamento.valor_total ||
                                            0
                                        )
                                    );

                                },
                                0
                            );


                    const ultimoAtendimento =
                        atendimentosCliente.length
                            ? atendimentosCliente[0].inicio
                            : null;


                    return {

                        ...cliente,

                        visitas:
                            atendimentosCliente.length,

                        total_gasto:
                            totalGasto,

                        ultimo_atendimento:
                            ultimoAtendimento

                    };

                }
            );


        // =================================================
        // RESUMO
        // =================================================

        totalClientes.textContent =
            clientesCarregados.length;


        const novosNesteMes =
            clientes.filter(
                function (cliente) {

                    const data =
                        new Date(
                            cliente.created_at
                        );


                    return (
                        data.getFullYear() ===
                            anoAtual &&
                        data.getMonth() ===
                            mesAtual
                    );

                }
            );


        clientesNovos.textContent =
            novosNesteMes.length;


        const idsAtendidosMes =
            new Set();


        concluidos.forEach(
            function (
                agendamento
            ) {

                const data =
                    new Date(
                        agendamento.inicio
                    );


                if (
                    data.getFullYear() ===
                        anoAtual &&
                    data.getMonth() ===
                        mesAtual
                ) {

                    idsAtendidosMes.add(
                        String(
                            agendamento.cliente_id
                        )
                    );

                }

            }
        );


        clientesMes.textContent =
            idsAtendidosMes.size;


        renderizarClientes(
            clientesCarregados
        );

    }


    // =====================================================
    // RENDERIZAR CLIENTES
    // =====================================================

    function renderizarClientes(
        clientes
    ) {

        if (!listaClientes) {
            return;
        }


        listaClientes.innerHTML =
            "";


        if (!clientes.length) {

            listaClientes.innerHTML = `
                <tr>

                    <td
                        colspan="6"
                        class="clientes-vazio"
                    >
                        Nenhum cliente encontrado.
                    </td>

                </tr>
            `;

            return;

        }


        clientes.forEach(
            function (cliente) {

                const linha =
                    document.createElement(
                        "tr"
                    );


                linha.innerHTML = `

                    <td>

                        <div class="cliente-identificacao">

                            <div class="cliente-avatar">
                                ${obterIniciais(
                                    cliente.nome
                                )}
                            </div>

                            <div>

                                <strong>
                                    ${cliente.nome || "Cliente"}
                                </strong>

                                <span>
                                    Cliente
                                </span>

                            </div>

                        </div>

                    </td>


                    <td>

                        <span class="cliente-whatsapp">

                            ${formatarWhatsapp(
                                cliente.whatsapp
                            )}

                        </span>

                    </td>


                    <td>

                        <span class="cliente-visitas">

                            ${cliente.visitas}

                        </span>

                    </td>


                    <td>

                        ${formatarData(
                            cliente.ultimo_atendimento
                        )}

                    </td>


                    <td>

                        <span class="cliente-total">

                            ${formatarDinheiro(
                                cliente.total_gasto
                            )}

                        </span>

                    </td>


                    <td>

                        <button
                            class="botao-ver-cliente"
                            type="button"
                            data-id="${cliente.id}"
                        >
                            Ver
                        </button>

                    </td>

                `;


                listaClientes.appendChild(
                    linha
                );

            }
        );

    }


    // =====================================================
    // BUSCA
    // =====================================================

    function filtrarClientes() {

        if (!buscaCliente) {
            return;
        }


        const termo =
            buscaCliente
                .value
                .trim()
                .toLowerCase();


        if (!termo) {

            renderizarClientes(
                clientesCarregados
            );

            return;

        }


        const termoNumerico =
            termo.replace(
                /\D/g,
                ""
            );


        const filtrados =
            clientesCarregados.filter(
                function (cliente) {

                    const nome =
                        String(
                            cliente.nome ||
                            ""
                        ).toLowerCase();


                    const whatsapp =
                        String(
                            cliente.whatsapp ||
                            ""
                        );


                    const whatsappNumerico =
                        whatsapp.replace(
                            /\D/g,
                            ""
                        );


                    return (
                        nome.includes(
                            termo
                        ) ||
                        whatsapp
                            .toLowerCase()
                            .includes(
                                termo
                            ) ||
                        (
                            termoNumerico &&
                            whatsappNumerico.includes(
                                termoNumerico
                            )
                        )
                    );

                }
            );


        renderizarClientes(
            filtrados
        );

    }


    // =====================================================
    // EVENTOS
    // =====================================================

    function configurarEventos() {

        if (
            eventosConfigurados
        ) {
            return;
        }


        eventosConfigurados =
            true;


        if (buscaCliente) {

            buscaCliente.addEventListener(
                "input",
                filtrarClientes
            );

        }


        if (listaClientes) {

            listaClientes.addEventListener(
                "click",
                function (event) {

                    const botao =
                        event.target.closest(
                            ".botao-ver-cliente"
                        );


                    if (!botao) {
                        return;
                    }


                    const cliente =
                        clientesCarregados.find(
                            function (item) {

                                return (
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        botao.dataset.id
                                    )
                                );

                            }
                        );


                    if (!cliente) {
                        return;
                    }


                    abrirFichaCliente(
                        cliente
                    );

                }
            );

        }


        document.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Escape") {
                    fecharFichaCliente();
                }

            }
        );

    }


    // =====================================================
    // INICIAR MÓDULO
    // =====================================================

    function iniciarClientes() {

        buscarElementos();

        configurarEventos();

    }


    // =====================================================
    // EVENTOS DO ADMIN
    // =====================================================

    document.addEventListener(
        "admin:pagina-aberta",
        async function (event) {

            if (
                event.detail?.pagina !==
                "clientes"
            ) {
                return;
            }


            iniciarClientes();


            await carregarClientes();

        }
    );


    document.addEventListener(
        "saas:contexto-carregado",
        async function () {

            const pagina =
                document.querySelector(
                    "#pagina-clientes"
                );

            if (
                pagina &&
                pagina.classList.contains("ativa")
            ) {

                iniciarClientes();
                await carregarClientes();

            }

        }
    );


    // =====================================================
    // API
    // =====================================================

    window.adminClientes = {

        carregar:
            carregarClientes,

        obterClientes:
            function () {

                return [
                    ...clientesCarregados
                ];

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
            iniciarClientes
        );

    } else {

        iniciarClientes();

    }

})();