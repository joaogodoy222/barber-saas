const SUPABASE_URL = "https://acmhagdtakcrtghfcfsa.supabase.co";
const SUPABASE_KEY = "sb_publishable_7oMvKLPtWmRc6LdnR48gPQ_u38t2hS1";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ===============================
// ESTADO DO AGENDAMENTO
// ===============================

let servicoSelecionado = "";
let barbeiroSelecionado = "";
let horarioSelecionado = "";


// ===============================
// ELEMENTOS
// ===============================

const botoesServico =
    document.querySelectorAll(".servico");

const botoesBarbeiro =
    document.querySelectorAll(".barbeiro");

const etapaBarbeiro =
    document.querySelector("#etapa-barbeiro");

const etapaData =
    document.querySelector("#etapa-data");

const etapaHorario =
    document.querySelector("#etapa-horario");

const etapaCliente =
    document.querySelector("#etapa-cliente");

const campoData =
    document.querySelector("#data-agendamento");

const mensagemData =
    document.querySelector("#mensagem-data");

const areaHorarios =
    document.querySelector("#horarios");

const semHorarios =
    document.querySelector("#sem-horarios");

const botaoConfirmar =
    document.querySelector("#confirmar-agendamento");

const confirmacao =
    document.querySelector("#confirmacao");

const resumoAgendamento =
    document.querySelector("#resumo-agendamento");

const botaoNovoAgendamento =
    document.querySelector("#novo-agendamento");


// ===============================
// HORÁRIOS PADRÃO
// ===============================

const horariosPadrao = [
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00"
];


// ===============================
// PROGRESSO
// ===============================

function atualizarProgresso(etapa) {

    const passos = document.querySelectorAll(".passo");
    const linhas = document.querySelectorAll(".linha");

    passos.forEach(function(passo, index) {

        const numero = Number(passo.dataset.passo);

        passo.classList.remove("ativo", "concluido");

        if (numero < etapa) {

            passo.classList.add("concluido");
            passo.textContent = "✓";

            if (linhas[index]) {
                linhas[index].classList.add("concluida");
            }

        } else {

            passo.textContent = numero;

            if (linhas[index]) {
                linhas[index].classList.remove("concluida");
            }

        }

        if (numero === etapa) {
            passo.classList.add("ativo");
        }

    });

}
function destacarEtapa(etapaAtual) {

    const etapas = [
        document.querySelector("#etapa-servico"),
        document.querySelector("#etapa-barbeiro"),
        document.querySelector("#etapa-data"),
        document.querySelector("#etapa-horario"),
        document.querySelector("#etapa-cliente")
    ];

    etapas.forEach(function(etapa, index) {

        if (!etapa) {
            return;
        }

        etapa.classList.remove(
            "etapa-ativa",
            "etapa-concluida"
        );

        const numeroEtapa = index + 1;

        if (numeroEtapa === etapaAtual) {
            etapa.classList.add("etapa-ativa");
        }

        if (numeroEtapa < etapaAtual) {
            etapa.classList.add("etapa-concluida");
        }

    });
}
destacarEtapa(1);

// ===============================
// SERVIÇO
// ===============================

botoesServico.forEach(function(botao) {

    botao.addEventListener(
        "click",
        function() {

            botoesServico.forEach(
                function(outroBotao) {

                    outroBotao
                        .classList
                        .remove("selecionado");

                }
            );

            botao
                .classList
                .add("selecionado");

            servicoSelecionado =
                botao.dataset.servico;


            // limpa etapas seguintes

            barbeiroSelecionado = "";
            horarioSelecionado = "";

            botoesBarbeiro.forEach(
                function(barbeiro) {

                    barbeiro
                        .classList
                        .remove("selecionado");

                }
            );

            campoData.value = "";

            etapaHorario
                .classList
                .add("escondido");

            etapaCliente
                .classList
                .add("escondido");

            confirmacao
                .classList
                .add("escondido");


            etapaBarbeiro
                .classList
                .remove("escondido");

            atualizarProgresso(2);
            destacarEtapa(2);

        }
    );

});


