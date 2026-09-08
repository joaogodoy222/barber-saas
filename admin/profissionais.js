(function () {

    "use strict";


    // =========================================================
    // ESTADO
    // =========================================================

    let profissionaisCarregados = [];
    let servicosCarregados = [];
    let vinculosCarregados = [];

    let elementosConfigurados = false;
    let carregandoProfissionais = false;
    let usoPlano = null;


    // =========================================================
    // CONTEXTO SAAS
    // =========================================================

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


    // =========================================================
    // PLANO / LIMITES
    // =========================================================
    function mensagemLimitePlano(erro) {
        const mensagem = String(erro?.message || erro?.details || "");
        if (!mensagem.includes("LIMITE_PLANO_PROFISSIONAIS")) return null;
        return mensagem.replace("LIMITE_PLANO_PROFISSIONAIS:", "").trim();
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
        const usados = Number(usoPlano?.profissionais?.usados ?? 0);
        const limite = usoPlano?.profissionais?.limite;
        return limite != null && usados >= Number(limite);
    }

    function atualizarInterfacePlano() {
        const botao = obterElementos().botaoNovo;
        if (!botao || !usoPlano) return;

        let aviso = document.querySelector("#aviso-plano-profissionais");
        if (!aviso) {
            aviso = document.createElement("p");
            aviso.id = "aviso-plano-profissionais";
            aviso.className = "texto-secundario-admin";
            aviso.style.marginTop = "8px";
            botao.insertAdjacentElement("afterend", aviso);
        }

        const usados = Number(usoPlano.profissionais?.usados ?? 0);
        const limite = usoPlano.profissionais?.limite;
        const plano = usoPlano.plano?.nome || "Plano atual";

        if (limite == null) {
            botao.disabled = false;
            aviso.textContent = `${usados} profissional(is) ativo(s) · ${plano} sem limite`;
            return;
        }

        const atingido = usados >= Number(limite);
        botao.disabled = atingido;
        botao.title = atingido
            ? `Limite de ${limite} profissional(is) atingido no plano ${plano}.`
            : "";
        aviso.textContent = atingido
            ? `${usados} de ${limite} profissional(is) utilizados · limite do ${plano} atingido`
            : `${usados} de ${limite} profissional(is) utilizados · ${plano}`;
    }


    // =========================================================
    // ELEMENTOS
    // =========================================================

    function obterElementos() {

        return {

            pagina:
                document.querySelector(
                    "#pagina-profissionais"
                ),

            lista:
                document.querySelector(
                    "#lista-profissionais-admin"
                ),

            busca:
                document.querySelector(
                    "#busca-profissional"
                ),

            total:
                document.querySelector(
                    "#total-profissionais"
                ),

            ativos:
                document.querySelector(
                    "#total-profissionais-ativos"
                ),

            inativos:
                document.querySelector(
                    "#total-profissionais-inativos"
                ),

            botaoNovo:
                document.querySelector(
                    "#botao-novo-profissional"
                ),

            modal:
                document.querySelector(
                    "#modal-profissional"
                ),

            fecharModal:
                document.querySelector(
                    "#fechar-modal-profissional"
                ),

            cancelar:
                document.querySelector(
                    "#cancelar-profissional"
                ),

            form:
                document.querySelector(
                    "#form-profissional"
                ),

            id:
                document.querySelector(
                    "#profissional-id"
                ),

            nome:
                document.querySelector(
                    "#profissional-nome"
                ),

            ativo:
                document.querySelector(
                    "#profissional-ativo"
                ),

            servicos:
                document.querySelector(
                    "#profissional-servicos"
                ),

            status:
                document.querySelector(
                    "#profissional-status"
                ),

            tituloModal:
                document.querySelector(
                    "#titulo-modal-profissional"
                ),

            salvar:
                document.querySelector(
                    "#salvar-profissional"
                )

        };

    }


    // =========================================================
    // ESTILOS
    // =========================================================

    function garantirEstilos() {

        if (
            document.querySelector(
                "#estilos-profissionais-admin"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "estilos-profissionais-admin";

        style.textContent = `

            .profissionais-lista {
                display: grid;
                grid-template-columns: repeat(
                    auto-fit,
                    minmax(260px, 1fr)
                );
                gap: 14px;
            }

            .profissional-card-admin {
                display: flex;
                flex-direction: column;
                gap: 14px;
                padding: 18px;
                border: 1px solid var(--cor-borda);
                border-radius: 16px;
                background: var(--cor-superficie-2);
            }

            .profissional-card-topo {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
            }

            .profissional-identidade {
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 0;
            }

            .profissional-avatar {
                width: 44px;
                height: 44px;
                flex: 0 0 44px;
                display: grid;
                place-items: center;
                border-radius: 50%;
                background: var(--cor-superficie);
                border: 1px solid var(--cor-borda);
                font-size: 14px;
                font-weight: 900;
            }

            .profissional-identidade-texto {
                min-width: 0;
            }

            .profissional-identidade-texto strong {
                display: block;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 14px;
            }

            .profissional-identidade-texto span {
                display: block;
                margin-top: 4px;
                color: var(--cor-texto-2);
                font-size: 11px;
            }

            .profissional-status-chip {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 26px;
                padding: 0 9px;
                border-radius: 999px;
                font-size: 9px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: .03em;
            }

            .profissional-status-chip.ativo {
                background: rgba(34, 197, 94, .12);
                color: #22c55e;
            }

            .profissional-status-chip.inativo {
                background: rgba(239, 68, 68, .12);
                color: #ef4444;
            }

            .profissional-servicos-card {
                display: flex;
                flex-wrap: wrap;
                gap: 7px;
            }

            .profissional-servico-chip {
                display: inline-flex;
                align-items: center;
                min-height: 26px;
                padding: 0 9px;
                border: 1px solid var(--cor-borda);
                border-radius: 999px;
                background: var(--cor-superficie);
                color: var(--cor-texto-2);
                font-size: 10px;
                font-weight: 700;
            }

            .profissional-sem-servicos {
                color: var(--cor-texto-3);
                font-size: 11px;
            }

            .profissional-card-acoes {
                display: flex;
                gap: 8px;
                margin-top: auto;
                padding-top: 4px;
            }

            .profissional-card-acoes button {
                flex: 1;
            }

            .profissional-servicos-selecao {
                display: grid;
                gap: 8px;
            }

            .profissional-servico-opcao {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 11px 12px;
                border: 1px solid var(--cor-borda);
                border-radius: 10px;
                background: var(--cor-superficie-2);
                cursor: pointer;
                font-size: 12px;
                font-weight: 700;
            }

            .profissional-servico-opcao input {
                margin: 0;
            }

            .profissional-telefone-campo {
                margin-top: 0;
            }

        `;

        document.head.appendChild(
            style
        );

    }


    // =========================================================
    // CAMPO TELEFONE
    // =========================================================

    function garantirCampoTelefone() {

        if (
            document.querySelector(
                "#profissional-telefone"
            )
        ) {
            return;
        }

        const campoNome =
            document.querySelector(
                "#profissional-nome"
            );

        const containerNome =
            campoNome?.closest(
                ".campo-admin"
            );

        if (!containerNome) {
            return;
        }

        const container =
            document.createElement(
                "div"
            );

        container.className =
            "campo-admin profissional-telefone-campo";

        container.innerHTML = `
            <label for="profissional-telefone">
                Telefone / WhatsApp
            </label>

            <input
                id="profissional-telefone"
                type="tel"
                inputmode="numeric"
                autocomplete="tel"
                placeholder="(11) 99999-9999"
                maxlength="15"
            >
        `;

        containerNome.insertAdjacentElement(
            "afterend",
            container
        );

        const input =
            container.querySelector(
                "#profissional-telefone"
            );

        input.addEventListener(
            "input",
            function () {

                input.value =
                    formatarTelefone(
                        input.value
                    );

            }
        );

    }


    // =========================================================
    // FORMATADORES
    // =========================================================

    function somenteDigitos(valor) {

        return String(
            valor || ""
        ).replace(
            /\D/g,
            ""
        );

    }


    function formatarTelefone(valor) {

        const numeros =
            somenteDigitos(
                valor
            ).slice(
                0,
                11
            );

        if (!numeros) {
            return "";
        }

        if (numeros.length <= 2) {
            return `(${numeros}`;
        }

        if (numeros.length <= 6) {

            return (
                `(${numeros.slice(0, 2)}) ` +
                numeros.slice(2)
            );

        }

        if (numeros.length <= 10) {

            return (
                `(${numeros.slice(0, 2)}) ` +
                `${numeros.slice(2, 6)}-` +
                numeros.slice(6)
            );

        }

        return (
            `(${numeros.slice(0, 2)}) ` +
            `${numeros.slice(2, 7)}-` +
            numeros.slice(7)
        );

    }


    function obterIniciais(nome) {

        const partes =
            String(
                nome || ""
            )
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        if (!partes.length) {
            return "P";
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


    function escaparHtml(valor) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            String(
                valor ?? ""
            );

        return div.innerHTML;

    }


    // =========================================================
    // BUSCAR DADOS
    // =========================================================

    async function buscarProfissionais() {

        const barbeariaId =
            obterBarbeariaId();

        const { data, error } =
            await supabaseV2
                .from(
                    "profissionais"
                )
                .select(
                    `
                    id,
                    barbearia_id,
                    auth_user_id,
                    nome,
                    telefone,
                    foto_url,
                    ativo,
                    created_at
                    `
                )
                .eq(
                    "barbearia_id",
                    barbeariaId
                )
                .order(
                    "nome",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        return data || [];

    }


    async function buscarServicos() {

        const barbeariaId =
            obterBarbeariaId();

        const { data, error } =
            await supabaseV2
                .from(
                    "servicos_v2"
                )
                .select(
                    `
                    id,
                    nome,
                    ativo
                    `
                )
                .eq(
                    "barbearia_id",
                    barbeariaId
                )
                .order(
                    "nome",
                    {
                        ascending: true
                    }
                );

        if (error) {
            throw error;
        }

        return data || [];

    }


    async function buscarVinculos(
        profissionais
    ) {

        const ids =
            profissionais
                .map(
                    profissional =>
                        profissional.id
                )
                .filter(Boolean);

        if (!ids.length) {
            return [];
        }

        const { data, error } =
            await supabaseV2
                .from(
                    "profissional_servicos"
                )
                .select(
                    `
                    profissional_id,
                    servico_id,
                    ativo
                    `
                )
                .in(
                    "profissional_id",
                    ids
                );

        if (error) {
            throw error;
        }

        return data || [];

    }


    // =========================================================
    // RESUMO
    // =========================================================

    function atualizarResumo() {

        const elementos =
            obterElementos();

        const total =
            profissionaisCarregados.length;

        const ativos =
            profissionaisCarregados.filter(
                profissional =>
                    profissional.ativo === true
            ).length;

        const inativos =
            total - ativos;

        if (elementos.total) {
            elementos.total.textContent =
                String(total);
        }

        if (elementos.ativos) {
            elementos.ativos.textContent =
                String(ativos);
        }

        if (elementos.inativos) {
            elementos.inativos.textContent =
                String(inativos);
        }

    }


    // =========================================================
    // SERVIÇOS DO PROFISSIONAL
    // =========================================================

    function obterServicosDoProfissional(
        profissionalId
    ) {

        const servicosIds =
            vinculosCarregados
                .filter(
                    vinculo =>
                        vinculo.profissional_id ===
                            profissionalId &&
                        vinculo.ativo === true
                )
                .map(
                    vinculo =>
                        vinculo.servico_id
                );

        return servicosCarregados.filter(
            servico =>
                servicosIds.includes(
                    servico.id
                )
        );

    }


    // =========================================================
    // RENDERIZAÇÃO
    // =========================================================

    function renderizarProfissionais(
        termo = ""
    ) {

        const elementos =
            obterElementos();

        if (!elementos.lista) {
            return;
        }

        const busca =
            String(
                termo || ""
            )
                .trim()
                .toLowerCase();

        const filtrados =
            profissionaisCarregados.filter(
                function (profissional) {

                    if (!busca) {
                        return true;
                    }

                    const nome =
                        String(
                            profissional.nome || ""
                        ).toLowerCase();

                    const telefone =
                        somenteDigitos(
                            profissional.telefone
                        );

                    const buscaDigitos =
                        somenteDigitos(
                            busca
                        );

                    return (
                        nome.includes(busca) ||
                        (
                            buscaDigitos &&
                            telefone.includes(
                                buscaDigitos
                            )
                        )
                    );

                }
            );

        if (!filtrados.length) {

            elementos.lista.className =
                "lista-servicos-admin";

            elementos.lista.innerHTML = `
                <div class="estado-carregando-admin">
                    ${
                        busca
                            ? "Nenhum profissional encontrado."
                            : "Nenhum profissional cadastrado."
                    }
                </div>
            `;

            return;

        }

        elementos.lista.className =
            "lista-servicos-admin profissionais-lista";

        elementos.lista.innerHTML =
            filtrados
                .map(
                    function (profissional) {

                        const servicos =
                            obterServicosDoProfissional(
                                profissional.id
                            );

                        const servicosHtml =
                            servicos.length
                                ? servicos
                                    .map(
                                        servico => `
                                            <span class="profissional-servico-chip">
                                                ${escaparHtml(servico.nome)}
                                            </span>
                                        `
                                    )
                                    .join("")
                                : `
                                    <span class="profissional-sem-servicos">
                                        Nenhum serviço vinculado
                                    </span>
                                `;

                        return `
                            <article
                                class="profissional-card-admin"
                                data-profissional-id="${profissional.id}"
                            >

                                <div class="profissional-card-topo">

                                    <div class="profissional-identidade">

                                        <div class="profissional-avatar">
                                            ${escaparHtml(
                                                obterIniciais(
                                                    profissional.nome
                                                )
                                            )}
                                        </div>

                                        <div class="profissional-identidade-texto">

                                            <strong>
                                                ${escaparHtml(
                                                    profissional.nome
                                                )}
                                            </strong>

                                            <span>
                                                ${
                                                    profissional.telefone
                                                        ? escaparHtml(
                                                            formatarTelefone(
                                                                profissional.telefone
                                                            )
                                                        )
                                                        : "Sem telefone"
                                                }
                                            </span>

                                        </div>

                                    </div>


                                    <span
                                        class="profissional-status-chip ${
                                            profissional.ativo
                                                ? "ativo"
                                                : "inativo"
                                        }"
                                    >
                                        ${
                                            profissional.ativo
                                                ? "Ativo"
                                                : "Inativo"
                                        }
                                    </span>

                                </div>


                                <div class="profissional-servicos-card">
                                    ${servicosHtml}
                                </div>


                                <div class="profissional-card-acoes">

                                    <button
                                        class="botao-secundario-admin botao-editar-profissional"
                                        type="button"
                                        data-id="${profissional.id}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        class="botao-secundario-admin botao-status-profissional"
                                        type="button"
                                        data-id="${profissional.id}"
                                    >
                                        ${
                                            profissional.ativo
                                                ? "Desativar"
                                                : "Ativar"
                                        }
                                    </button>

                                </div>

                            </article>
                        `;

                    }
                )
                .join("");

    }


    // =========================================================
    // CARREGAR
    // =========================================================

    async function carregarProfissionais() {

        if (carregandoProfissionais) {
            return;
        }

        const elementos =
            obterElementos();

        if (!elementos.lista) {
            return;
        }

        carregandoProfissionais =
            true;

        elementos.lista.className =
            "lista-servicos-admin";

        elementos.lista.innerHTML = `
            <div class="estado-carregando-admin">
                Carregando profissionais...
            </div>
        `;

        try {

            const [
                profissionais,
                servicos
            ] =
                await Promise.all([
                    buscarProfissionais(),
                    buscarServicos()
                ]);

            profissionaisCarregados =
                profissionais;

            servicosCarregados =
                servicos;

            vinculosCarregados =
                await buscarVinculos(
                    profissionaisCarregados
                );

            atualizarResumo();

            renderizarProfissionais(
                elementos.busca?.value || ""
            );

            await carregarUsoPlano();

        } catch (erro) {

            console.error(
                "Erro ao carregar profissionais:",
                erro
            );

            elementos.lista.innerHTML = `
                <div class="estado-carregando-admin">
                    Não foi possível carregar os profissionais.
                </div>
            `;

        } finally {

            carregandoProfissionais =
                false;

        }

    }


    // =========================================================
    // SERVIÇOS NO MODAL
    // =========================================================

    function renderizarServicosModal(
        selecionados = []
    ) {

        const elementos =
            obterElementos();

        if (!elementos.servicos) {
            return;
        }

        if (!servicosCarregados.length) {

            elementos.servicos.innerHTML = `
                <p class="texto-secundario-admin">
                    Cadastre pelo menos um serviço antes
                    de vincular serviços ao profissional.
                </p>
            `;

            return;

        }

        elementos.servicos.className =
            "servico-opcoes profissional-servicos-selecao";

        elementos.servicos.innerHTML =
            servicosCarregados
                .filter(
                    servico =>
                        servico.ativo === true
                )
                .map(
                    servico => `
                        <label class="profissional-servico-opcao">

                            <input
                                type="checkbox"
                                name="profissional-servico"
                                value="${servico.id}"
                                ${
                                    selecionados.includes(
                                        servico.id
                                    )
                                        ? "checked"
                                        : ""
                                }
                            >

                            <span>
                                ${escaparHtml(servico.nome)}
                            </span>

                        </label>
                    `
                )
                .join("");

        if (
            !elementos.servicos.innerHTML.trim()
        ) {

            elementos.servicos.innerHTML = `
                <p class="texto-secundario-admin">
                    Nenhum serviço ativo disponível.
                </p>
            `;

        }

    }


    // =========================================================
    // MODAL
    // =========================================================

    async function abrirModalNovo() {

        const elementos =
            obterElementos();

        try {
            await carregarUsoPlano();
        } catch (erro) {
            console.error("Erro ao consultar plano:", erro);
        }

        if (limitePlanoAtingido()) {
            const limite = usoPlano?.profissionais?.limite;
            const plano = usoPlano?.plano?.nome || "atual";
            alert(
                `Você já utiliza ${limite} de ${limite} profissional(is), limite do plano ${plano}. Para adicionar outro profissional, será necessário mudar de plano.`
            );
            return;
        }

        if (!elementos.modal) {
            return;
        }

        garantirCampoTelefone();

        elementos.id.value =
            "";

        elementos.nome.value =
            "";

        const telefone =
            document.querySelector(
                "#profissional-telefone"
            );

        if (telefone) {
            telefone.value = "";
        }

        elementos.ativo.checked =
            true;

        elementos.status.textContent =
            "";

        elementos.tituloModal.textContent =
            "Novo profissional";

        renderizarServicosModal(
            []
        );

        elementos.modal.classList.add(
            "ativo"
        );

        elementos.modal.setAttribute(
            "aria-hidden",
            "false"
        );

        elementos.nome.focus();

    }


    function abrirModalEdicao(
        profissionalId
    ) {

        const profissional =
            profissionaisCarregados.find(
                item =>
                    item.id ===
                    profissionalId
            );

        if (!profissional) {
            return;
        }

        const elementos =
            obterElementos();

        garantirCampoTelefone();

        elementos.id.value =
            profissional.id;

        elementos.nome.value =
            profissional.nome || "";

        const telefone =
            document.querySelector(
                "#profissional-telefone"
            );

        if (telefone) {

            telefone.value =
                formatarTelefone(
                    profissional.telefone
                );

        }

        elementos.ativo.checked =
            profissional.ativo === true;

        elementos.status.textContent =
            "";

        elementos.tituloModal.textContent =
            "Editar profissional";

        const servicosSelecionados =
            vinculosCarregados
                .filter(
                    vinculo =>
                        vinculo.profissional_id ===
                            profissional.id &&
                        vinculo.ativo === true
                )
                .map(
                    vinculo =>
                        vinculo.servico_id
                );

        renderizarServicosModal(
            servicosSelecionados
        );

        elementos.modal.classList.add(
            "ativo"
        );

        elementos.modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function fecharModal() {

        const elementos =
            obterElementos();

        if (!elementos.modal) {
            return;
        }

        elementos.modal.classList.remove(
            "ativo"
        );

        elementos.modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    // =========================================================
    // SALVAR VÍNCULOS
    // =========================================================

    async function salvarVinculosServicos(
        profissionalId,
        servicosSelecionados
    ) {

        const {
            error: erroExcluir
        } =
            await supabaseV2
                .from(
                    "profissional_servicos"
                )
                .delete()
                .eq(
                    "profissional_id",
                    profissionalId
                );

        if (erroExcluir) {
            throw erroExcluir;
        }

        if (!servicosSelecionados.length) {
            return;
        }

        const registros =
            servicosSelecionados.map(
                servicoId => ({

                    profissional_id:
                        profissionalId,

                    servico_id:
                        servicoId,

                    ativo:
                        true

                })
            );

        const {
            error: erroInserir
        } =
            await supabaseV2
                .from(
                    "profissional_servicos"
                )
                .insert(
                    registros
                );

        if (erroInserir) {
            throw erroInserir;
        }

    }


    // =========================================================
    // SALVAR PROFISSIONAL
    // =========================================================

    async function salvarProfissional(
        event
    ) {

        event.preventDefault();

        const elementos =
            obterElementos();

        const nome =
            elementos.nome.value.trim();

        if (!nome) {

            elementos.status.textContent =
                "Informe o nome do profissional.";

            return;

        }

        const telefoneInput =
            document.querySelector(
                "#profissional-telefone"
            );

        const telefone =
            somenteDigitos(
                telefoneInput?.value || ""
            );

        const servicosSelecionados =
            Array.from(
                document.querySelectorAll(
                    'input[name="profissional-servico"]:checked'
                )
            ).map(
                input =>
                    input.value
            );

        const profissionalId =
            elementos.id.value.trim();

        elementos.salvar.disabled =
            true;

        elementos.salvar.textContent =
            profissionalId
                ? "Salvando..."
                : "Cadastrando...";

        elementos.status.textContent =
            "Salvando...";

        try {

            let idSalvo =
                profissionalId;

            if (profissionalId) {

                const {
                    error
                } =
                    await supabaseV2
                        .from(
                            "profissionais"
                        )
                        .update({

                            nome,

                            telefone:
                                telefone ||
                                null,

                            ativo:
                                elementos.ativo.checked

                        })
                        .eq(
                            "id",
                            profissionalId
                        )
                        .eq(
                            "barbearia_id",
                            obterBarbeariaId()
                        );

                if (error) {
                    throw error;
                }

            } else {

                const {
                    data,
                    error
                } =
                    await supabaseV2
                        .from(
                            "profissionais"
                        )
                        .insert({

                            barbearia_id:
                                obterBarbeariaId(),

                            nome,

                            telefone:
                                telefone ||
                                null,

                            ativo:
                                elementos.ativo.checked

                        })
                        .select(
                            "id"
                        )
                        .single();

                if (error) {
                    throw error;
                }

                idSalvo =
                    data.id;

            }

            await salvarVinculosServicos(
                idSalvo,
                servicosSelecionados
            );

            elementos.status.textContent =
                "Profissional salvo com sucesso.";

            fecharModal();

            await carregarProfissionais();

            document.dispatchEvent(
                new CustomEvent(
                    "admin:profissionais-atualizados",
                    {
                        detail: {
                            barbeariaId:
                                obterBarbeariaId()
                        }
                    }
                )
            );

            if (
                window.adminServicos?.carregar
            ) {
                window.adminServicos.carregar();
            }

        } catch (erro) {

            console.error(
                "Erro ao salvar profissional:",
                erro
            );

            const mensagemLimite = mensagemLimitePlano(erro);

            elementos.status.textContent =
                mensagemLimite ||
                "Não foi possível salvar o profissional.";

            if (mensagemLimite) {
                await carregarUsoPlano();
            }

        } finally {

            elementos.salvar.disabled =
                false;

            elementos.salvar.textContent =
                "Salvar profissional";

        }

    }


    // =========================================================
    // ATIVAR / DESATIVAR
    // =========================================================

    async function alterarStatusProfissional(
        profissionalId
    ) {

        const profissional =
            profissionaisCarregados.find(
                item =>
                    item.id ===
                    profissionalId
            );

        if (!profissional) {
            return;
        }

        const novoStatus =
            !profissional.ativo;

        const acao =
            novoStatus
                ? "ativar"
                : "desativar";

        const confirmou =
            window.confirm(
                `Deseja ${acao} ${profissional.nome}?`
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
                        "profissionais"
                    )
                    .update({
                        ativo:
                            novoStatus
                    })
                    .eq(
                        "id",
                        profissional.id
                    )
                    .eq(
                        "barbearia_id",
                        obterBarbeariaId()
                    );

            if (error) {
                throw error;
            }

            await carregarProfissionais();

            document.dispatchEvent(
                new CustomEvent(
                    "admin:profissionais-atualizados",
                    {
                        detail: {
                            barbeariaId:
                                obterBarbeariaId()
                        }
                    }
                )
            );

        } catch (erro) {

            console.error(
                "Erro ao alterar status do profissional:",
                erro
            );

            const mensagemLimite = mensagemLimitePlano(erro);

            alert(
                mensagemLimite ||
                "Não foi possível alterar o status do profissional."
            );

            if (mensagemLimite) {
                await carregarUsoPlano();
            }

        }

    }


    // =========================================================
    // EVENTOS
    // =========================================================

    function configurarEventos() {

        if (elementosConfigurados) {
            return;
        }

        const elementos =
            obterElementos();

        if (!elementos.pagina) {
            return;
        }

        elementosConfigurados =
            true;

        garantirEstilos();

        garantirCampoTelefone();


        if (elementos.botaoNovo) {

            elementos.botaoNovo.addEventListener(
                "click",
                abrirModalNovo
            );

        }


        if (elementos.fecharModal) {

            elementos.fecharModal.addEventListener(
                "click",
                fecharModal
            );

        }


        if (elementos.cancelar) {

            elementos.cancelar.addEventListener(
                "click",
                fecharModal
            );

        }


        if (elementos.modal) {

            elementos.modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        elementos.modal
                    ) {
                        fecharModal();
                    }

                }
            );

        }


        if (elementos.form) {

            elementos.form.addEventListener(
                "submit",
                salvarProfissional
            );

        }


        if (elementos.busca) {

            elementos.busca.addEventListener(
                "input",
                function () {

                    renderizarProfissionais(
                        elementos.busca.value
                    );

                }
            );

        }


        if (elementos.lista) {

            elementos.lista.addEventListener(
                "click",
                async function (event) {

                    const botaoEditar =
                        event.target.closest(
                            ".botao-editar-profissional"
                        );

                    if (botaoEditar) {

                        abrirModalEdicao(
                            botaoEditar.dataset.id
                        );

                        return;

                    }

                    const botaoStatus =
                        event.target.closest(
                            ".botao-status-profissional"
                        );

                    if (botaoStatus) {

                        await alterarStatusProfissional(
                            botaoStatus.dataset.id
                        );

                    }

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


    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================

    function iniciarProfissionais() {

        garantirEstilos();

        garantirCampoTelefone();

        configurarEventos();

    }


    // =========================================================
    // EVENTOS DO PAINEL
    // =========================================================

    document.addEventListener(
        "admin:pagina-aberta",
        async function (event) {

            if (
                event.detail?.pagina !==
                "profissionais"
            ) {
                return;
            }

            iniciarProfissionais();

            await carregarProfissionais();

            document.dispatchEvent(
                new CustomEvent(
                    "admin:profissionais-atualizados",
                    {
                        detail: {
                            barbeariaId:
                                obterBarbeariaId()
                        }
                    }
                )
            );

        }
    );


    document.addEventListener(
        "saas:contexto-carregado",
        async function () {

            const pagina =
                document.querySelector(
                    "#pagina-profissionais"
                );

            if (
                pagina &&
                pagina.classList.contains(
                    "ativa"
                )
            ) {

                iniciarProfissionais();

                await carregarProfissionais();

            document.dispatchEvent(
                new CustomEvent(
                    "admin:profissionais-atualizados",
                    {
                        detail: {
                            barbeariaId:
                                obterBarbeariaId()
                        }
                    }
                )
            );

            }

        }
    );


    // =========================================================
    // API
    // =========================================================

    window.adminProfissionais = {

        carregar:
            carregarProfissionais,

        carregarUsoPlano:
            carregarUsoPlano,

        obterUsoPlano:
            function () {
                return usoPlano;
            },

        abrirNovo:
            abrirModalNovo

    };


    // =========================================================
    // PREPARAÇÃO INICIAL
    // =========================================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarProfissionais
        );

    } else {

        iniciarProfissionais();

    }

})();
