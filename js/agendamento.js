const estadoAgendamento = {
    etapa: 1,
    servicos: [],
    profissional: null,
    data: null,
    horario: null,
    cliente: {
        nome: "",
        whatsapp: ""
    }
};

let barbeariaPublica = null;



async function carregarBarbeariaPublica() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const slug =
        parametros.get("barbearia") ||
        parametros.get("slug");


    if (!slug) {

        throw new Error(
            "LINK_PUBLICO_SEM_BARBEARIA"
        );
    }


    const {
        data,
        error
    } =
        await supabaseV2
            .from("barbearias")
            .select(
                "id, nome, slug, telefone, ativo"
            )
            .eq(
                "slug",
                slug
            )
            .eq(
                "ativo",
                true
            )
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(
            "Erro ao carregar barbearia:",
            error
        );

        throw error;
    }


    if (!data) {

        throw new Error(
            "BARBEARIA_PUBLICA_NAO_ENCONTRADA"
        );
    }


    barbeariaPublica = data;

    aplicarIdentidadeBarbearia();

    return data;
}


function obterBarbeariaId() {

    if (!barbeariaPublica?.id) {

        throw new Error(
            "Barbearia pública ainda não foi carregada."
        );
    }

    return barbeariaPublica.id;
}


function gerarIniciaisMarca(nome) {

    const palavras =
        String(nome || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!palavras.length) {
        return "B";
    }


    if (palavras.length === 1) {

        return palavras[0]
            .slice(0, 2)
            .toUpperCase();
    }


    return (
        palavras[0].charAt(0) +
        palavras[palavras.length - 1].charAt(0)
    ).toUpperCase();
}


function aplicarIdentidadeBarbearia() {

    if (!barbeariaPublica) {
        return;
    }


    const nome =
        String(
            barbeariaPublica.nome ||
            "Barbearia"
        ).trim();


    const tituloPagina =
        document.querySelector(
            "#titulo-pagina"
        );

    const marcaSimbolo =
        document.querySelector(
            "#marca-simbolo"
        );

    const marcaNome =
        document.querySelector(
            "#marca-nome"
        );

    const marcaSubtitulo =
        document.querySelector(
            "#marca-subtitulo"
        );

    const etiquetaBarbearia =
        document.querySelector(
            "#etiqueta-barbearia"
        );


    document.title =
        `Agendamento | ${nome}`;


    if (tituloPagina) {

        tituloPagina.textContent =
            `Agendamento | ${nome}`;
    }


    if (marcaSimbolo) {

        marcaSimbolo.textContent =
            gerarIniciaisMarca(nome);
    }


    if (marcaNome) {

        marcaNome.textContent =
            nome.toUpperCase();
    }


    if (marcaSubtitulo) {

        marcaSubtitulo.textContent =
            "BARBEARIA";
    }


    if (etiquetaBarbearia) {

        etiquetaBarbearia.textContent =
            "AGENDAMENTO ONLINE";
    }
}
const listaServicos = document.querySelector("#lista-servicos");
const botaoContinuar = document.querySelector("#botao-continuar");
const resumoRapido = document.querySelector("#resumo-rapido");
const resumoFinal =
    document.querySelector("#resumo-final");

const formularioCliente =
    
    document.querySelector("#formulario-cliente");

const inputClienteNome =
    document.querySelector("#cliente-nome");

const inputClienteWhatsapp =
    document.querySelector("#cliente-whatsapp");

    inputClienteWhatsapp.addEventListener(
    "input",
    function () {

        let numero =
            inputClienteWhatsapp.value
                .replace(/\D/g, "")
                .slice(0, 11);

        if (numero.length <= 2) {

            inputClienteWhatsapp.value =
                numero.length > 0
                    ? `(${numero}`
                    : "";

            return;
        }

        if (numero.length <= 7) {

            inputClienteWhatsapp.value =
                `(${numero.slice(0, 2)}) ${numero.slice(2)}`;

            return;
        }

        inputClienteWhatsapp.value =
            `(${numero.slice(0, 2)}) ` +
            `${numero.slice(2, 7)}-` +
            `${numero.slice(7, 11)}`;
    }
);