// ===============================
// BARBEIRO
// ===============================

botoesBarbeiro.forEach(function(botao) {

    botao.addEventListener(
        "click",
        async function() {

            botoesBarbeiro.forEach(
                function(outroBotao) {

                    outroBotao
                        .classList
                        .remove("selecionado");

                }
            );

            botao
                .classList
                .add("selecionado");

            barbeiroSelecionado =
                botao.dataset.barbeiro;

            horarioSelecionado = "";

            etapaCliente
                .classList
                .add("escondido");

            etapaData
                .classList
                .remove("escondido");

            atualizarProgresso(3);
            destacarEtapa(3);


            // Se já houver data,
            // atualiza automaticamente
            // os horários do novo barbeiro.

            if (campoData.value !== "") {
                await carregarHorariosDisponiveis();
            }

        }
    );

});


// ===============================
// DATA
// ===============================

campoData.addEventListener(
    "change",
    carregarHorariosDisponiveis
);


async function carregarHorariosDisponiveis() {

    const dataEscolhida =
        campoData.value;


    mensagemData
        .classList
        .add("escondido");

    semHorarios
        .classList
        .add("escondido");

    etapaHorario
        .classList
        .add("escondido");

    etapaCliente
        .classList
        .add("escondido");

    horarioSelecionado = "";


    if (
        !dataEscolhida ||
        !barbeiroSelecionado
    ) {
        return;
    }


    // -------------------------------
    // CONVERTE DATA SEM PROBLEMA
    // DE FUSO HORÁRIO
    // -------------------------------

    const [
        anoSelecionado,
        mesSelecionado,
        diaSelecionado
    ] = dataEscolhida
        .split("-")
        .map(Number);


    const dataSelecionada =
        new Date(
            anoSelecionado,
            mesSelecionado - 1,
            diaSelecionado
        );


    // -------------------------------
    // DATA PASSADA
    // -------------------------------

    const hojeComparacao =
        new Date();

    hojeComparacao
        .setHours(0, 0, 0, 0);


    if (
        dataSelecionada <
        hojeComparacao
    ) {

        mensagemData.textContent =
            "Essa data já passou. Escolha uma nova data para continuar com seu agendamento. 😊";

        mensagemData
            .classList
            .remove("escondido");

        return;

    }


    // -------------------------------
    // DOMINGO E SEGUNDA
    // -------------------------------

    const diaDaSemana =
        dataSelecionada.getDay();


    if (
        diaDaSemana === 0 ||
        diaDaSemana === 1
    ) {

        mensagemData.textContent =
            "Não atendemos aos domingos e segundas-feiras. Escolha outro dia para continuar. 😊";

        mensagemData
            .classList
            .remove("escondido");

        return;

    }


    // -------------------------------
    // CONSULTA HORÁRIOS OCUPADOS
    // -------------------------------

    const {
        data: agendamentosExistentes,
        error
    } = await supabaseClient.rpc(
        "horarios_ocupados",

        {
    
            p_barbeiro: barbeiroSelecionado,
            p_data: dataEscolhida
        }
    );

    if (error) {

        console.error(
            "Erro ao consultar horários:",
            error
        );

        mensagemData.textContent =
            "Não conseguimos carregar os horários. Tente novamente.";

        mensagemData
            .classList
            .remove("escondido");

        return;
    }


    const horariosOcupados =
        agendamentosExistentes.map(
            function(agendamento) {

                return agendamento
                    .horario
                    .substring(0, 5);

            }
        );


    const agora = new Date();

const mesmaData =
    dataSelecionada.getFullYear() === agora.getFullYear() &&
    dataSelecionada.getMonth() === agora.getMonth() &&
    dataSelecionada.getDate() === agora.getDate();

const horariosDisponiveis =
    horariosPadrao.filter(
        function(horario) {

            const estaOcupado =
                horariosOcupados.includes(horario);

            if (estaOcupado) {
                return false;
            }

            if (mesmaData) {

                const [hora, minuto] =
                    horario.split(":").map(Number);

                const horarioDoDia =
                    new Date(
                        agora.getFullYear(),
                        agora.getMonth(),
                        agora.getDate(),
                        hora,
                        minuto
                    );

                if (horarioDoDia <= agora) {
                    return false;
                }
            }

            return true;
        }
    );


    // limpa horários antigos

    areaHorarios.innerHTML = "";


    if (
        horariosDisponiveis.length === 0
    ) {

        etapaHorario
            .classList
            .remove("escondido");

        semHorarios
            .classList
            .remove("escondido");

        atualizarProgresso(4);
        destacarEtapa(4);

        return;
    }


    // cria somente horários livres

    horariosDisponiveis.forEach(
        function(horario) {

            const botao =
                document.createElement(
                    "button"
                );

            botao.className =
                "horario";

            botao.textContent =
                horario;


            botao.addEventListener(
                "click",
                function() {

                    document
                        .querySelectorAll(
                            ".horario"
                        )
                        .forEach(
                            function(outroBotao) {

                                outroBotao
                                    .classList
                                    .remove(
                                        "selecionado"
                                    );

                            }
                        );


                    botao
                        .classList
                        .add(
                            "selecionado"
                        );


                    horarioSelecionado =
                        horario;
                       
                        atualizarProgresso(5);
                        destacarEtapa(5);

                    etapaCliente
                        .classList
                        .remove(
                            "escondido"
                        );


                    atualizarProgresso(5);

                }
            );


            areaHorarios
                .appendChild(botao);

        }
    );


    etapaHorario
        .classList
        .remove("escondido");


    atualizarProgresso(4);
    destacarEtapa(4);

}


