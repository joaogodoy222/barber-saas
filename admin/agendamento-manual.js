(function () {

    "use strict";
    const botaoNovoAgendamento =
        document.querySelector(
            "#botao-novo-agendamento"
        );

    const modal =
        document.querySelector(
            "#modal-agendamento-manual"
        );

    const botaoFechar =
        document.querySelector(
            "#fechar-modal-agendamento-manual"
        );

    const botaoCancelar =
        document.querySelector(
            "#cancelar-agendamento-manual"
        );

    const form =
        document.querySelector(
            "#form-agendamento-manual"
        );

    const inputNome =
        document.querySelector(
            "#agendamento-cliente-nome"
        );

    const inputWhatsapp =
        document.querySelector(
            "#agendamento-cliente-whatsapp"
        );

    const inputData =
        document.querySelector(
            "#agendamento-manual-data"
        );

    const inputHora =
        document.querySelector(
            "#agendamento-manual-hora"
        );

    const listaServicos =
        document.querySelector(
            "#agendamento-manual-servicos"
        );

    const resumoTexto =
        document.querySelector(
            "#agendamento-manual-resumo-texto"
        );

    const status =
        document.querySelector(
            "#agendamento-manual-status"
        );

    const botaoSalvar =
        document.querySelector(
            "#salvar-agendamento-manual"
        );


    let servicosDisponiveis = [];
    let clientesDisponiveis = [];
    let clienteSelecionado = null;
    let inputBuscaServico = null;
    let sugestoesCliente = null;
    let avisoCliente = null;

    let profissionaisDisponiveis = [];
    let profissionalSelecionadoId = null;
    let selectProfissional = null;


    if (
        !botaoNovoAgendamento ||
        !modal ||
        !form
    ) {
        console.warn(
            "Agendamento manual: elementos do modal não encontrados."
        );
        return;
    }


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


    function obterProfissionalSelecionadoId() {

        return (
            profissionalSelecionadoId ||
            null
        );
    }


    async function carregarProfissionais() {

        const { data, error } =
            await supabaseV2
                .from("profissionais")
                .select(
                    "id, nome, telefone, foto_url, ativo"
                )
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

        if (error) {

            console.error(
                "Erro ao carregar profissionais:",
                error
            );

            profissionaisDisponiveis =
                [];

            throw error;
        }


        profissionaisDisponiveis =
            data || [];


        const profissionalAgenda =
            window.adminAgenda &&
            typeof window.adminAgenda.obterProfissionalId ===
                "function"
                ? window.adminAgenda.obterProfissionalId()
                : null;


        const agendaExiste =
            profissionaisDisponiveis.some(
                function (profissional) {

                    return (
                        profissional.id ===
                        profissionalAgenda
                    );
                }
            );


        const atualExiste =
            profissionaisDisponiveis.some(
                function (profissional) {

                    return (
                        profissional.id ===
                        profissionalSelecionadoId
                    );
                }
            );


        if (!atualExiste) {

            profissionalSelecionadoId =
                agendaExiste
                    ? profissionalAgenda
                    : (
                        profissionaisDisponiveis[0]?.id ||
                        null
                    );
        }


        renderizarSeletorProfissional();
    }


    function garantirSeletorProfissional() {

        if (
            document.querySelector(
                "#agendamento-manual-profissional"
            )
        ) {

            selectProfissional =
                document.querySelector(
                    "#agendamento-manual-profissional"
                );

            return;
        }


        const blocoData =
            inputData?.closest(
                ".campos-duplos"
            );


        if (!blocoData) {
            return;
        }


        const campo =
            document.createElement(
                "div"
            );

        campo.className =
            "campo-admin";

        campo.innerHTML = `
            <label for="agendamento-manual-profissional">
                Profissional
            </label>

            <select
                id="agendamento-manual-profissional"
                required
            >
                <option value="">
                    Carregando profissionais...
                </option>
            </select>
        `;


        blocoData.insertAdjacentElement(
            "beforebegin",
            campo
        );


        selectProfissional =
            campo.querySelector(
                "#agendamento-manual-profissional"
            );


        selectProfissional.addEventListener(
            "change",
            async function () {

                profissionalSelecionadoId =
                    selectProfissional.value ||
                    null;


                servicosDisponiveis =
                    [];


                resumoTexto.textContent =
                    "Selecione pelo menos um serviço.";


                if (inputBuscaServico) {

                    inputBuscaServico.value =
                        "";

                }


                await carregarServicos();

            }
        );
    }


    function renderizarSeletorProfissional() {

        garantirSeletorProfissional();


        if (!selectProfissional) {
            return;
        }


        if (!profissionaisDisponiveis.length) {

            selectProfissional.innerHTML = `
                <option value="">
                    Nenhum profissional ativo
                </option>
            `;

            selectProfissional.disabled =
                true;

            profissionalSelecionadoId =
                null;

            return;
        }


        selectProfissional.disabled =
            false;


        selectProfissional.innerHTML =
            profissionaisDisponiveis
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
                                ${escaparHtml(
                                    profissional.nome
                                )}
                            </option>
                        `;
                    }
                )
                .join("");
    }


    function formatarDataInput(data) {

        const ano = data.getFullYear();

        const mes =
            String(data.getMonth() + 1)
                .padStart(2, "0");

        const dia =
            String(data.getDate())
                .padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }


    function formatarDinheiro(valor) {

        return Number(valor || 0)
            .toLocaleString(
                "pt-BR",
                {
                    style: "currency",
                    currency: "BRL"
                }
            );
    }


    function somenteDigitos(valor) {

        return String(valor || "")
            .replace(/\D/g, "");
    }


    function mascararWhatsapp(valor) {

        const numero =
            somenteDigitos(valor)
                .slice(0, 11);

        if (numero.length <= 2) {

            return numero.length
                ? `(${numero}`
                : "";
        }


        if (numero.length <= 7) {

            return (
                `(${numero.slice(0, 2)}) ` +
                numero.slice(2)
            );
        }


        return (
            `(${numero.slice(0, 2)}) ` +
            `${numero.slice(2, 7)}-` +
            numero.slice(7)
        );
    }


    function minutosParaTexto(minutos) {

        const horas =
            Math.floor(minutos / 60);

        const resto =
            minutos % 60;

        if (!horas) {
            return `${resto} min`;
        }

        if (!resto) {
            return `${horas}h`;
        }

        return `${horas}h ${resto}min`;
    }


    function normalizarTexto(valor) {

        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }


    function escaparHtml(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function prepararMelhoriasModal() {

        if (
            document.querySelector(
                "#estilos-agendamento-inteligente"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");

        style.id =
            "estilos-agendamento-inteligente";

        style.textContent = `
            #agendamento-manual-profissional {
                width: 100%;
                min-height: 42px;
                padding: 0 12px;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 10px;
                background: rgba(255,255,255,.04);
                color: inherit;
                outline: none;
                font: inherit;
            }

            #agendamento-manual-profissional:focus {
                border-color: rgba(239,68,68,.65);
            }

            .agendamento-busca-servico {
                width: 100%;
                margin: 8px 0 12px;
                padding: 12px 14px;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 10px;
                background: rgba(255,255,255,.04);
                color: inherit;
                outline: none;
            }

            .agendamento-busca-servico:focus {
                border-color: rgba(239,68,68,.65);
            }

            .agendamento-sugestoes-cliente {
                display: none;
                margin-top: 10px;
                border: 1px solid rgba(255,255,255,.10);
                border-radius: 12px;
                overflow: hidden;
                background: #1d1e23;
            }

            .agendamento-sugestoes-cliente.ativo {
                display: block;
            }

            .agendamento-sugestao-cliente {
                width: 100%;
                display: flex;
                justify-content: space-between;
                gap: 16px;
                padding: 12px 14px;
                border: 0;
                border-bottom: 1px solid rgba(255,255,255,.07);
                background: transparent;
                color: inherit;
                text-align: left;
                cursor: pointer;
            }

            .agendamento-sugestao-cliente:last-child {
                border-bottom: 0;
            }

            .agendamento-sugestao-cliente:hover {
                background: rgba(255,255,255,.05);
            }

            .agendamento-sugestao-cliente span {
                color: #9ca3af;
                font-size: 12px;
            }

            .agendamento-aviso-cliente {
                min-height: 22px;
                margin: 8px 0 2px;
                font-size: 12px;
                font-weight: 700;
            }

            .agendamento-aviso-cliente.existente {
                color: #4ade80;
            }

            .agendamento-aviso-cliente.novo {
                color: #fbbf24;
            }

            .agendamento-servico-oculto {
                display: none !important;
            }
        `;

        document.head.appendChild(style);


        garantirSeletorProfissional();


        inputBuscaServico =
            document.createElement("input");

        inputBuscaServico.type =
            "search";

        inputBuscaServico.id =
            "agendamento-busca-servico";

        inputBuscaServico.className =
            "agendamento-busca-servico";

        inputBuscaServico.placeholder =
            "Buscar serviço...";

        inputBuscaServico.autocomplete =
            "off";


        listaServicos.parentElement.insertBefore(
            inputBuscaServico,
            listaServicos
        );


        const blocoCliente =
            inputNome.closest(
                ".campos-duplos"
            );


        if (blocoCliente) {

            avisoCliente =
                document.createElement("p");

            avisoCliente.id =
                "agendamento-aviso-cliente";

            avisoCliente.className =
                "agendamento-aviso-cliente";

            avisoCliente.setAttribute(
                "aria-live",
                "polite"
            );


            sugestoesCliente =
                document.createElement("div");

            sugestoesCliente.id =
                "agendamento-sugestoes-cliente";

            sugestoesCliente.className =
                "agendamento-sugestoes-cliente";


            blocoCliente.insertAdjacentElement(
                "afterend",
                avisoCliente
            );

            avisoCliente.insertAdjacentElement(
                "afterend",
                sugestoesCliente
            );
        }


        inputBuscaServico.addEventListener(
            "input",
            filtrarServicos
        );


        inputNome.addEventListener(
            "input",
            function () {

                validarClienteSelecionado();

                atualizarSugestoesCliente(
                    "nome"
                );
            }
        );


        if (sugestoesCliente) {

            sugestoesCliente.addEventListener(
                "click",
                function (event) {

                    const botao =
                        event.target.closest(
                            "[data-cliente-id]"
                        );

                    if (!botao) {
                        return;
                    }


                    const cliente =
                        clientesDisponiveis.find(
                            function (item) {

                                return (
                                    String(item.id) ===
                                    String(
                                        botao.dataset.clienteId
                                    )
                                );
                            }
                        );


                    if (cliente) {
                        selecionarCliente(
                            cliente
                        );
                    }
                }
            );
        }
    }


    function renderizarServicos() {

        if (!servicosDisponiveis.length) {

            listaServicos.innerHTML = `
                <p class="texto-secundario-admin">
                    Nenhum serviço ativo disponível.
                </p>
            `;

            return;
        }


        listaServicos.innerHTML =
            servicosDisponiveis.map(
                function (servico) {

                    return `
                        <label
                            class="opcao-checkbox"
                            data-servico-nome="${escaparHtml(
                                normalizarTexto(
                                    servico.nome
                                )
                            )}"
                        >

                            <input
                                type="checkbox"
                                value="${servico.id}"
                            >

                            <span>
                                <strong>
                                    ${escaparHtml(servico.nome)}
                                </strong>

                                — ${formatarDinheiro(
                                    servico.preco
                                )}

                                • ${Number(
                                    servico.duracao_minutos
                                )} min
                            </span>

                        </label>
                    `;
                }
            ).join("");


        listaServicos
            .querySelectorAll(
                'input[type="checkbox"]'
            )
            .forEach(
                function (input) {

                    input.addEventListener(
                        "change",
                        calcularResumo
                    );
                }
            );


        filtrarServicos();
    }


    function filtrarServicos() {

        if (!inputBuscaServico) {
            return;
        }


        const termo =
            normalizarTexto(
                inputBuscaServico.value
            );


        listaServicos
            .querySelectorAll(
                ".opcao-checkbox"
            )
            .forEach(
                function (opcao) {

                    const nome =
                        opcao.dataset.servicoNome ||
                        "";

                    opcao.classList.toggle(
                        "agendamento-servico-oculto",
                        Boolean(
                            termo &&
                            !nome.includes(
                                termo
                            )
                        )
                    );
                }
            );
    }


    async function carregarClientes() {

        const {
            data,
            error
        } =
            await supabaseV2
                .from(
                    "clientes_v2"
                )
                .select(
                    "id, nome, whatsapp"
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
                "Erro ao carregar clientes para pesquisa:",
                error
            );

            clientesDisponiveis =
                [];

            return;
        }


        clientesDisponiveis =
            data || [];
    }


    function validarClienteSelecionado() {

        if (!clienteSelecionado) {
            return;
        }


        const mesmoNome =
            normalizarTexto(
                inputNome.value
            ) ===
            normalizarTexto(
                clienteSelecionado.nome
            );


        const mesmoWhatsapp =
            somenteDigitos(
                inputWhatsapp.value
            ) ===
            somenteDigitos(
                clienteSelecionado.whatsapp
            );


        if (
            !mesmoNome ||
            !mesmoWhatsapp
        ) {
            clienteSelecionado =
                null;
        }
    }


    function selecionarCliente(cliente) {

        clienteSelecionado =
            cliente;


        inputNome.value =
            cliente.nome || "";


        inputWhatsapp.value =
            mascararWhatsapp(
                cliente.whatsapp
            );


        if (sugestoesCliente) {

            sugestoesCliente.classList.remove(
                "ativo"
            );

            sugestoesCliente.innerHTML =
                "";
        }


        atualizarAvisoCliente();
    }


    function atualizarAvisoCliente() {

        if (!avisoCliente) {
            return;
        }


        const whatsapp =
            somenteDigitos(
                inputWhatsapp.value
            );

        const nome =
            normalizarTexto(
                inputNome.value
            );


        const clienteExato =
            (
                clienteSelecionado &&
                normalizarTexto(
                    inputNome.value
                ) ===
                    normalizarTexto(
                        clienteSelecionado.nome
                    ) &&
                somenteDigitos(
                    inputWhatsapp.value
                ) ===
                    somenteDigitos(
                        clienteSelecionado.whatsapp
                    )
            )
                ? clienteSelecionado
                : clientesDisponiveis.find(
                    function (cliente) {

                        return (
                            whatsapp.length >= 10 &&
                            somenteDigitos(
                                cliente.whatsapp
                            ) === whatsapp
                        );
                    }
                );


        avisoCliente.className =
            "agendamento-aviso-cliente";


        if (clienteExato) {

            avisoCliente.classList.add(
                "existente"
            );

            avisoCliente.textContent =
                "✓ Cliente existente encontrado.";

            return;
        }


        if (
            whatsapp.length >= 10 ||
            nome.length >= 3
        ) {

            avisoCliente.classList.add(
                "novo"
            );

            avisoCliente.textContent =
                "Novo cliente — será cadastrado ao salvar o agendamento.";

            return;
        }


        avisoCliente.textContent =
            "";
    }


    function atualizarSugestoesCliente(
        origem
    ) {

        if (!sugestoesCliente) {
            return;
        }


        const termoNome =
            normalizarTexto(
                inputNome.value
            );

        const termoWhatsapp =
            somenteDigitos(
                inputWhatsapp.value
            );


        let encontrados =
            [];


        if (
            origem === "whatsapp" &&
            termoWhatsapp.length >= 2
        ) {

            encontrados =
                clientesDisponiveis.filter(
                    function (cliente) {

                        return somenteDigitos(
                            cliente.whatsapp
                        ).includes(
                            termoWhatsapp
                        );
                    }
                );

        } else if (
            termoNome.length >= 2
        ) {

            encontrados =
                clientesDisponiveis.filter(
                    function (cliente) {

                        return normalizarTexto(
                            cliente.nome
                        ).includes(
                            termoNome
                        );
                    }
                );
        }


        encontrados =
            encontrados.slice(
                0,
                6
            );


        if (!encontrados.length) {

            sugestoesCliente.classList.remove(
                "ativo"
            );

            sugestoesCliente.innerHTML =
                "";

            atualizarAvisoCliente();

            return;
        }


        sugestoesCliente.innerHTML =
            encontrados.map(
                function (cliente) {

                    return `
                        <button
                            class="agendamento-sugestao-cliente"
                            type="button"
                            data-cliente-id="${cliente.id}"
                        >
                            <strong>
                                ${escaparHtml(
                                    cliente.nome ||
                                    "Cliente"
                                )}
                            </strong>

                            <span>
                                ${escaparHtml(
                                    mascararWhatsapp(
                                        cliente.whatsapp
                                    )
                                )}
                            </span>
                        </button>
                    `;
                }
            ).join("");


        sugestoesCliente.classList.add(
            "ativo"
        );


        atualizarAvisoCliente();
    }


    function obterServicosSelecionados() {

        const ids =
            Array.from(
                listaServicos.querySelectorAll(
                    'input[type="checkbox"]:checked'
                )
            ).map(
                function (input) {
                    return input.value;
                }
            );


        return servicosDisponiveis.filter(
            function (servico) {

                return ids.includes(
                    String(servico.id)
                );
            }
        );
    }


    function calcularResumo() {

        const selecionados =
            obterServicosSelecionados();


        if (!selecionados.length) {

            resumoTexto.textContent =
                "Selecione pelo menos um serviço.";

            return {
                duracao: 0,
                valor: 0
            };
        }


        const duracao =
            selecionados.reduce(
                function (total, servico) {

                    return (
                        total +
                        Number(
                            servico.duracao_minutos ||
                            0
                        )
                    );
                },
                0
            );


        const valor =
            selecionados.reduce(
                function (total, servico) {

                    return (
                        total +
                        Number(
                            servico.preco ||
                            0
                        )
                    );
                },
                0
            );


        let textoFim = "";


        if (
            inputData.value &&
            inputHora.value
        ) {

            const inicio =
                new Date(
                    `${inputData.value}T${inputHora.value}:00`
                );

            const fim =
                new Date(
                    inicio.getTime() +
                    duracao * 60000
                );


            textoFim =
                ` • termina às ${fim
                    .toLocaleTimeString(
                        "pt-BR",
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    )}`;
        }


        resumoTexto.textContent =
            `${selecionados.length} serviço(s) • ` +
            `${minutosParaTexto(duracao)} • ` +
            `${formatarDinheiro(valor)}` +
            textoFim;


        return {
            duracao,
            valor
        };
    }


    async function carregarServicos() {

        listaServicos.innerHTML = `
            <p class="texto-secundario-admin">
                Carregando serviços...
            </p>
        `;


        if (!obterProfissionalSelecionadoId()) {

            servicosDisponiveis =
                [];

            listaServicos.innerHTML = `
                <p class="texto-secundario-admin">
                    Selecione um profissional para ver
                    os serviços disponíveis.
                </p>
            `;

            return;
        }


        const {
            data: vinculos,
            error: erroVinculos
        } =
            await supabaseV2
                .from("profissional_servicos")
                .select("servico_id")
                .eq(
                    "profissional_id",
                    obterProfissionalSelecionadoId()
                )
                .eq(
                    "ativo",
                    true
                );


        if (erroVinculos) {

            console.error(
                "Erro ao carregar vínculos de serviços:",
                erroVinculos
            );
        }


        const idsVinculados =
            (vinculos || [])
                .map(
                    function (item) {
                        return item.servico_id;
                    }
                );


        let consulta =
            supabaseV2
                .from("servicos_v2")
                .select(`
                    id,
                    nome,
                    preco,
                    duracao_minutos,
                    ativo
                `)
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


        if (!idsVinculados.length) {

            servicosDisponiveis =
                [];

            listaServicos.innerHTML = `
                <p class="texto-secundario-admin">
                    Este profissional não possui
                    serviços vinculados.
                </p>
            `;

            return;
        }


        consulta =
            consulta.in(
                "id",
                idsVinculados
            );


        const {
            data,
            error
        } = await consulta;


        if (error) {

            console.error(
                "Erro ao carregar serviços:",
                error
            );

            listaServicos.innerHTML = `
                <p class="texto-secundario-admin">
                    Não foi possível carregar os serviços.
                </p>
            `;

            return;
        }


        servicosDisponiveis =
            data || [];


        if (!servicosDisponiveis.length) {

            listaServicos.innerHTML = `
                <p class="texto-secundario-admin">
                    Nenhum serviço ativo disponível.
                </p>
            `;

            return;
        }


        renderizarServicos();
    }


    function obterDataSelecionadaAgenda() {

        const inputAgenda =
            document.querySelector(
                "#data-agenda-admin"
            );


        if (
            inputAgenda &&
            inputAgenda.value
        ) {
            return inputAgenda.value;
        }


        if (
            window.adminAgenda &&
            typeof window.adminAgenda.obterData ===
                "function"
        ) {

            const data =
                window.adminAgenda.obterData();


            if (data instanceof Date) {

                return formatarDataInput(
                    data
                );
            }


            if (
                typeof data === "string" &&
                data
            ) {
                return data.slice(0, 10);
            }
        }


        return formatarDataInput(
            new Date()
        );
    }


    async function abrirModal() {

        form.reset();

        status.textContent = "";

        resumoTexto.textContent =
            "Selecione pelo menos um serviço.";

        inputData.value =
            obterDataSelecionadaAgenda();

        modal.classList.add(
            "ativo"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        if (inputBuscaServico) {
            inputBuscaServico.value = "";
        }

        clienteSelecionado = null;

        if (avisoCliente) {
            avisoCliente.textContent = "";
            avisoCliente.className =
                "agendamento-aviso-cliente";
        }

        if (sugestoesCliente) {
            sugestoesCliente.innerHTML = "";
            sugestoesCliente.classList.remove(
                "ativo"
            );
        }


        try {

            await carregarProfissionais();

        } catch (erro) {

            status.textContent =
                "Não foi possível carregar os profissionais.";

            return;
        }


        if (!obterProfissionalSelecionadoId()) {

            listaServicos.innerHTML = `
                <p class="texto-secundario-admin">
                    Cadastre ou ative um profissional
                    antes de criar agendamentos.
                </p>
            `;

            status.textContent =
                "Nenhum profissional ativo disponível.";

            return;
        }


        await Promise.all([
            carregarServicos(),
            carregarClientes()
        ]);


        setTimeout(
            function () {
                inputNome.focus();
            },
            20
        );
    }


    function fecharModal() {

        modal.classList.remove(
            "ativo"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        status.textContent = "";

        if (sugestoesCliente) {
            sugestoesCliente.classList.remove(
                "ativo"
            );
        }
    }


    async function validarDisponibilidade(
        inicio,
        fim
    ) {

        const diaSemana =
            inicio.getDay();


        const {
            data: expedientes,
            error: erroExpediente
        } =
            await supabaseV2
                .from("horarios_profissionais")
                .select(`
                    hora_inicio,
                    hora_fim
                `)
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
                );


        if (erroExpediente) {

            console.error(
                "Erro ao validar expediente:",
                erroExpediente
            );

            throw new Error(
                "Não foi possível consultar o expediente."
            );
        }


        if (
            !expedientes ||
            !expedientes.length
        ) {

            throw new Error(
                "O profissional não trabalha nessa data."
            );
        }


        const inicioMinutos =
            inicio.getHours() * 60 +
            inicio.getMinutes();

        const fimMinutos =
            fim.getHours() * 60 +
            fim.getMinutes();


        const cabeNoExpediente =
            expedientes.some(
                function (expediente) {

                    const partesInicio =
                        expediente.hora_inicio
                            .slice(0, 5)
                            .split(":");

                    const partesFim =
                        expediente.hora_fim
                            .slice(0, 5)
                            .split(":");


                    const expedienteInicio =
                        Number(partesInicio[0]) * 60 +
                        Number(partesInicio[1]);

                    const expedienteFim =
                        Number(partesFim[0]) * 60 +
                        Number(partesFim[1]);


                    return (
                        inicioMinutos >=
                            expedienteInicio &&
                        fimMinutos <=
                            expedienteFim
                    );
                }
            );


        if (!cabeNoExpediente) {

            throw new Error(
                "O horário escolhido fica fora do expediente."
            );
        }


        const inicioDia =
            new Date(inicio);

        inicioDia.setHours(
            0,
            0,
            0,
            0
        );


        const fimDia =
            new Date(inicio);

        fimDia.setHours(
            23,
            59,
            59,
            999
        );


        const {
            data: ocupacoes,
            error: erroOcupacoes
        } =
            await supabaseV2.rpc(
                "ocupacoes_agenda",
                {
                    p_profissional_id:
                        obterProfissionalSelecionadoId(),

                    p_inicio_dia:
                        inicioDia.toISOString(),

                    p_fim_dia:
                        fimDia.toISOString()
                }
            );


        if (erroOcupacoes) {

            console.error(
                "Erro ao consultar ocupações:",
                erroOcupacoes
            );

            throw new Error(
                "Não foi possível consultar a disponibilidade."
            );
        }


        const conflito =
            (ocupacoes || []).some(
                function (ocupacao) {

                    const ocupadoInicio =
                        new Date(
                            ocupacao.inicio
                        );

                    const ocupadoFim =
                        new Date(
                            ocupacao.fim
                        );


                    return (
                        inicio < ocupadoFim &&
                        fim > ocupadoInicio
                    );
                }
            );


        if (conflito) {

            throw new Error(
                "Esse horário já está ocupado ou bloqueado."
            );
        }
    }


    async function atualizarModulosDepoisDeSalvar() {

        const tarefas = [];


        if (
            window.adminAgenda &&
            typeof window.adminAgenda.carregar ===
                "function"
        ) {

            tarefas.push(
                window.adminAgenda.carregar()
            );
        }


        if (
            window.adminClientes &&
            typeof window.adminClientes.carregar ===
                "function"
        ) {

            tarefas.push(
                window.adminClientes.carregar()
            );
        }


        if (
            window.adminFinanceiro &&
            typeof window.adminFinanceiro.carregar ===
                "function"
        ) {

            tarefas.push(
                window.adminFinanceiro.carregar()
            );
        }


        if (
            window.adminVisaoGeral &&
            typeof window.adminVisaoGeral.carregar ===
                "function"
        ) {

            tarefas.push(
                window.adminVisaoGeral.carregar()
            );
        }


        if (tarefas.length) {

            await Promise.allSettled(
                tarefas
            );
        }
    }


    prepararMelhoriasModal();


    inputWhatsapp.addEventListener(
        "input",
        function () {

            validarClienteSelecionado();

            atualizarSugestoesCliente(
                "whatsapp"
            );

            atualizarAvisoCliente();
        }
    );


    inputWhatsapp.addEventListener(
        "input",
        function () {

            inputWhatsapp.value =
                mascararWhatsapp(
                    inputWhatsapp.value
                );

            atualizarAvisoCliente();
        }
    );


    inputData.addEventListener(
        "change",
        calcularResumo
    );


    inputHora.addEventListener(
        "change",
        calcularResumo
    );


    botaoNovoAgendamento.addEventListener(
        "click",
        abrirModal
    );


    botaoFechar.addEventListener(
        "click",
        fecharModal
    );


    botaoCancelar.addEventListener(
        "click",
        fecharModal
    );


    modal.addEventListener(
        "click",
        function (event) {

            if (event.target === modal) {

                fecharModal();
            }
        }
    );


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                modal.classList.contains(
                    "ativo"
                )
            ) {

                fecharModal();
            }
        }
    );


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const nome =
                inputNome.value.trim();

            const whatsapp =
                somenteDigitos(
                    inputWhatsapp.value
                );

            const selecionados =
                obterServicosSelecionados();

            const resumo =
                calcularResumo();


            status.textContent = "";


            if (!nome) {

                status.textContent =
                    "Informe o nome do cliente.";

                inputNome.focus();

                return;
            }


            if (
                whatsapp.length < 10 ||
                whatsapp.length > 11
            ) {

                status.textContent =
                    "Informe um WhatsApp válido.";

                inputWhatsapp.focus();

                return;
            }


            if (
                !inputData.value ||
                !inputHora.value
            ) {

                status.textContent =
                    "Informe a data e o horário.";

                return;
            }


            if (!obterProfissionalSelecionadoId()) {

                status.textContent =
                    "Selecione um profissional.";

                if (selectProfissional) {
                    selectProfissional.focus();
                }

                return;
            }


            if (!selecionados.length) {

                status.textContent =
                    "Selecione pelo menos um serviço.";

                return;
            }


            const inicio =
                new Date(
                    `${inputData.value}T${inputHora.value}:00`
                );


            const fim =
                new Date(
                    inicio.getTime() +
                    resumo.duracao * 60000
                );


            botaoSalvar.disabled = true;

            botaoSalvar.textContent =
                "Salvando...";

            status.textContent =
                "Verificando disponibilidade...";


            try {

                await validarDisponibilidade(
                    inicio,
                    fim
                );


                status.textContent =
                    "Registrando agendamento...";


                const idsServicos =
                    selecionados.map(
                        function (servico) {
                            return servico.id;
                        }
                    );


                const {
                    data,
                    error
                } =
                    await supabaseV2.rpc(
                        "criar_agendamento_publico",
                        {
                            p_barbearia_id:
                                obterBarbeariaId(),

                            p_profissional_id:
                                obterProfissionalSelecionadoId(),

                            p_nome:
                                nome,

                            p_whatsapp:
                                whatsapp,

                            p_inicio:
                                inicio.toISOString(),

                            p_servicos:
                                idsServicos
                        }
                    );


                if (error) {

                    console.error(
                        "Erro ao criar agendamento manual:",
                        error
                    );

                    throw new Error(
                        error.message ||
                        "Não foi possível salvar o agendamento."
                    );
                }


                console.log(
                    "Agendamento manual criado:",
                    data
                );


                const novaData =
                    new Date(
                        `${inputData.value}T12:00:00`
                    );


                const inputAgenda =
                    document.querySelector(
                        "#data-agenda-admin"
                    );


                if (inputAgenda) {

                    inputAgenda.value =
                        inputData.value;

                    inputAgenda.dispatchEvent(
                        new Event(
                            "change",
                            {
                                bubbles: true
                            }
                        )
                    );
                }


                fecharModal();


                await atualizarModulosDepoisDeSalvar();


                alert(
                    "Agendamento criado com sucesso."
                );

            } catch (erro) {

                console.error(
                    "Falha no agendamento manual:",
                    erro
                );

                status.textContent =
                    erro.message ||
                    "Não foi possível criar o agendamento.";

            } finally {

                botaoSalvar.disabled = false;

                botaoSalvar.textContent =
                    "Salvar agendamento";
            }
        }
    );


    document.addEventListener(
        "admin:profissionais-atualizados",
        async function () {

            try {

                await carregarProfissionais();

                if (
                    modal.classList.contains(
                        "ativo"
                    )
                ) {

                    await carregarServicos();

                }

            } catch (erro) {

                console.error(
                    "Erro ao atualizar profissionais do agendamento manual:",
                    erro
                );

            }

        }
    );


    window.adminAgendamentoManual = {

        abrir:
            abrirModal,

        definirProfissional:
            function (profissionalId) {

                profissionalSelecionadoId =
                    profissionalId ||
                    null;

                renderizarSeletorProfissional();

            },

        obterProfissionalId:
            function () {

                return obterProfissionalSelecionadoId();

            },

        recarregarProfissionais:
            async function () {

                await carregarProfissionais();

                if (
                    modal.classList.contains(
                        "ativo"
                    )
                ) {

                    await carregarServicos();

                }

            }

    };

})();s