async function carregarServicos() {

    const { data: servicos, error } = await supabaseV2
        .from("servicos_v2")
        .select(
            "id, nome, descricao, preco, duracao_minutos, categoria"
        )
        .eq(
            "barbearia_id",
            obterBarbeariaId()
        )
        .eq("ativo", true)
        .eq("permite_agendamento_online", true)
        .order("nome");


    if (error) {

        console.error(
            "Erro ao carregar serviços:",
            error
        );

        listaServicos.innerHTML = `
            <div class="estado-carregando">
                <p>
                    Não foi possível carregar os serviços.
                </p>
            </div>
        `;

        return;
    }


    if (!servicos || servicos.length === 0) {

        listaServicos.innerHTML = `
            <div class="estado-carregando">
                <p>
                    Nenhum serviço disponível.
                </p>
            </div>
        `;

        return;
    }


    listaServicos.innerHTML = "";


    servicos.forEach(function (servico) {

        const card = document.createElement("article");

        card.className = "card-servico";

        card.dataset.id = servico.id;


        card.innerHTML = `

            <div class="seletor-card">
                +
            </div>

            <h3>
                ${servico.nome}
            </h3>

            <p>
                ${servico.descricao || "Serviço profissional"}
            </p>

            <div class="servico-informacoes">

                <span class="servico-preco">
                    ${formatarDinheiro(servico.preco)}
                </span>

                <span class="servico-duracao">
                    ${formatarDuracao(servico.duracao_minutos)}
                </span>

            </div>

        `;


        card.addEventListener(
            "click",
            function () {

                selecionarServico(
                    servico,
                    card
                );

            }
        );


        listaServicos.appendChild(card);

    });

}


function selecionarServico(servico, card) {

    const indice = estadoAgendamento.servicos
        .findIndex(function (item) {
            return item.id === servico.id;
        });


    if (indice === -1) {

        estadoAgendamento.servicos.push(servico);

        card.classList.add("selecionado");

        card.querySelector(
            ".seletor-card"
        ).textContent = "✓";

    } else {

        estadoAgendamento.servicos.splice(
            indice,
            1
        );

        card.classList.remove("selecionado");

        card.querySelector(
            ".seletor-card"
        ).textContent = "+";

    }


    atualizarResumoServicos();

}


function atualizarResumoServicos() {

    const quantidade =
        estadoAgendamento.servicos.length;


    if (quantidade === 0) {

        resumoRapido.innerHTML = `
            <span>
                Nenhum serviço selecionado
            </span>
        `;

        botaoContinuar.disabled = true;

        return;
    }


    const valorTotal =
        estadoAgendamento.servicos.reduce(
            function (total, servico) {

                return total +
                    Number(servico.preco);

            },
            0
        );


    const duracaoTotal =
        estadoAgendamento.servicos.reduce(
            function (total, servico) {

                return total +
                    Number(servico.duracao_minutos);

            },
            0
        );


    resumoRapido.innerHTML = `
        <strong>
            ${quantidade}
            ${quantidade === 1
                ? "serviço"
                : "serviços"}
        </strong>

        &nbsp;•&nbsp;

        ${formatarDuracao(duracaoTotal)}

        &nbsp;•&nbsp;

        <strong>
            ${formatarDinheiro(valorTotal)}
        </strong>
    `;


    botaoContinuar.disabled = false;

}