// ===============================
// CONFIRMAR AGENDAMENTO
// ===============================
function mostrarMensagemCliente(texto) {

    let mensagem =
        document.querySelector("#mensagem-cliente");

    if (!mensagem) {
        mensagem = document.createElement("div");
        mensagem.id = "mensagem-cliente";
        mensagem.className = "mensagem mensagem-erro";

        etapaCliente.prepend(mensagem);
    }

    mensagem.textContent = texto;
    mensagem.classList.remove("escondido");
}
// ======================================
// MÁSCARA AUTOMÁTICA DO WHATSAPP
// ======================================

const campoWhatsapp = document.querySelector("#whatsapp-cliente");

campoWhatsapp.addEventListener("input", function () {
    let numero = campoWhatsapp.value.replace(/\D/g, "");

    numero = numero.substring(0, 11);

    if (numero.length > 10) {
        numero = numero.replace(
            /^(\d{2})(\d{5})(\d{4})$/,
            "($1) $2-$3"
        );
    } else if (numero.length > 6) {
        numero = numero.replace(
            /^(\d{2})(\d{4})(\d{0,4})$/,
            "($1) $2-$3"
        );
    } else if (numero.length > 2) {
        numero = numero.replace(
            /^(\d{2})(\d+)/,
            "($1) $2"
        );
    } else if (numero.length > 0) {
        numero = numero.replace(
            /^(\d*)/,
            "($1"
        );
    }

    campoWhatsapp.value = numero;
});
botaoConfirmar.addEventListener(
    "click",
    async function() {

        const nome =
            document
                .querySelector(
                    "#nome-cliente"
                )
                .value
                .trim();


        const whatsapp =
            document
                .querySelector(
                    "#whatsapp-cliente"
                )
                .value
                .trim();
        
        const whatsappLimpo =
                whatsapp.replace(/\D/g, "");
            
            if (
                    
                whatsappLimpo.length < 10 ||
                whatsappLimpo.length > 11
            ) {
                mostrarMensagemCliente(
                    "Digite um WhatsApp válido com DDD."
                );
                
                return;
            }


        const data =
            campoData.value;

        const [anoAgendamento, mesAgendamento, diaAgendamento] =
            data.split("-").map(Number);
            const dataAgendamento = new Date(
                anoAgendamento,
                mesAgendamento - 1,
                diaAgendamento
        );
        const hojeAgendamento = new Date();
        hojeAgendamento.setHours(0, 0, 0, 0);
        
        if (dataAgendamento < hojeAgendamento) {
            
            mensagemData.textContent =
        "Essa data já passou. Escolha uma nova data para continuar com seu agendamento. 😊";
        
        mensagemData.classList.remove("escondido");
        
        etapaCliente.classList.add("escondido");

        etapaHorario.classList.add("escondido");

        confirmacao.classList.add("escondido");

        horarioSelecionado = "";
        
        return;
    }


        if (
            nome === "" ||
            whatsapp === ""
        ) {

            alert(
                "Preencha seu nome e WhatsApp."
            );

            return;
        }


        if (!horarioSelecionado) {

            alert(
                "Selecione um horário."
            );

            return;
        }


        botaoConfirmar.disabled = true;

        botaoConfirmar.textContent =
            "Confirmando...";


        const {
            error
        } = await supabaseClient

            .from("Agendamentos")

            .insert([
                {
                    cliente_nome: nome,

                    cliente_whatsapp:
                        whatsappLimpo,

                    servico:
                        servicoSelecionado,

                    barbeiro:
                        barbeiroSelecionado,

                    data: data,

                    horario:
                        horarioSelecionado
                }
            ]);


        if (error) {

            console.error(
                "Erro ao salvar:",
                error
            );


            // conflito de horário
            // devido à regra UNIQUE
            // que criamos no banco

            if (
                error.code === "23505"
            ) {

                mostrarMensagemCliente(
                    "Ops! Esse horário acabou de ser reservado por outra pessoa. Escolha outro horário. 😊"
                );

                await carregarHorariosDisponiveis();

            } else {

                mostrarMensagemCliente(
                    "Não foi possível concluir seu agendamento agora. Tente novamente em alguns instantes."
                );

            }


            botaoConfirmar.disabled =
                false;

            botaoConfirmar.textContent =
                "Confirmar agendamento";

            return;
        }


        // -------------------------------
        // SUCESSO
        // -------------------------------

        resumoAgendamento.innerHTML = `
            <strong>${nome}</strong><br>
            Serviço: ${servicoSelecionado}<br>
            Profissional: ${barbeiroSelecionado}<br>
            Data: ${formatarData(data)}<br>
            Horário: ${horarioSelecionado}
        `;


        confirmacao
            .classList
            .remove("escondido");


        etapaCliente
            .classList
            .add("escondido");


        botaoConfirmar.disabled =
            false;

        botaoConfirmar.textContent =
            "Confirmar agendamento";


        // atualiza horários imediatamente

        await carregarHorariosDisponiveis();


        // leva até a confirmação

        confirmacao.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }
);


