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

    const DIAS = [
        { numero: 0, nome: "Domingo" },
        { numero: 1, nome: "Segunda-feira" },
        { numero: 2, nome: "Terça-feira" },
        { numero: 3, nome: "Quarta-feira" },
        { numero: 4, nome: "Quinta-feira" },
        { numero: 5, nome: "Sexta-feira" },
        { numero: 6, nome: "Sábado" }
    ];

    let horariosCarregados = [];
    let mesCalendario = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
    );

    let excecoesMes = [];
    let agendamentosMes = [];


    let profissionaisExpediente = [];
    let profissionalSelecionadoId = null;
    let seletorProfissionalExpediente = null;

    let primeiraConfiguracaoExpediente = false;

    let listaDiasExpediente;
    let formExpediente;
    let statusExpediente;

    // =========================================================
    // MÚLTIPLOS PROFISSIONAIS
    // =========================================================

    function obterProfissionalSelecionadoId() {
        return profissionalSelecionadoId;
    }

    function obterProfissionalSelecionado() {
        return (
            profissionaisExpediente.find(
                function (profissional) {
                    return (
                        profissional.id ===
                        profissionalSelecionadoId
                    );
                }
            ) || null
        );
    }

    async function carregarProfissionaisExpediente() {
        const barbeariaId =
            obterBarbeariaId();

        const { data, error } =
            await supabaseV2
                .from("profissionais")
                .select("id, nome, telefone, foto_url, ativo")
                .eq("barbearia_id", barbeariaId)
                .eq("ativo", true)
                .order("nome", { ascending: true });

        if (error) {
            console.error(
                "Erro ao carregar profissionais do expediente:",
                error
            );
            throw error;
        }

        profissionaisExpediente =
            data || [];

        if (!profissionaisExpediente.length) {
            profissionalSelecionadoId = null;
            renderizarSeletorProfissional();
            return;
        }

        const selecionadoAindaExiste =
            profissionaisExpediente.some(
                function (profissional) {
                    return (
                        profissional.id ===
                        profissionalSelecionadoId
                    );
                }
            );

        if (!selecionadoAindaExiste) {
            const profissionalAgenda =
                window.adminAgenda &&
                typeof window.adminAgenda.obterProfissionalId ===
                    "function"
                    ? window.adminAgenda.obterProfissionalId()
                    : null;

            const agendaExiste =
                profissionaisExpediente.some(
                    function (profissional) {
                        return (
                            profissional.id ===
                            profissionalAgenda
                        );
                    }
                );

            profissionalSelecionadoId =
                agendaExiste
                    ? profissionalAgenda
                    : profissionaisExpediente[0].id;
        }

        renderizarSeletorProfissional();
    }

    function garantirSeletorProfissional() {
        if (!formExpediente) {
            return;
        }

        seletorProfissionalExpediente =
            document.querySelector(
                "#seletor-profissional-expediente"
            );

        if (seletorProfissionalExpediente) {
            return;
        }

        const cardSemanal =
            formExpediente.closest(
                ".card-expediente-config"
            );

        if (!cardSemanal) {
            return;
        }

        const container =
            document.createElement("div");

        container.id =
            "seletor-profissional-expediente";

        container.className =
            "seletor-profissional-expediente";

        container.innerHTML = `
            <label for="profissional-expediente-admin">
                Profissional
            </label>

            <select id="profissional-expediente-admin">
                <option value="">
                    Carregando profissionais...
                </option>
            </select>
        `;

        const titulo =
            cardSemanal.querySelector(
                "h1, h2, h3"
            );

        if (titulo) {
            titulo.insertAdjacentElement(
                "afterend",
                container
            );
        } else {
            cardSemanal.insertBefore(
                container,
                cardSemanal.firstChild
            );
        }

        seletorProfissionalExpediente =
            container;

        const select =
            container.querySelector(
                "#profissional-expediente-admin"
            );

        select.addEventListener(
            "change",
            async function () {
                profissionalSelecionadoId =
                    select.value || null;

                horariosCarregados = [];
                excecoesMes = [];
                agendamentosMes = [];

                await carregarTudo();
            }
        );
    }

    function renderizarSeletorProfissional() {
        garantirSeletorProfissional();

        if (!seletorProfissionalExpediente) {
            return;
        }

        const select =
            seletorProfissionalExpediente.querySelector(
                "#profissional-expediente-admin"
            );

        if (!select) {
            return;
        }

        if (!profissionaisExpediente.length) {
            select.innerHTML = `
                <option value="">
                    Nenhum profissional ativo
                </option>
            `;
            select.disabled = true;
            return;
        }

        select.disabled = false;

        select.innerHTML =
            profissionaisExpediente
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

    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================

    function iniciar() {
        listaDiasExpediente =
            document.querySelector("#lista-dias-expediente");

        formExpediente =
            document.querySelector("#form-expediente");

        statusExpediente =
            document.querySelector("#status-expediente");

        if (
            !listaDiasExpediente ||
            !formExpediente
        ) {
            return;
        }

        garantirEstilos();
        garantirSeletorProfissional();
        garantirCalendario();
        garantirModal();

        formExpediente.addEventListener(
            "submit",
            salvarExpediente
        );

        document.addEventListener(
            "admin:pagina-aberta",
            function (event) {
                if (
                    event.detail &&
                    event.detail.pagina === "expediente"
                ) {
                    carregarTudo();
                }
            }
        );

        document.addEventListener(
            "admin:autenticado",
            carregarTudo
        );

        carregarTudo();
    }

    // =========================================================
    // ESTILOS
    // =========================================================

    function garantirEstilos() {
        if (
            document.querySelector(
                "#estilos-expediente-calendario"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "estilos-expediente-calendario";

        style.textContent = `
            .seletor-profissional-expediente {
                display: flex;
                flex-direction: column;
                gap: 6px;
                width: min(320px, 100%);
                margin: 12px 0 20px;
            }

            .seletor-profissional-expediente label {
                color: var(--cor-texto-2);
                font-size: 11px;
                font-weight: 800;
            }

            .seletor-profissional-expediente select {
                min-height: 42px;
                padding: 0 12px;
                border: 1px solid var(--cor-borda);
                border-radius: 10px;
                background: var(--cor-superficie-2);
                color: var(--cor-texto);
                font: inherit;
                outline: none;
            }

            .seletor-profissional-expediente select:focus {
                border-color: var(--cor-borda-forte);
            }

            .expediente-calendario-card {
                margin-top: 18px;
                padding: 24px;
                border: 1px solid var(--cor-borda);
                border-radius: var(--raio-lg, 18px);
                background: var(--cor-superficie, #fff);
            }

            .expediente-calendario-topo {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 18px;
            }

            .expediente-calendario-topo h2 {
                margin: 4px 0;
                font-size: 20px;
            }

            .expediente-calendario-topo p {
                margin: 0;
                color: var(--cor-texto-2);
                font-size: 12px;
            }

            .expediente-calendario-navegacao {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .expediente-calendario-navegacao strong {
                min-width: 150px;
                text-align: center;
                font-size: 13px;
            }

            .botao-calendario-expediente {
                width: 36px;
                height: 36px;
                border: 1px solid var(--cor-borda);
                border-radius: 10px;
                background: var(--cor-superficie-2);
                color: var(--cor-texto);
                cursor: pointer;
                font-family: inherit;
                font-weight: 800;
            }

            .calendario-expediente-semana,
            .calendario-expediente-grade {
                display: grid;
                grid-template-columns: repeat(7, minmax(0, 1fr));
                gap: 8px;
            }

            .calendario-expediente-semana {
                margin-bottom: 8px;
            }

            .calendario-expediente-semana span {
                padding: 6px 0;
                color: var(--cor-texto-3);
                font-size: 9px;
                font-weight: 800;
                text-align: center;
                text-transform: uppercase;
            }

            .dia-calendario-expediente {
                position: relative;
                min-height: 88px;
                padding: 9px;
                border: 1px solid var(--cor-borda);
                border-radius: 12px;
                background: var(--cor-superficie-2);
                color: var(--cor-texto);
                text-align: left;
                cursor: pointer;
                transition: .18s;
            }

            .dia-calendario-expediente:hover {
                transform: translateY(-1px);
                border-color: var(--cor-borda-forte);
            }

            .dia-calendario-expediente.vazio {
                visibility: hidden;
                pointer-events: none;
            }

            .dia-calendario-expediente .numero-dia {
                display: block;
                margin-bottom: 7px;
                font-size: 12px;
                font-weight: 900;
            }

            .dia-calendario-expediente .estado-calendario {
                display: block;
                font-size: 9px;
                font-weight: 800;
                line-height: 1.25;
            }

            .dia-calendario-expediente .agenda-calendario {
                display: block;
                margin-top: 6px;
                color: var(--cor-texto-2);
                font-size: 9px;
                line-height: 1.25;
            }

            .dia-calendario-expediente.aberto {
                border-color: rgba(34, 197, 94, .28);
            }

            .dia-calendario-expediente.aberto
            .estado-calendario {
                color: #22c55e;
            }

            .dia-calendario-expediente.fechado {
                border-color: rgba(239, 68, 68, .32);
                background: rgba(239, 68, 68, .06);
            }

            .dia-calendario-expediente.fechado
            .estado-calendario {
                color: #ef4444;
            }

            .dia-calendario-expediente.especial {
                border-color: rgba(245, 158, 11, .35);
                background: rgba(245, 158, 11, .06);
            }

            .dia-calendario-expediente.especial
            .estado-calendario {
                color: #f59e0b;
            }

            .dia-calendario-expediente.sem-expediente
            .estado-calendario {
                color: var(--cor-texto-3);
            }

            .dia-calendario-expediente.tem-agendamento::after {
                content: "";
                position: absolute;
                top: 9px;
                right: 9px;
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #3b82f6;
            }

            .legenda-expediente {
                display: flex;
                flex-wrap: wrap;
                gap: 14px;
                margin-top: 14px;
                color: var(--cor-texto-2);
                font-size: 10px;
            }

            .legenda-expediente span {
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .legenda-expediente i {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                display: inline-block;
            }

            .legenda-aberto { background: #22c55e; }
            .legenda-fechado { background: #ef4444; }
            .legenda-especial { background: #f59e0b; }
            .legenda-agendamento { background: #3b82f6; }

            .modal-expediente-data {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(0, 0, 0, .58);
            }

            .modal-expediente-data.ativo {
                display: flex;
            }

            .modal-expediente-conteudo {
                width: min(520px, 100%);
                max-height: 90vh;
                overflow: auto;
                padding: 24px;
                border: 1px solid var(--cor-borda);
                border-radius: 18px;
                background: var(--cor-superficie, #fff);
                color: var(--cor-texto);
                box-shadow: 0 24px 70px rgba(0,0,0,.26);
            }

            .modal-expediente-topo {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 18px;
            }

            .modal-expediente-topo h3 {
                margin: 3px 0 0;
                font-size: 18px;
            }

            .fechar-modal-expediente {
                width: 34px;
                height: 34px;
                border: 1px solid var(--cor-borda);
                border-radius: 9px;
                background: transparent;
                color: var(--cor-texto);
                cursor: pointer;
                font-size: 18px;
            }

            .opcoes-expediente-data {
                display: grid;
                gap: 9px;
                margin-bottom: 16px;
            }

            .opcao-expediente-data {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px;
                border: 1px solid var(--cor-borda);
                border-radius: 11px;
                background: var(--cor-superficie-2);
                cursor: pointer;
                font-size: 12px;
                font-weight: 700;
            }

            .horario-especial-campos {
                display: none;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin: 14px 0;
            }

            .horario-especial-campos.ativo {
                display: grid;
            }

            .campo-expediente-modal {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .campo-expediente-modal label {
                color: var(--cor-texto-2);
                font-size: 10px;
                font-weight: 800;
            }

            .campo-expediente-modal input {
                min-height: 40px;
                padding: 0 10px;
                border: 1px solid var(--cor-borda);
                border-radius: 9px;
                background: var(--cor-superficie-2);
                color: var(--cor-texto);
                font: inherit;
            }

            .campo-expediente-modal.motivo {
                margin-top: 12px;
            }

            .aviso-agendamentos-expediente {
                display: none;
                margin: 14px 0;
                padding: 11px 12px;
                border: 1px solid rgba(59, 130, 246, .28);
                border-radius: 10px;
                background: rgba(59, 130, 246, .07);
                color: var(--cor-texto);
                font-size: 11px;
                line-height: 1.4;
            }

            .aviso-agendamentos-expediente.ativo {
                display: block;
            }

            .modal-expediente-acoes {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }

            @media (max-width: 760px) {
                .expediente-calendario-topo {
                    align-items: flex-start;
                    flex-direction: column;
                }

                .calendario-expediente-semana,
                .calendario-expediente-grade {
                    gap: 4px;
                }

                .dia-calendario-expediente {
                    min-height: 72px;
                    padding: 6px;
                }

                .dia-calendario-expediente
                .agenda-calendario {
                    display: none;
                }

                .horario-especial-campos {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // =========================================================
    // ESTRUTURA DO CALENDÁRIO
    // =========================================================

    function garantirCalendario() {
        if (
            document.querySelector(
                "#card-calendario-expediente"
            )
        ) {
            return;
        }

        const cardSemanal =
            formExpediente.closest(
                ".card-expediente-config"
            );

        if (!cardSemanal) {
            return;
        }

        const card =
            document.createElement("section");

        card.id =
            "card-calendario-expediente";

        card.className =
            "card-admin expediente-calendario-card";

        card.innerHTML = `
            <div class="expediente-calendario-topo">
                <div>
                    <span class="card-admin-etiqueta">
                        CALENDÁRIO
                    </span>
                    <h2>
                        Calendário de funcionamento
                    </h2>
                    <p>
                        Defina folgas, feriados e horários
                        especiais sem alterar a semana inteira.
                    </p>
                </div>

                <div class="expediente-calendario-navegacao">
                    <button
                        id="expediente-mes-anterior"
                        class="botao-calendario-expediente"
                        type="button"
                        aria-label="Mês anterior"
                    >
                        ‹
                    </button>

                    <strong id="expediente-titulo-mes">
                    </strong>

                    <button
                        id="expediente-proximo-mes"
                        class="botao-calendario-expediente"
                        type="button"
                        aria-label="Próximo mês"
                    >
                        ›
                    </button>
                </div>
            </div>

            <div class="calendario-expediente-semana">
                <span>Dom</span>
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
            </div>

            <div
                id="expediente-grade-calendario"
                class="calendario-expediente-grade"
            ></div>

            <div class="legenda-expediente">
                <span>
                    <i class="legenda-aberto"></i>
                    Aberto
                </span>
                <span>
                    <i class="legenda-fechado"></i>
                    Fechado
                </span>
                <span>
                    <i class="legenda-especial"></i>
                    Horário especial
                </span>
                <span>
                    <i class="legenda-agendamento"></i>
                    Possui agendamento
                </span>
            </div>
        `;

        cardSemanal.insertAdjacentElement(
            "afterend",
            card
        );

        document
            .querySelector(
                "#expediente-mes-anterior"
            )
            .addEventListener(
                "click",
                function () {
                    mesCalendario =
                        new Date(
                            mesCalendario.getFullYear(),
                            mesCalendario.getMonth() - 1,
                            1
                        );

                    carregarCalendario();
                }
            );

        document
            .querySelector(
                "#expediente-proximo-mes"
            )
            .addEventListener(
                "click",
                function () {
                    mesCalendario =
                        new Date(
                            mesCalendario.getFullYear(),
                            mesCalendario.getMonth() + 1,
                            1
                        );

                    carregarCalendario();
                }
            );
    }

    // =========================================================
    // MODAL DE EXCEÇÃO
    // =========================================================

    function garantirModal() {
        if (
            document.querySelector(
                "#modal-expediente-data"
            )
        ) {
            return;
        }

        const modal =
            document.createElement("div");

        modal.id =
            "modal-expediente-data";

        modal.className =
            "modal-expediente-data";

        modal.innerHTML = `
            <div class="modal-expediente-conteudo">
                <div class="modal-expediente-topo">
                    <div>
                        <span class="card-admin-etiqueta">
                            FUNCIONAMENTO
                        </span>
                        <h3 id="expediente-modal-data">
                            Data
                        </h3>
                    </div>

                    <button
                        id="fechar-modal-expediente-data"
                        class="fechar-modal-expediente"
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <form id="form-expediente-data">
                    <input
                        id="expediente-data-selecionada"
                        type="hidden"
                    >

                    <div class="opcoes-expediente-data">
                        <label class="opcao-expediente-data">
                            <input
                                type="radio"
                                name="tipo-expediente-data"
                                value="padrao"
                                checked
                            >
                            Usar expediente semanal
                        </label>

                        <label class="opcao-expediente-data">
                            <input
                                type="radio"
                                name="tipo-expediente-data"
                                value="fechado"
                            >
                            Fechado neste dia
                        </label>

                        <label class="opcao-expediente-data">
                            <input
                                type="radio"
                                name="tipo-expediente-data"
                                value="horario_especial"
                            >
                            Horário especial
                        </label>
                    </div>

                    <div
                        id="horario-especial-campos"
                        class="horario-especial-campos"
                    >
                        <div class="campo-expediente-modal">
                            <label for="expediente-especial-inicio">
                                Início
                            </label>
                            <input
                                id="expediente-especial-inicio"
                                type="time"
                                value="09:00"
                            >
                        </div>

                        <div class="campo-expediente-modal">
                            <label for="expediente-especial-fim">
                                Fim
                            </label>
                            <input
                                id="expediente-especial-fim"
                                type="time"
                                value="18:30"
                            >
                        </div>
                    </div>

                    <div class="campo-expediente-modal motivo">
                        <label for="expediente-motivo">
                            Motivo / observação
                        </label>
                        <input
                            id="expediente-motivo"
                            type="text"
                            maxlength="120"
                            placeholder="Ex.: feriado, consulta, evento..."
                        >
                    </div>

                    <div
                        id="aviso-agendamentos-expediente"
                        class="aviso-agendamentos-expediente"
                    ></div>

                    <div class="modal-expediente-acoes">
                        <button
                            id="cancelar-modal-expediente-data"
                            class="botao-secundario-admin"
                            type="button"
                        >
                            Cancelar
                        </button>

                        <button
                            id="salvar-expediente-data"
                            class="botao-principal-admin"
                            type="submit"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document
            .querySelector(
                "#fechar-modal-expediente-data"
            )
            .addEventListener(
                "click",
                fecharModalData
            );

        document
            .querySelector(
                "#cancelar-modal-expediente-data"
            )
            .addEventListener(
                "click",
                fecharModalData
            );

        modal.addEventListener(
            "click",
            function (event) {
                if (event.target === modal) {
                    fecharModalData();
                }
            }
        );

        modal
            .querySelectorAll(
                'input[name="tipo-expediente-data"]'
            )
            .forEach(
                function (radio) {
                    radio.addEventListener(
                        "change",
                        atualizarCamposModal
                    );
                }
            );

        document
            .querySelector(
                "#form-expediente-data"
            )
            .addEventListener(
                "submit",
                salvarExcecaoData
            );
    }

    // =========================================================
    // EXPEDIENTE SEMANAL
    // =========================================================

    async function carregarTudo() {
        garantirSeletorProfissional();

        if (!profissionaisExpediente.length) {
            try {
                await carregarProfissionaisExpediente();
            } catch (erro) {
                if (listaDiasExpediente) {
                    listaDiasExpediente.innerHTML = `
                        <div class="estado-carregando-admin">
                            Não foi possível carregar os profissionais.
                        </div>
                    `;
                }
                return;
            }
        }

        if (!obterProfissionalSelecionadoId()) {
            if (listaDiasExpediente) {
                listaDiasExpediente.innerHTML = `
                    <div class="estado-carregando-admin">
                        Cadastre ou ative um profissional para configurar o expediente.
                    </div>
                `;
            }

            const grade =
                document.querySelector(
                    "#expediente-grade-calendario"
                );

            if (grade) {
                grade.innerHTML = `
                    <div
                        class="estado-carregando-admin"
                        style="grid-column: 1 / -1;"
                    >
                        Nenhum profissional ativo.
                    </div>
                `;
            }

            return;
        }

        await carregarExpediente();
        await carregarCalendario();
    }

    async function carregarExpediente() {
        if (!listaDiasExpediente) {
            return;
        }

        listaDiasExpediente.innerHTML = `
            <div class="estado-carregando-admin">
                Carregando expediente...
            </div>
        `;

        const { data, error } =
            await supabaseV2
                .from("horarios_profissionais")
                .select(
                    "id, profissional_id, dia_semana, hora_inicio, hora_fim, ativo"
                )
                .eq(
                    "profissional_id",
                    obterProfissionalSelecionadoId()
                )
                .order(
                    "dia_semana",
                    { ascending: true }
                );

        if (error) {
            console.error(
                "Erro ao carregar expediente:",
                error
            );

            listaDiasExpediente.innerHTML = `
                <div class="estado-carregando-admin">
                    Não foi possível carregar o expediente.
                </div>
            `;

            return;
        }

        horariosCarregados = data || [];

        primeiraConfiguracaoExpediente =
            horariosCarregados.length === 0;

        renderizarExpediente();

        if (
            primeiraConfiguracaoExpediente &&
            statusExpediente
        ) {
            statusExpediente.textContent =
                "Configure os dias e horários do primeiro expediente.";
        }
    }

    function renderizarExpediente() {
        listaDiasExpediente.innerHTML = "";

        DIAS.forEach(
            function (dia) {
                const registro =
                    horariosCarregados.find(
                        function (item) {
                            return (
                                Number(item.dia_semana) ===
                                dia.numero
                            );
                        }
                    );

                const ativo =
                    registro
                        ? registro.ativo === true
                        : false;

                const inicio =
                    registro &&
                    registro.hora_inicio
                        ? registro.hora_inicio.slice(0, 5)
                        : "09:00";

                const fim =
                    registro &&
                    registro.hora_fim
                        ? registro.hora_fim.slice(0, 5)
                        : "18:00";

                const linha =
                    document.createElement("div");

                linha.className =
                    "dia-expediente" +
                    (ativo ? " ativo" : "");

                linha.dataset.dia =
                    String(dia.numero);

                linha.innerHTML = `
                    <div class="dia-expediente-identificacao">
                        <label class="switch-expediente">
                            <input
                                class="expediente-ativo"
                                type="checkbox"
                                ${ativo ? "checked" : ""}
                            >
                            <span
                                class="switch-expediente-visual"
                            ></span>
                        </label>

                        <div>
                            <strong>
                                ${dia.nome}
                            </strong>
                            <span class="estado-dia">
                                ${
                                    ativo
                                        ? "Aberto"
                                        : "Fechado"
                                }
                            </span>
                        </div>
                    </div>

                    <div class="horarios-dia">
                        <input
                            class="expediente-inicio"
                            type="time"
                            value="${inicio}"
                            ${ativo ? "" : "disabled"}
                        >

                        <span>até</span>

                        <input
                            class="expediente-fim"
                            type="time"
                            value="${fim}"
                            ${ativo ? "" : "disabled"}
                        >
                    </div>
                `;

                const checkbox =
                    linha.querySelector(
                        ".expediente-ativo"
                    );

                checkbox.addEventListener(
                    "change",
                    function () {
                        const habilitado =
                            checkbox.checked;

                        linha.classList.toggle(
                            "ativo",
                            habilitado
                        );

                        linha.querySelector(
                            ".estado-dia"
                        ).textContent =
                            habilitado
                                ? "Aberto"
                                : "Fechado";

                        linha.querySelector(
                            ".expediente-inicio"
                        ).disabled =
                            !habilitado;

                        linha.querySelector(
                            ".expediente-fim"
                        ).disabled =
                            !habilitado;
                    }
                );

                listaDiasExpediente
                    .appendChild(linha);
            }
        );
    }

    function obterConfiguracaoFormulario() {
        return Array.from(
            listaDiasExpediente.querySelectorAll(
                ".dia-expediente"
            )
        ).map(
            function (linha) {
                return {
                    dia_semana:
                        Number(linha.dataset.dia),

                    ativo:
                        linha.querySelector(
                            ".expediente-ativo"
                        ).checked,

                    hora_inicio:
                        linha.querySelector(
                            ".expediente-inicio"
                        ).value,

                    hora_fim:
                        linha.querySelector(
                            ".expediente-fim"
                        ).value
                };
            }
        );
    }

    async function salvarExpediente(event) {
        event.preventDefault();

        const configuracao =
            obterConfiguracaoFormulario();

        for (const item of configuracao) {
            if (
                item.ativo &&
                (
                    !item.hora_inicio ||
                    !item.hora_fim ||
                    item.hora_fim <=
                        item.hora_inicio
                )
            ) {
                alert(
                    "Confira os horários do expediente. " +
                    "O horário final precisa ser maior " +
                    "que o horário inicial."
                );
                return;
            }
        }

        const conflitos =
            await buscarConflitosExpedienteSemanal(
                configuracao
            );

        if (conflitos === null) {
            return;
        }

        if (conflitos.length > 0) {
            const exemplos =
                conflitos
                    .slice(0, 5)
                    .map(
                        function (item) {
                            return (
                                formatarDataCurta(
                                    new Date(item.inicio)
                                ) +
                                " às " +
                                formatarHora(
                                    new Date(item.inicio)
                                )
                            );
                        }
                    )
                    .join("\n");

            alert(
                "Não foi possível salvar porque a alteração " +
                "afetaria " +
                conflitos.length +
                " agendamento(s) futuro(s).\n\n" +
                exemplos +
                (
                    conflitos.length > 5
                        ? "\n..."
                        : ""
                ) +
                "\n\nAjuste ou cancele esses agendamentos " +
                "antes de fechar/reduzir o expediente."
            );

            return;
        }

        if (statusExpediente) {
            statusExpediente.textContent =
                "Salvando...";
        }

        for (const item of configuracao) {
            const existente =
                horariosCarregados.find(
                    function (registro) {
                        return (
                            Number(
                                registro.dia_semana
                            ) ===
                            item.dia_semana
                        );
                    }
                );

            let resultado;

            if (existente) {
                resultado =
                    await supabaseV2
                        .from(
                            "horarios_profissionais"
                        )
                        .update({
                            hora_inicio:
                                item.hora_inicio,
                            hora_fim:
                                item.hora_fim,
                            ativo:
                                item.ativo
                        })
                        .eq(
                            "id",
                            existente.id
                        )
                        .eq(
                            "profissional_id",
                            obterProfissionalSelecionadoId()
                        );
            } else {
                resultado =
                    await supabaseV2
                        .from(
                            "horarios_profissionais"
                        )
                        .insert({
                            profissional_id:
                                obterProfissionalSelecionadoId(),
                            dia_semana:
                                item.dia_semana,
                            hora_inicio:
                                item.hora_inicio,
                            hora_fim:
                                item.hora_fim,
                            ativo:
                                item.ativo
                        });
            }

            if (resultado.error) {
                console.error(
                    "Erro ao salvar expediente:",
                    resultado.error
                );

                if (statusExpediente) {
                    statusExpediente.textContent =
                        "Erro ao salvar.";
                }

                alert(
                    "Não foi possível salvar o expediente."
                );

                return;
            }
        }

        if (statusExpediente) {
            statusExpediente.textContent =
                "Expediente salvo com sucesso.";
        }

        await carregarExpediente();
        await carregarCalendario();

        document.dispatchEvent(
            new CustomEvent(
                "admin:expediente-atualizado",
                {
                    detail: {
                        barbeariaId:
                            obterBarbeariaId(),

                        profissionalId:
                            obterProfissionalSelecionadoId(),

                        tipo:
                            "semanal",

                        primeiraConfiguracao:
                            primeiraConfiguracaoExpediente
                    }
                }
            )
        );

        if (
            window.adminAgenda &&
            typeof window.adminAgenda.carregar ===
                "function"
        ) {
            window.adminAgenda.carregar();
        }
    }

    async function buscarConflitosExpedienteSemanal(
        configuracao
    ) {
        const agora =
            new Date();

        const limite =
            new Date();

        limite.setFullYear(
            limite.getFullYear() + 1
        );

        const { data, error } =
            await supabaseV2
                .from("agendamentos_v2")
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
                .gte(
                    "inicio",
                    agora.toISOString()
                )
                .lte(
                    "inicio",
                    limite.toISOString()
                )
                .neq(
                    "status",
                    "cancelado"
                );

        if (error) {
            console.error(
                "Erro ao verificar conflitos:",
                error
            );

            alert(
                "Não foi possível verificar os " +
                "agendamentos futuros. Nenhuma " +
                "alteração foi salva."
            );

            return null;
        }

        return (data || []).filter(
            function (agendamento) {
                const inicio =
                    new Date(
                        agendamento.inicio
                    );

                const fim =
                    new Date(
                        agendamento.fim
                    );

                const regra =
                    configuracao.find(
                        function (item) {
                            return (
                                item.dia_semana ===
                                inicio.getDay()
                            );
                        }
                    );

                if (!regra || !regra.ativo) {
                    return true;
                }

                const horaInicio =
                    formatarHora24(inicio);

                const horaFim =
                    formatarHora24(fim);

                return (
                    horaInicio <
                        regra.hora_inicio ||
                    horaFim >
                        regra.hora_fim
                );
            }
        );
    }

    // =========================================================
    // CALENDÁRIO
    // =========================================================

    async function carregarCalendario() {
        const grade =
            document.querySelector(
                "#expediente-grade-calendario"
            );

        if (!grade) {
            return;
        }

        const inicioMes =
            new Date(
                mesCalendario.getFullYear(),
                mesCalendario.getMonth(),
                1
            );

        const fimMes =
            new Date(
                mesCalendario.getFullYear(),
                mesCalendario.getMonth() + 1,
                0,
                23,
                59,
                59,
                999
            );

        const inicioTexto =
            formatarDataBanco(inicioMes);

        const fimTexto =
            formatarDataBanco(fimMes);

        grade.innerHTML = `
            <div
                class="estado-carregando-admin"
                style="grid-column: 1 / -1;"
            >
                Carregando calendário...
            </div>
        `;

        const [
            resultadoExcecoes,
            resultadoAgendamentos
        ] =
            await Promise.all([
                supabaseV2
                    .from(
                        "excecoes_expediente"
                    )
                    .select(
                        "id, data, tipo, hora_inicio, hora_fim, motivo"
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
                        "data",
                        inicioTexto
                    )
                    .lte(
                        "data",
                        fimTexto
                    ),

                supabaseV2
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
                    .gte(
                        "inicio",
                        inicioMes.toISOString()
                    )
                    .lte(
                        "inicio",
                        fimMes.toISOString()
                    )
                    .neq(
                        "status",
                        "cancelado"
                    )
            ]);

        if (
            resultadoExcecoes.error ||
            resultadoAgendamentos.error
        ) {
            console.error(
                "Erro ao carregar calendário:",
                {
                    excecoes:
                        resultadoExcecoes.error,
                    agendamentos:
                        resultadoAgendamentos.error
                }
            );

            grade.innerHTML = `
                <div
                    class="estado-carregando-admin"
                    style="grid-column: 1 / -1;"
                >
                    Não foi possível carregar o calendário.
                </div>
            `;

            return;
        }

        excecoesMes =
            resultadoExcecoes.data || [];

        agendamentosMes =
            resultadoAgendamentos.data || [];

        renderizarCalendario();
    }

    function renderizarCalendario() {
        const grade =
            document.querySelector(
                "#expediente-grade-calendario"
            );

        const titulo =
            document.querySelector(
                "#expediente-titulo-mes"
            );

        if (!grade || !titulo) {
            return;
        }

        titulo.textContent =
            mesCalendario.toLocaleDateString(
                "pt-BR",
                {
                    month: "long",
                    year: "numeric"
                }
            );

        titulo.textContent =
            titulo.textContent
                .charAt(0)
                .toUpperCase() +
            titulo.textContent.slice(1);

        grade.innerHTML = "";

        const ano =
            mesCalendario.getFullYear();

        const mes =
            mesCalendario.getMonth();

        const primeiroDia =
            new Date(ano, mes, 1);

        const quantidadeDias =
            new Date(
                ano,
                mes + 1,
                0
            ).getDate();

        for (
            let vazio = 0;
            vazio < primeiroDia.getDay();
            vazio++
        ) {
            const espaco =
                document.createElement("div");

            espaco.className =
                "dia-calendario-expediente vazio";

            grade.appendChild(espaco);
        }

        for (
            let numero = 1;
            numero <= quantidadeDias;
            numero++
        ) {
            const data =
                new Date(
                    ano,
                    mes,
                    numero
                );

            const dataBanco =
                formatarDataBanco(data);

            const excecao =
                excecoesMes.find(
                    function (item) {
                        return (
                            item.data ===
                            dataBanco
                        );
                    }
                );

            const agendamentos =
                agendamentosMes.filter(
                    function (item) {
                        return (
                            formatarDataBanco(
                                new Date(
                                    item.inicio
                                )
                            ) ===
                            dataBanco
                        );
                    }
                );

            const regraSemanal =
                horariosCarregados.find(
                    function (item) {
                        return (
                            Number(
                                item.dia_semana
                            ) ===
                            data.getDay()
                        );
                    }
                );

            const botao =
                document.createElement(
                    "button"
                );

            botao.type = "button";

            let classe =
                "sem-expediente";

            let estado =
                "Sem expediente";

            if (excecao) {
                if (
                    excecao.tipo ===
                    "fechado"
                ) {
                    classe =
                        "fechado";
                    estado =
                        "Fechado";
                } else {
                    classe =
                        "especial";
                    estado =
                        (
                            excecao.hora_inicio
                                ? excecao.hora_inicio.slice(
                                    0,
                                    5
                                )
                                : "--:--"
                        ) +
                        "–" +
                        (
                            excecao.hora_fim
                                ? excecao.hora_fim.slice(
                                    0,
                                    5
                                )
                                : "--:--"
                        );
                }
            } else if (
                regraSemanal &&
                regraSemanal.ativo === true
            ) {
                classe =
                    "aberto";

                estado =
                    regraSemanal.hora_inicio.slice(
                        0,
                        5
                    ) +
                    "–" +
                    regraSemanal.hora_fim.slice(
                        0,
                        5
                    );
            }

            botao.className =
                "dia-calendario-expediente " +
                classe +
                (
                    agendamentos.length
                        ? " tem-agendamento"
                        : ""
                );

            botao.dataset.data =
                dataBanco;

            botao.innerHTML = `
                <span class="numero-dia">
                    ${numero}
                </span>

                <span class="estado-calendario">
                    ${estado}
                </span>

                <span class="agenda-calendario">
                    ${
                        agendamentos.length
                            ? agendamentos.length +
                              " agendamento(s)"
                            : "Sem agendamentos"
                    }
                </span>
            `;

            botao.addEventListener(
                "click",
                function () {
                    abrirModalData(
                        dataBanco
                    );
                }
            );

            grade.appendChild(botao);
        }
    }

    // =========================================================
    // MODAL - ABRIR / SALVAR
    // =========================================================

    function abrirModalData(dataBanco) {
        const modal =
            document.querySelector(
                "#modal-expediente-data"
            );

        const inputData =
            document.querySelector(
                "#expediente-data-selecionada"
            );

        const titulo =
            document.querySelector(
                "#expediente-modal-data"
            );

        const motivo =
            document.querySelector(
                "#expediente-motivo"
            );

        const inicio =
            document.querySelector(
                "#expediente-especial-inicio"
            );

        const fim =
            document.querySelector(
                "#expediente-especial-fim"
            );

        const excecao =
            excecoesMes.find(
                function (item) {
                    return (
                        item.data ===
                        dataBanco
                    );
                }
            );

        const data =
            criarDataLocal(
                dataBanco
            );

        const regraSemanal =
            horariosCarregados.find(
                function (item) {
                    return (
                        Number(
                            item.dia_semana
                        ) ===
                        data.getDay()
                    );
                }
            );

        inputData.value =
            dataBanco;

        titulo.textContent =
            data.toLocaleDateString(
                "pt-BR",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );

        titulo.textContent =
            titulo.textContent
                .charAt(0)
                .toUpperCase() +
            titulo.textContent.slice(1);

        let tipo =
            "padrao";

        if (excecao) {
            tipo =
                excecao.tipo;

            motivo.value =
                excecao.motivo || "";

            if (
                excecao.hora_inicio
            ) {
                inicio.value =
                    excecao.hora_inicio.slice(
                        0,
                        5
                    );
            }

            if (
                excecao.hora_fim
            ) {
                fim.value =
                    excecao.hora_fim.slice(
                        0,
                        5
                    );
            }
        } else {
            motivo.value = "";

            if (
                regraSemanal &&
                regraSemanal.hora_inicio
            ) {
                inicio.value =
                    regraSemanal.hora_inicio.slice(
                        0,
                        5
                    );
            } else {
                inicio.value =
                    "09:00";
            }

            if (
                regraSemanal &&
                regraSemanal.hora_fim
            ) {
                fim.value =
                    regraSemanal.hora_fim.slice(
                        0,
                        5
                    );
            } else {
                fim.value =
                    "18:30";
            }
        }

        const radio =
            document.querySelector(
                'input[name="tipo-expediente-data"][value="' +
                tipo +
                '"]'
            );

        if (radio) {
            radio.checked = true;
        }

        atualizarCamposModal();
        atualizarAvisoAgendamentos(
            dataBanco
        );

        modal.classList.add(
            "ativo"
        );
    }

    function fecharModalData() {
        const modal =
            document.querySelector(
                "#modal-expediente-data"
            );

        if (modal) {
            modal.classList.remove(
                "ativo"
            );
        }
    }

    function atualizarCamposModal() {
        const selecionado =
            document.querySelector(
                'input[name="tipo-expediente-data"]:checked'
            );

        const campos =
            document.querySelector(
                "#horario-especial-campos"
            );

        if (!selecionado || !campos) {
            return;
        }

        campos.classList.toggle(
            "ativo",
            selecionado.value ===
                "horario_especial"
        );
    }

    function atualizarAvisoAgendamentos(
        dataBanco
    ) {
        const aviso =
            document.querySelector(
                "#aviso-agendamentos-expediente"
            );

        const agendamentos =
            agendamentosMes.filter(
                function (item) {
                    return (
                        formatarDataBanco(
                            new Date(
                                item.inicio
                            )
                        ) ===
                        dataBanco
                    );
                }
            );

        if (!agendamentos.length) {
            aviso.classList.remove(
                "ativo"
            );

            aviso.textContent = "";
            return;
        }

        aviso.classList.add(
            "ativo"
        );

        aviso.textContent =
            "Atenção: existem " +
            agendamentos.length +
            " agendamento(s) nesta data. " +
            "O sistema não permitirá fechar ou " +
            "reduzir o horário se algum deles " +
            "ficar fora do expediente.";
    }

    async function salvarExcecaoData(event) {
        event.preventDefault();

        const dataBanco =
            document.querySelector(
                "#expediente-data-selecionada"
            ).value;

        const tipo =
            document.querySelector(
                'input[name="tipo-expediente-data"]:checked'
            ).value;

        const motivo =
            document.querySelector(
                "#expediente-motivo"
            ).value.trim();

        const inicio =
            document.querySelector(
                "#expediente-especial-inicio"
            ).value;

        const fim =
            document.querySelector(
                "#expediente-especial-fim"
            ).value;

        if (
            tipo === "horario_especial" &&
            (
                !inicio ||
                !fim ||
                fim <= inicio
            )
        ) {
            alert(
                "Informe um horário especial válido."
            );

            return;
        }

        const agendamentos =
            agendamentosMes.filter(
                function (item) {
                    return (
                        formatarDataBanco(
                            new Date(
                                item.inicio
                            )
                        ) ===
                        dataBanco
                    );
                }
            );

        if (
            tipo === "fechado" &&
            agendamentos.length > 0
        ) {
            alert(
                "Este dia possui " +
                agendamentos.length +
                " agendamento(s). " +
                "Cancele ou remaneje esses " +
                "agendamentos antes de fechar a data."
            );

            return;
        }

        if (
            tipo === "horario_especial"
        ) {
            const conflitos =
                agendamentos.filter(
                    function (item) {
                        const horaInicio =
                            formatarHora24(
                                new Date(
                                    item.inicio
                                )
                            );

                        const horaFim =
                            formatarHora24(
                                new Date(
                                    item.fim
                                )
                            );

                        return (
                            horaInicio < inicio ||
                            horaFim > fim
                        );
                    }
                );

            if (conflitos.length > 0) {
                alert(
                    "O novo horário deixaria " +
                    conflitos.length +
                    " agendamento(s) fora do " +
                    "expediente. Remaneje esses " +
                    "clientes primeiro."
                );

                return;
            }
        }

        const botao =
            document.querySelector(
                "#salvar-expediente-data"
            );

        botao.disabled = true;
        botao.textContent =
            "Salvando...";

        let resultado;

        if (tipo === "padrao") {
            resultado =
                await supabaseV2
                    .from(
                        "excecoes_expediente"
                    )
                    .delete()
                    .eq(
                        "barbearia_id",
                        obterBarbeariaId()
                    )
                    .eq(
                        "profissional_id",
                        obterProfissionalSelecionadoId()
                    )
                    .eq(
                        "data",
                        dataBanco
                    );
        } else {
            resultado =
                await supabaseV2
                    .from(
                        "excecoes_expediente"
                    )
                    .upsert(
                        {
                            barbearia_id:
                                obterBarbeariaId(),
                            profissional_id:
                                obterProfissionalSelecionadoId(),
                            data:
                                dataBanco,
                            tipo:
                                tipo,
                            hora_inicio:
                                tipo ===
                                "horario_especial"
                                    ? inicio
                                    : null,
                            hora_fim:
                                tipo ===
                                "horario_especial"
                                    ? fim
                                    : null,
                            motivo:
                                motivo || null
                        },
                        {
                            onConflict:
                                "profissional_id,data"
                        }
                    );
        }

        botao.disabled = false;
        botao.textContent =
            "Salvar";

        if (resultado.error) {
            console.error(
                "Erro ao salvar exceção:",
                resultado.error
            );

            alert(
                "Não foi possível salvar esta alteração."
            );

            return;
        }

        fecharModalData();
        await carregarCalendario();

        document.dispatchEvent(
            new CustomEvent(
                "admin:expediente-atualizado",
                {
                    detail: {
                        barbeariaId:
                            obterBarbeariaId(),

                        profissionalId:
                            obterProfissionalSelecionadoId(),

                        tipo:
                            "excecao",

                        data:
                            dataBanco
                    }
                }
            )
        );

        if (
            window.adminAgenda &&
            typeof window.adminAgenda.carregar ===
                "function"
        ) {
            window.adminAgenda.carregar();
        }
    }

    // =========================================================
    // FORMATADORES
    // =========================================================

    function formatarDataBanco(data) {
        const ano =
            data.getFullYear();

        const mes =
            String(
                data.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                data.getDate()
            ).padStart(2, "0");

        return (
            ano +
            "-" +
            mes +
            "-" +
            dia
        );
    }

    function criarDataLocal(dataBanco) {
        const partes =
            dataBanco
                .split("-")
                .map(Number);

        return new Date(
            partes[0],
            partes[1] - 1,
            partes[2],
            12,
            0,
            0,
            0
        );
    }

    function formatarHora24(data) {
        return (
            String(
                data.getHours()
            ).padStart(2, "0") +
            ":" +
            String(
                data.getMinutes()
            ).padStart(2, "0")
        );
    }

    function formatarHora(data) {
        return data.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }

    function formatarDataCurta(data) {
        return data.toLocaleDateString(
            "pt-BR"
        );
    }

    // =========================================================
    // API
    // =========================================================

    document.addEventListener(
        "saas:contexto-carregado",
        async function () {

            const pagina =
                document.querySelector(
                    "#pagina-expediente"
                );

            if (
                pagina &&
                pagina.classList.contains("ativa")
            ) {

                await carregarTudo();

            }

        }
    );


    document.addEventListener(
        "admin:servicos-atualizados",
        async function () {

            const pagina =
                document.querySelector(
                    "#pagina-expediente"
                );

            if (
                pagina &&
                pagina.classList.contains("ativa")
            ) {
                await carregarTudo();
            }
        }
    );


    document.addEventListener(
        "admin:profissionais-atualizados",
        async function () {
            try {
                await carregarProfissionaisExpediente();
                await carregarTudo();
            } catch (erro) {
                console.error(
                    "Erro ao atualizar profissionais do expediente:",
                    erro
                );
            }
        }
    );


    window.adminExpediente = {
        carregar:
            carregarTudo,

        carregarCalendario:
            carregarCalendario,

        obterProfissionalId:
            function () {
                return obterProfissionalSelecionadoId();
            },

        obterProfissional:
            function () {
                return obterProfissionalSelecionado();
            },

        estaNaPrimeiraConfiguracao:
            function () {
                return primeiraConfiguracaoExpediente;
            },

        possuiExpedienteConfigurado:
            function () {
                return horariosCarregados.some(
                    function (item) {
                        return item.ativo === true;
                    }
                );
            },

        recarregarProfissionais:
            async function () {
                await carregarProfissionaisExpediente();
                await carregarTudo();
            }
    };

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );
    } else {
        iniciar();
    }
})();