function formatarDinheiro(valor) {

    return Number(valor).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function formatarDuracao(minutos) {

    minutos = Number(minutos);

    if (minutos < 60) {
        return `${minutos} min`;
    }


    const horas =
        Math.floor(minutos / 60);

    const restante =
        minutos % 60;


    if (restante === 0) {
        return `${horas}h`;
    }


    return `${horas}h ${restante}min`;

}

const etapas = document.querySelectorAll(".etapa");
const botaoVoltar = document.querySelector("#botao-voltar");

const etapaAtualTexto =
    document.querySelector("#etapa-atual-texto");

const porcentagemProgresso =
    document.querySelector("#porcentagem-progresso");

const barraProgresso =
    document.querySelector(
        "#barra-progresso-preenchimento"
    );


function mostrarEtapa(numeroEtapa) {

    estadoAgendamento.etapa = numeroEtapa;

    etapas.forEach(function (etapa) {

        etapa.classList.remove("ativa");

        if (
            Number(etapa.dataset.etapa) ===
            numeroEtapa
        ) {
            etapa.classList.add("ativa");
        }

    });


    const porcentagem =
        Math.round(
            (numeroEtapa / 6) * 100
        );


    etapaAtualTexto.textContent =
        `Etapa ${numeroEtapa} de 6`;

    porcentagemProgresso.textContent =
        `${porcentagem}%`;

    barraProgresso.style.width =
        `${porcentagem}%`;


    botaoVoltar.disabled =
        numeroEtapa === 1;


    atualizarBotaoContinuar();

}
function renderizarResumoFinal() {

    if (!resumoFinal) {
        return;
    }

    const servicos =
        estadoAgendamento.servicos || [];

    const profissional =
        estadoAgendamento.profissional;

    const cliente =
        estadoAgendamento.cliente || {};

    const nomeCliente =
        cliente.nome || "-";

    const whatsappCliente =
        cliente.whatsapp || "-";

        const duracaoTotal =
        calcularDuracaoTotal();


        function formatarWhatsApp(numero) {

    const somenteNumeros =
        String(numero || "")
            .replace(/\D/g, "");

    if (somenteNumeros.length === 11) {

        return somenteNumeros.replace(
            /(\d{2})(\d{5})(\d{4})/,
            "($1) $2-$3"
        );
    }

    if (somenteNumeros.length === 10) {

        return somenteNumeros.replace(
            /(\d{2})(\d{4})(\d{4})/,
            "($1) $2-$3"
        );
    }

    return numero || "-";
}

const horario =
    estadoAgendamento.horario || "-";

let horarioFinal = "-";

if (
    horario !== "-" &&
    duracaoTotal > 0
) {

    const partesHorario =
        horario.split(":");

    const minutosInicio =
        Number(partesHorario[0]) * 60 +
        Number(partesHorario[1]);

    const minutosFim =
        minutosInicio +
        duracaoTotal;

    const horaFim =
        String(
            Math.floor(minutosFim / 60)
        ).padStart(2, "0");

    const minutoFim =
        String(
            minutosFim % 60
        ).padStart(2, "0");

    horarioFinal =
        `${horario} — ${horaFim}:${minutoFim}`;
}

    // ==============================
    // DURAÇÃO
    // ==============================

    
    const horas =
        Math.floor(duracaoTotal / 60);

    const minutos =
        duracaoTotal % 60;

    let textoDuracao = "";

    if (horas > 0) {

        textoDuracao = `${horas}h`;

        if (minutos > 0) {
            textoDuracao += ` ${minutos}min`;
        }

    } else {

        textoDuracao =
            `${minutos} min`;
    }


    // ==============================
    // VALOR
    // ==============================

    const valorTotal =
        servicos.reduce(
            function (total, servico) {

                return (
                    total +
                    Number(servico.preco || 0)
                );
            },
            0
        );


    // ==============================
    // DATA
    // ==============================

    let dataFormatada = "-";

    if (estadoAgendamento.data) {

        let dataLocal;

        if (
            typeof estadoAgendamento.data === "string"
        ) {

            const partes =
                estadoAgendamento.data.split("-");

            dataLocal =
                new Date(
                    Number(partes[0]),
                    Number(partes[1]) - 1,
                    Number(partes[2])
                );

        } else {

            dataLocal =
                new Date(
                    estadoAgendamento.data
                );
        }

        dataFormatada =
            dataLocal.toLocaleDateString(
                "pt-BR",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );
    }


    // ==============================
    // SERVIÇOS
    // ==============================

    const nomesServicos =
        servicos
            .map(
                function (servico) {
                    return servico.nome;
                }
            )
            .join(" + ");


    // ==============================
    // HTML DO RESUMO
    // ==============================

    resumoFinal.innerHTML = `
        <div class="resumo-final-linha">
            <span>Cliente</span>
            <strong>
                ${
    nomeCliente.charAt(0).toUpperCase() +
    nomeCliente.slice(1)
}
            </strong>
        </div>

        <div class="resumo-final-linha">
            <span>WhatsApp</span>
            <strong>
                ${formatarWhatsApp(whatsappCliente).replace(
    /(\(\d{2}\))\s\d{5}-(\d{4})/,
    "$1 *****-$2"
)}
            </strong>
        </div>

        <div class="resumo-final-linha">
            <span>Profissional</span>
            <strong>
                ${
                    profissional
                        ? profissional.nome
                        : "-"
                }
            </strong>
        </div>

        <div class="resumo-final-linha">
            <span>Serviços</span>
            <strong>
                ${nomesServicos || "-"}
            </strong>
        </div>

        <div class="resumo-final-linha">
            <span>Data</span>
            <strong>
                ${dataFormatada}
            </strong>
        </div>

        <div class="resumo-final-linha">
            <span>Horário</span>
            <strong>
                ${horarioFinal}
            </strong>
        </div>

        <div class="resumo-final-linha">
            <span>Duração</span>
            <strong>
                ${textoDuracao}
            </strong>
        </div>

        <div class="resumo-final-total">
            <span>Total</span>

            <strong>
                ${
                    valorTotal.toLocaleString(
                        "pt-BR",
                        {
                            style: "currency",
                            currency: "BRL"
                        }
                    )
                }
            </strong>
        </div>
    `;
}

function atualizarBotaoContinuar() {

    const etapa =
        estadoAgendamento.etapa;


    if (etapa === 1) {

        botaoContinuar.disabled =
            estadoAgendamento.servicos.length === 0;

        botaoContinuar.innerHTML = `
            Continuar
            <span>→</span>
        `;

    }


    if (etapa === 2) {

        botaoContinuar.disabled =
            !estadoAgendamento.profissional;

    }


    if (etapa === 3) {

        botaoContinuar.disabled =
            !estadoAgendamento.data;

    }


    if (etapa === 4) {

        botaoContinuar.disabled =
            !estadoAgendamento.horario;

    }


    if (etapa === 5) {

        botaoContinuar.disabled = false;

    }


    if (etapa === 6) {

        botaoContinuar.disabled = false;

        botaoContinuar.innerHTML = `
            Confirmar agendamento
            <span>✓</span>
        `;
        renderizarResumoFinal();

    }

}
async function finalizarAgendamento() {

    if (!estadoAgendamento.profissional) {
        alert("Profissional não selecionado.");
        return;
    }

    if (!estadoAgendamento.data) {
        alert("Data não selecionada.");
        return;
    }

    if (!estadoAgendamento.horario) {
        alert("Horário não selecionado.");
        return;
    }

    if (!estadoAgendamento.cliente.nome) {
        alert("Informe seu nome.");
        return;
    }

    if (!estadoAgendamento.cliente.whatsapp) {
        alert("Informe seu WhatsApp.");
        return;
    }

    if (!estadoAgendamento.servicos.length) {
        alert("Selecione pelo menos um serviço.");
        return;
    }


    const [hora, minuto] =
        estadoAgendamento.horario
            .split(":")
            .map(Number);


    const inicio =
        new Date(
            estadoAgendamento.data
        );

    inicio.setHours(
        hora,
        minuto,
        0,
        0
    );


    const idsServicos =
        estadoAgendamento.servicos.map(
            function (servico) {
                return servico.id;
            }
        );


    botaoContinuar.disabled = true;

    botaoContinuar.textContent =
        "Confirmando...";


    const {
        data,
        error
    } = await supabaseV2.rpc(
        "criar_agendamento_publico",
        {
            p_barbearia_id:
                obterBarbeariaId(),

            p_profissional_id:
                estadoAgendamento.profissional.id,

            p_nome:
                estadoAgendamento.cliente.nome,

            p_whatsapp:
                estadoAgendamento.cliente.whatsapp,

            p_inicio:
                inicio.toISOString(),

            p_servicos:
                idsServicos
        }
    );


    if (error) {

        console.error(
            "Erro ao confirmar agendamento:",
            error
        );

        alert(
            error.message ||
            "Não foi possível confirmar o agendamento."
        );

        botaoContinuar.disabled = false;

        atualizarBotaoContinuar();

        return;
    }


    console.log(
        "Agendamento criado:",
        data
    );


    alert(
        "Agendamento confirmado com sucesso!"
    );


    if (
        data &&
        data.token_cliente
    ) {
        localStorage.setItem(
            "token_agendamento_cliente",
            data.token_cliente
        );
    }


    estadoAgendamento.etapa = 1;
    estadoAgendamento.servicos = [];
    estadoAgendamento.profissional = null;
    estadoAgendamento.data = null;
    estadoAgendamento.horario = null;

    estadoAgendamento.cliente.nome = "";
    estadoAgendamento.cliente.whatsapp = "";

    inputClienteNome.value = "";
    inputClienteWhatsapp.value = "";

    await carregarServicos();

    mostrarEtapa(1);
}

botaoContinuar.addEventListener(
    "click",
    async function () {

        const etapa =
            estadoAgendamento.etapa;


        if (etapa === 1) {

            mostrarEtapa(2);

            await carregarProfissionais();

            return;
        }


        if (etapa === 2) {

    mostrarEtapa(3);

    await carregarCalendario();

    return;

}

if (etapa === 3) {

    mostrarEtapa(4);

    await carregarHorariosDisponiveis();

    return;

}


if (etapa === 5) {

    if (!formularioCliente.checkValidity()) {
        formularioCliente.reportValidity();
        return;
    }

    estadoAgendamento.cliente.nome =
        inputClienteNome.value.trim();

        estadoAgendamento.cliente.whatsapp =
    inputClienteWhatsapp.value
        .replace(/\D/g, "");

    mostrarEtapa(6);

    return;
}
if (etapa === 6) {

    await finalizarAgendamento();

    return;
}

if (etapa < 6) {

    mostrarEtapa(etapa + 1);

}


        

    }
);


botaoVoltar.addEventListener(
    "click",
    function () {

        const etapa =
            estadoAgendamento.etapa;


        if (etapa > 1) {

            mostrarEtapa(etapa - 1);

        }

    }
);

async function carregarProfissionais() {

    const listaProfissionais =
        document.querySelector(
            "#lista-profissionais"
        );


    listaProfissionais.innerHTML = `
        <div class="estado-carregando">
            <div class="loader"></div>
            <p>
                Buscando profissionais...
            </p>
        </div>
    `;


    const idsServicos =
        estadoAgendamento.servicos.map(
            function (servico) {
                return servico.id;
            }
        );


    const {
        data: vinculos,
        error
    } = await supabaseV2
        .from("profissional_servicos")
        .select(`
            profissional_id,
            servico_id,
            profissionais (
                id,
                nome,
                foto_url,
                ativo
            )
        `)
        .in("servico_id", idsServicos)
        .eq("ativo", true);


    if (error) {

        console.error(
            "Erro ao carregar profissionais:",
            error
        );

        listaProfissionais.innerHTML = `
            <div class="estado-carregando">
                <p>
                    Não foi possível carregar
                    os profissionais.
                </p>
            </div>
        `;

        return;
    }


    const mapaProfissionais = {};


    vinculos.forEach(function (vinculo) {

        const profissional =
            vinculo.profissionais;


        if (!profissional) {
            return;
        }


        if (
            !mapaProfissionais[
                profissional.id
            ]
        ) {

            mapaProfissionais[
                profissional.id
            ] = {
                profissional:
                    profissional,

                servicos:
                    new Set()
            };
        }


        mapaProfissionais[
            profissional.id
        ].servicos.add(
            vinculo.servico_id
        );

    });


    const candidatos =
        Object.values(
            mapaProfissionais
        )
        .filter(function (item) {

            return (
                item.servicos.size ===
                idsServicos.length
            );

        })
        .map(function (item) {

            return item.profissional;

        })
        .filter(function (profissional) {

            return profissional?.ativo === true;

        });


    const idsCandidatos =
        candidatos.map(
            function (profissional) {
                return profissional.id;
            }
        );


    let profissionaisCompativeis = [];


    if (idsCandidatos.length) {

        const {
            data: profissionaisDaBarbearia,
            error: erroProfissionaisDaBarbearia
        } =
            await supabaseV2
                .from("profissionais")
                .select(
                    "id, nome, foto_url, ativo"
                )
                .eq(
                    "barbearia_id",
                    obterBarbeariaId()
                )
                .eq(
                    "ativo",
                    true
                )
                .in(
                    "id",
                    idsCandidatos
                )
                .order(
                    "nome"
                );


        if (erroProfissionaisDaBarbearia) {

            console.error(
                "Erro ao validar profissionais da barbearia:",
                erroProfissionaisDaBarbearia
            );

            listaProfissionais.innerHTML = `
                <div class="estado-carregando">
                    <p>
                        Não foi possível carregar
                        os profissionais.
                    </p>
                </div>
            `;

            return;
        }


        profissionaisCompativeis =
            profissionaisDaBarbearia || [];
    }


    listaProfissionais.innerHTML = "";


    if (
        profissionaisCompativeis.length === 0
    ) {

        listaProfissionais.innerHTML = `
            <div class="estado-carregando">
                <p>
                    Nenhum profissional disponível
                    para todos os serviços escolhidos.
                </p>
            </div>
        `;

        return;
    }


    profissionaisCompativeis.forEach(
        function (profissional) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "card-profissional";


            card.innerHTML = `

                <div class="seletor-card">
                    +
                </div>

                <h3>
                    ${profissional.nome}
                </h3>

                <p>
                    Disponível para os serviços
                    selecionados.
                </p>

            `;


            card.addEventListener(
                "click",
                function () {

                    selecionarProfissional(
                        profissional,
                        card
                    );

                }
            );


            listaProfissionais
                .appendChild(card);

        }
    );

}


function selecionarProfissional(
    profissional,
    card
) {

    document
        .querySelectorAll(
            ".card-profissional"
        )
        .forEach(function (item) {

            item.classList.remove(
                "selecionado"
            );

            const seletor =
                item.querySelector(
                    ".seletor-card"
                );

            if (seletor) {
                seletor.textContent = "+";
            }

        });


    estadoAgendamento.profissional =
        profissional;


    card.classList.add(
        "selecionado"
    );


    card.querySelector(
        ".seletor-card"
    ).textContent = "✓";


    atualizarBotaoContinuar();

}

// =========================================================
// CALENDÁRIO
// =========================================================

let mesCalendario = new Date();

const tituloMes =
    document.querySelector("#titulo-mes");

const diasCalendario =
    document.querySelector("#dias-calendario");

const botaoMesAnterior =
    document.querySelector("#mes-anterior");

const botaoProximoMes =
    document.querySelector("#proximo-mes");


async function carregarCalendario() {

    if (!estadoAgendamento.profissional) {
        return;
    }


    diasCalendario.innerHTML = `
        <div class="estado-carregando">
            <div class="loader"></div>
            <p>Carregando agenda...</p>
        </div>
    `;


    const { data: horarios, error } =
        await supabaseV2
            .from("horarios_profissionais")
            .select(
                "dia_semana, hora_inicio, hora_fim"
            )
            .eq(
                "profissional_id",
                estadoAgendamento.profissional.id
            )
            .eq("ativo", true);


    if (error) {

        console.error(
            "Erro ao carregar horários:",
            error
        );

        diasCalendario.innerHTML = `
            <p>
                Não foi possível carregar
                a agenda do profissional.
            </p>
        `;

        return;
    }


    const diasPermitidos =
        horarios.map(function (horario) {

            return Number(
                horario.dia_semana
            );

        });


    const ano =
        mesCalendario.getFullYear();

    const mes =
        mesCalendario.getMonth();

    const inicioMes =
        `${ano}-${String(
            mes + 1
        ).padStart(2, "0")}-01`;

    const ultimoDia =
        new Date(
            ano,
            mes + 1,
            0
        ).getDate();

    const fimMes =
        `${ano}-${String(
            mes + 1
        ).padStart(2, "0")}-${String(
            ultimoDia
        ).padStart(2, "0")}`;


    const {
        data: excecoes,
        error: erroExcecoes
    } =
        await supabaseV2
            .from("excecoes_expediente")
            .select(
                "data, tipo, hora_inicio, hora_fim"
            )
            .eq(
                "barbearia_id",
                obterBarbeariaId()
            )
            .eq(
                "profissional_id",
                estadoAgendamento.profissional.id
            )
            .gte(
                "data",
                inicioMes
            )
            .lte(
                "data",
                fimMes
            );


    if (erroExcecoes) {

        console.error(
            "Erro ao carregar exceções do expediente:",
            erroExcecoes
        );

        diasCalendario.innerHTML = `
            <p>
                Não foi possível carregar
                a agenda do profissional.
            </p>
        `;

        return;
    }


    const excecoesPorData = {};

    (excecoes || []).forEach(
        function (excecao) {
            excecoesPorData[
                excecao.data
            ] = excecao;
        }
    );


    renderizarCalendario(
        diasPermitidos,
        excecoesPorData
    );

}


function renderizarCalendario(
    diasPermitidos,
    excecoesPorData = {}
) {

    diasCalendario.innerHTML = "";


    const ano =
        mesCalendario.getFullYear();

    const mes =
        mesCalendario.getMonth();


    const nomesMeses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];


    tituloMes.textContent =
        `${nomesMeses[mes]} ${ano}`;


    const primeiroDia =
        new Date(
            ano,
            mes,
            1
        ).getDay();


    const quantidadeDias =
        new Date(
            ano,
            mes + 1,
            0
        ).getDate();


    // espaços antes do primeiro dia
    for (
        let i = 0;
        i < primeiroDia;
        i++
    ) {

        const vazio =
            document.createElement("div");

        diasCalendario.appendChild(
            vazio
        );

    }


    const hoje = new Date();

    hoje.setHours(
        0,
        0,
        0,
        0
    );


    for (
        let dia = 1;
        dia <= quantidadeDias;
        dia++
    ) {

        const data =
            new Date(
                ano,
                mes,
                dia
            );


        const numeroSemana =
            data.getDay();


        const botao =
            document.createElement(
                "button"
            );


        botao.type = "button";

        botao.className =
            "dia-calendario";

        botao.textContent =
            dia;


        const dataPassada =
            data < hoje;


        const chaveData =
            `${ano}-${String(
                mes + 1
            ).padStart(2, "0")}-${String(
                dia
            ).padStart(2, "0")}`;

        const excecao =
            excecoesPorData[
                chaveData
            ] || null;

        const fechadoPorExcecao =
            excecao?.tipo ===
            "fechado";

        const horarioEspecial =
            excecao?.tipo ===
            "horario_especial";

        const profissionalAtende =
            horarioEspecial ||
            (
                diasPermitidos.includes(
                    numeroSemana
                ) &&
                !fechadoPorExcecao
            );


        if (
            dataPassada ||
            !profissionalAtende
        ) {

            botao.classList.add(
                "indisponivel"
            );

            botao.disabled = true;

        } else {

            botao.addEventListener(
                "click",
                function () {

                    selecionarData(
                        data,
                        botao
                    );

                }
            );

        }


        if (
            estadoAgendamento.data
        ) {

            const selecionada =
                new Date(
                    estadoAgendamento.data
                );


            if (
                selecionada.getFullYear()
                    === data.getFullYear()
                &&
                selecionada.getMonth()
                    === data.getMonth()
                &&
                selecionada.getDate()
                    === data.getDate()
            ) {

                botao.classList.add(
                    "selecionado"
                );

            }

        }


        diasCalendario.appendChild(
            botao
        );

    }

}


function selecionarData(
    data,
    botao
) {

    document
        .querySelectorAll(
            ".dia-calendario"
        )
        .forEach(function (dia) {

            dia.classList.remove(
                "selecionado"
            );

        });


    botao.classList.add(
        "selecionado"
    );


    estadoAgendamento.data =
        data;


    // mudou a data:
    // horário antigo deixa de valer
    estadoAgendamento.horario =
        null;


    atualizarBotaoContinuar();

}


botaoMesAnterior.addEventListener(
    "click",
    async function () {

        mesCalendario =
            new Date(
                mesCalendario.getFullYear(),
                mesCalendario.getMonth() - 1,
                1
            );


        await carregarCalendario();

    }
);


botaoProximoMes.addEventListener(
    "click",
    async function () {

        mesCalendario =
            new Date(
                mesCalendario.getFullYear(),
                mesCalendario.getMonth() + 1,
                1
            );


        await carregarCalendario();

    }
);

// =========================================================
// HORÁRIOS DISPONÍVEIS
// =========================================================

const listaHorarios =
    document.querySelector("#lista-horarios");

const dataHorarios =
    document.querySelector("#data-horarios");


function calcularDuracaoTotal() {

    return estadoAgendamento.servicos.reduce(
        function (total, servico) {

            return total +
                Number(servico.duracao_minutos);

        },
        0
    );

}


function minutosParaHorario(totalMinutos) {

    const horas =
        Math.floor(totalMinutos / 60);

    const minutos =
        totalMinutos % 60;


    return (
        String(horas).padStart(2, "0")
        +
        ":"
        +
        String(minutos).padStart(2, "0")
    );

}


function horarioParaMinutos(horario) {

    const partes =
        horario.split(":");


    const horas =
        Number(partes[0]);

    const minutos =
        Number(partes[1]);


    return (
        horas * 60 +
        minutos
    );

}


function formatarDataCompleta(data) {

    return data.toLocaleDateString(
        "pt-BR",
        {
            weekday: "long",
            day: "2-digit",
            month: "long"
        }
    );

}


async function carregarHorariosDisponiveis() {

    if (
        !estadoAgendamento.profissional ||
        !estadoAgendamento.data
    ) {
        return;
    }


    listaHorarios.innerHTML = `
        <div class="estado-carregando">
            <div class="loader"></div>

            <p>
                Buscando horários disponíveis...
            </p>
        </div>
    `;


    dataHorarios.textContent =
        formatarDataCompleta(
            estadoAgendamento.data
        );


    const diaSemana =
        estadoAgendamento.data.getDay();


    const anoData =
        estadoAgendamento.data.getFullYear();

    const mesData =
        String(
            estadoAgendamento.data.getMonth() + 1
        ).padStart(2, "0");

    const diaData =
        String(
            estadoAgendamento.data.getDate()
        ).padStart(2, "0");

    const dataChave =
        `${anoData}-${mesData}-${diaData}`;


    const {
        data: excecaoData,
        error: erroExcecaoData
    } =
        await supabaseV2
            .from("excecoes_expediente")
            .select(
                "tipo, hora_inicio, hora_fim"
            )
            .eq(
                "barbearia_id",
                obterBarbeariaId()
            )
            .eq(
                "profissional_id",
                estadoAgendamento.profissional.id
            )
            .eq(
                "data",
                dataChave
            )
            .maybeSingle();


    if (erroExcecaoData) {

        console.error(
            "Erro ao consultar exceção do expediente:",
            erroExcecaoData
        );

        listaHorarios.innerHTML = `
            <div class="estado-carregando">
                <p>
                    Não foi possível consultar
                    a disponibilidade.
                </p>
            </div>
        `;

        return;
    }


    if (
        excecaoData?.tipo ===
        "fechado"
    ) {

        listaHorarios.innerHTML = `
            <div class="estado-carregando">
                <p>
                    O profissional não atende
                    nesta data.
                </p>
            </div>
        `;

        return;
    }


    // ==========================================
    // EXPEDIENTE DO PROFISSIONAL
    // ==========================================

    let {
        data: expedientes,
        error: erroExpediente
    } = await supabaseV2
        .from("horarios_profissionais")
        .select(
            "hora_inicio, hora_fim"
        )
        .eq(
            "profissional_id",
            estadoAgendamento.profissional.id
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
            "Erro ao carregar expediente:",
            erroExpediente
        );

        listaHorarios.innerHTML = `
            <div class="estado-carregando">
                <p>
                    Não foi possível carregar
                    os horários.
                </p>
            </div>
        `;

        return;
    }


    if (
        excecaoData?.tipo ===
        "horario_especial"
    ) {

        expedientes = [
            {
                hora_inicio:
                    excecaoData.hora_inicio,

                hora_fim:
                    excecaoData.hora_fim
            }
        ];
    }


    if (
        !expedientes ||
        expedientes.length === 0
    ) {

        listaHorarios.innerHTML = `
            <div class="estado-carregando">
                <p>
                    Não há expediente configurado
                    para esta data.
                </p>
            </div>
        `;

        return;
    }


    // ==========================================
    // INÍCIO E FINAL DO DIA
    // ==========================================

    const inicioDia =
        new Date(
            estadoAgendamento.data
        );

    inicioDia.setHours(
        0,
        0,
        0,
        0
    );


    const fimDia =
        new Date(
            estadoAgendamento.data
        );

    fimDia.setHours(
        23,
        59,
        59,
        999
    );


    // ==========================================
    // CONSULTAR AGENDAMENTOS + BLOQUEIOS
    // ==========================================

    const {
        data: ocupacoes,
        error: erroOcupacoes
    } = await supabaseV2.rpc(
        "ocupacoes_agenda",
        {
            p_profissional_id:
                estadoAgendamento.profissional.id,

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

        listaHorarios.innerHTML = `
            <div class="estado-carregando">
                <p>
                    Não foi possível consultar
                    a disponibilidade.
                </p>
            </div>
        `;

        return;
    }
const duracaoTotal =
        calcularDuracaoTotal();


    // horários começam de 15 em 15 minutos
    const intervaloAgenda = 15;


    const horariosDisponiveis = [];


    // ==========================================
    // GERAR POSSÍVEIS HORÁRIOS
    // ==========================================

    expedientes.forEach(
        function (expediente) {

            const inicioExpediente =
                horarioParaMinutos(
                    expediente.hora_inicio
                );


            const fimExpediente =
                horarioParaMinutos(
                    expediente.hora_fim
                );


            for (
                let minuto = inicioExpediente;
                minuto + duracaoTotal <= fimExpediente;
                minuto += intervaloAgenda
            ) {

                const horarioInicio =
                    criarDataComHorario(
                        estadoAgendamento.data,
                        minuto
                    );


                const horarioFim =
                    new Date(
                        horarioInicio.getTime() +
                        duracaoTotal *
                        60 *
                        1000
                    );


                const possuiConflito =
                    ocupacoes.some(
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
                                horarioInicio < ocupadoFim
                                &&
                                horarioFim > ocupadoInicio
                            );

                        }
                    );


                if (!possuiConflito) {

                    horariosDisponiveis.push(
                        minutosParaHorario(
                            minuto
                        )
                    );

                }

            }

        }
    );


    renderizarHorarios(
        horariosDisponiveis
    );

    function criarDataComHorario(
    dataBase,
    minutosDoDia
) {

    let ano;
    let mes;
    let dia;

    if (
        typeof dataBase === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(dataBase)
    ) {

        const partes = dataBase.split("-");

        ano = Number(partes[0]);
        mes = Number(partes[1]) - 1;
        dia = Number(partes[2]);

    } else {

        const dataOriginal =
            new Date(dataBase);

        ano = dataOriginal.getFullYear();
        mes = dataOriginal.getMonth();
        dia = dataOriginal.getDate();
    }


    const horas =
        Math.floor(
            minutosDoDia / 60
        );

    const minutos =
        minutosDoDia % 60;


    return new Date(
        ano,
        mes,
        dia,
        horas,
        minutos,
        0,
        0
    );
}

}

function selecionarHorario(horario, botao) {

    estadoAgendamento.horario = horario;

    document
        .querySelectorAll(".horario")
        .forEach(function (item) {
            item.classList.remove("selecionado");
        });

    botao.classList.add("selecionado");

    atualizarBotaoContinuar();
}

function renderizarHorarios(horarios) {

    listaHorarios.innerHTML = "";

    if (!horarios || horarios.length === 0) {

        listaHorarios.innerHTML = `
            <div class="estado-carregando">
                <p>
                    Nenhum horário disponível
                    para os serviços escolhidos.
                </p>
            </div>
        `;

        return;
    }

    horarios.forEach(function (horario) {

        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = "horario";
        botao.textContent = horario;

        botao.addEventListener("click", function () {

            selecionarHorario(
                horario,
                botao
            );

        });

        listaHorarios.appendChild(botao);

    });

}

function mostrarErroPaginaPublica(
    titulo,
    mensagem
) {

    const conteudo =
        document.querySelector(
            ".conteudo-agendamento"
        );

    const rodape =
        document.querySelector(
            "#rodape-agendamento"
        );

    const progresso =
        document.querySelector(
            ".progresso"
        );


    if (progresso) {
        progresso.style.display = "none";
    }


    if (rodape) {
        rodape.style.display = "none";
    }


    if (conteudo) {

        conteudo.innerHTML = `
            <section
                class="etapa ativa"
                style="
                    display: block;
                    text-align: center;
                    padding: 48px 20px;
                "
            >
                <div class="cabecalho-etapa">

                    <span class="etiqueta">
                        AGENDAMENTO ONLINE
                    </span>

                    <h1>
                        ${titulo}
                    </h1>

                    <p>
                        ${mensagem}
                    </p>

                </div>
            </section>
        `;
    }


    document.title =
        "Agendamento Online";
}


async function iniciarAgendamentoPublico() {

    try {

        await carregarBarbeariaPublica();

        await carregarServicos();

        mostrarEtapa(1);

    } catch (erro) {

        console.error(
            "Erro ao iniciar agendamento público:",
            erro
        );


        if (
            erro?.message ===
            "LINK_PUBLICO_SEM_BARBEARIA"
        ) {

            mostrarErroPaginaPublica(
                "Link de agendamento incompleto.",
                "Use o link oficial enviado pela barbearia para acessar os horários disponíveis."
            );

            return;
        }


        if (
            erro?.message ===
            "BARBEARIA_PUBLICA_NAO_ENCONTRADA"
        ) {

            mostrarErroPaginaPublica(
                "Barbearia não encontrada.",
                "Este link pode estar incorreto, desativado ou não estar mais disponível."
            );

            return;
        }


        mostrarErroPaginaPublica(
            "Não foi possível abrir o agendamento.",
            "Tente novamente em alguns instantes ou solicite um novo link à barbearia."
        );
    }
}


iniciarAgendamentoPublico();