// ===============================
// FORMATAR DATA
// ===============================

function formatarData(data) {

    const partes =
        data.split("-");

    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );

}


// ===============================
// NOVO AGENDAMENTO
// ===============================

botaoNovoAgendamento
    .addEventListener(
        "click",
        function() {

            servicoSelecionado = "";
            barbeiroSelecionado = "";
            horarioSelecionado = "";


            botoesServico.forEach(
                function(botao) {

                    botao
                        .classList
                        .remove(
                            "selecionado"
                        );

                }
            );


            botoesBarbeiro.forEach(
                function(botao) {

                    botao
                        .classList
                        .remove(
                            "selecionado"
                        );

                }
            );


            campoData.value = "";


            document
                .querySelector(
                    "#nome-cliente"
                )
                .value = "";


            document
                .querySelector(
                    "#whatsapp-cliente"
                )
                .value = "";


            areaHorarios.innerHTML = "";


            etapaBarbeiro
                .classList
                .add("escondido");

            etapaData
                .classList
                .add("escondido");

            etapaHorario
                .classList
                .add("escondido");

            etapaCliente
                .classList
                .add("escondido");

            confirmacao
                .classList
                .add("escondido");


            mensagemData
                .classList
                .add("escondido");


            atualizarProgresso(1);


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );