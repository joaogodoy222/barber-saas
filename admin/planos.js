// ============================================================
// PLANOS / ASSINATURA - BARBER SAAS
// ============================================================

(function () {
    "use strict";

    let contextoAtual = null;
    let assinaturaAtual = null;
    let planosDisponiveis = [];
    let carregando = false;
    let confirmandoRetornoMercadoPago = false;

    const ORDEM_PLANOS = {
        essencial: 1,
        profissional: 2,
        pro: 3,
        barbearia_pro: 3,
        "barbearia-pro": 3
    };


    function obterElemento(id) {
        return document.getElementById(id);
    }


    function normalizarCodigo(codigo) {
        return String(codigo || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");
    }


    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }


    function formatarLimite(valor, singular, plural) {
        if (valor === null || valor === undefined) {
            return `${plural} ilimitados`;
        }

        const numero = Number(valor);

        if (numero === 1) {
            return `1 ${singular}`;
        }

        return `${numero} ${plural}`;
    }


    function formatarWhatsapp(plano) {
        if (!plano.permite_whatsapp) {
            return "Sem lembretes automáticos por WhatsApp";
        }

        if (
            plano.limite_whatsapp_mes === null ||
            plano.limite_whatsapp_mes === undefined
        ) {
            return "WhatsApp ilimitado";
        }

        return `${Number(plano.limite_whatsapp_mes)} lembretes de WhatsApp/mês`;
    }


    function recursosDoPlano(plano) {
        const recursos = [
            formatarLimite(
                plano.limite_profissionais,
                "profissional",
                "profissionais"
            ),
            formatarLimite(
                plano.limite_servicos,
                "serviço",
                "serviços"
            ),
            formatarWhatsapp(plano)
        ];

        if (plano.permite_relatorios_avancados) {
            recursos.push("Relatórios avançados");
        } else {
            recursos.push("Relatórios básicos");
        }

        if (plano.permite_recursos_premium) {
            recursos.push("Recursos premium");
        }

        return recursos;
    }


    function ordemPlano(plano) {
        const codigo = normalizarCodigo(plano?.codigo);

        if (ORDEM_PLANOS[codigo]) {
            return ORDEM_PLANOS[codigo];
        }

        return Number(plano?.preco_mensal || 0);
    }


    function obterPlanoAtual() {
        if (!assinaturaAtual) {
            return null;
        }

        return (
            assinaturaAtual.plano ||
            assinaturaAtual.plan ||
            null
        );
    }


    async function resolverContexto() {
        if (contextoAtual?.barbearia?.id) {
            return contextoAtual;
        }

        if (
            window.contextoSaaS &&
            typeof window.contextoSaaS.obter === "function"
        ) {
            contextoAtual = await window.contextoSaaS.obter();

            if (contextoAtual?.barbearia?.id) {
                return contextoAtual;
            }
        }

        if (
            window.contextoSaaS &&
            typeof window.contextoSaaS.carregar === "function"
        ) {
            contextoAtual = await window.contextoSaaS.carregar();

            if (contextoAtual?.barbearia?.id) {
                return contextoAtual;
            }
        }

        throw new Error(
            "Não foi possível identificar a barbearia desta conta."
        );
    }


    async function carregarAssinatura(barbeariaId) {
        const { data, error } = await supabaseV2.rpc(
            "obter_plano_barbearia",
            {
                p_barbearia_id: barbeariaId
            }
        );

        if (error) {
            throw error;
        }

        assinaturaAtual = data || null;
        return assinaturaAtual;
    }


    async function carregarPlanos() {
        const { data, error } = await supabaseV2
            .from("planos")
            .select(`
                id,
                codigo,
                nome,
                descricao,
                preco_mensal,
                limite_profissionais,
                limite_servicos,
                limite_whatsapp_mes,
                permite_whatsapp,
                permite_relatorios_avancados,
                permite_recursos_premium,
                ativo
            `)
            .eq("ativo", true)
            .order("preco_mensal", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        planosDisponiveis = data || [];
        return planosDisponiveis;
    }


    async function contarRecursosAtivos(barbeariaId) {
        const [
            profissionaisResposta,
            servicosResposta
        ] = await Promise.all([
            supabaseV2
                .from("profissionais")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq("barbearia_id", barbeariaId)
                .eq("ativo", true),

            supabaseV2
                .from("servicos_v2")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq("barbearia_id", barbeariaId)
                .eq("ativo", true)
        ]);

        if (profissionaisResposta.error) {
            throw profissionaisResposta.error;
        }

        if (servicosResposta.error) {
            throw servicosResposta.error;
        }

        return {
            profissionais: profissionaisResposta.count || 0,
            servicos: servicosResposta.count || 0
        };
    }


    function planoComportaUso(plano, uso) {
        const limiteProfissionais = plano.limite_profissionais;
        const limiteServicos = plano.limite_servicos;

        if (
            limiteProfissionais !== null &&
            limiteProfissionais !== undefined &&
            uso.profissionais > Number(limiteProfissionais)
        ) {
            return {
                ok: false,
                motivo:
                    `Este plano aceita até ${limiteProfissionais} ` +
                    `${Number(limiteProfissionais) === 1 ? "profissional ativo" : "profissionais ativos"}.`
            };
        }

        if (
            limiteServicos !== null &&
            limiteServicos !== undefined &&
            uso.servicos > Number(limiteServicos)
        ) {
            return {
                ok: false,
                motivo:
                    `Este plano aceita até ${limiteServicos} serviços ativos.`
            };
        }

        return {
            ok: true,
            motivo: ""
        };
    }


    function criarBotaoPlano(plano, planoAtual, uso) {
        const codigoAtual = normalizarCodigo(planoAtual?.codigo);
        const codigoPlano = normalizarCodigo(plano.codigo);

        const atual =
            codigoAtual &&
            codigoPlano === codigoAtual;

        const ordemAtual = ordemPlano(planoAtual);
        const ordemDestino = ordemPlano(plano);

        const resultadoLimite =
            planoComportaUso(plano, uso);

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = atual
            ? "botao-secundario-admin"
            : "botao-principal-admin";

        botao.style.width = "100%";
        botao.style.marginTop = "18px";

        if (atual) {
            botao.textContent = "Plano atual";
            botao.disabled = true;
            return botao;
        }

        if (
            ordemDestino < ordemAtual &&
            !resultadoLimite.ok
        ) {
            botao.textContent = "Downgrade indisponível";
            botao.disabled = true;
            botao.title = resultadoLimite.motivo;
            return botao;
        }

        botao.textContent =
            ordemDestino > ordemAtual
                ? "Fazer upgrade"
                : "Escolher plano";

        botao.addEventListener("click", async function () {
            const mensagem = obterElemento(
                "mensagem-planos-admin"
            );

            if (!mensagem) {
                return;
            }

            if (ordemDestino < ordemAtual) {
                mensagem.textContent =
                    `O downgrade para ${plano.nome} será tratado no próximo ciclo de cobrança.`;
                return;
            }

            try {
                botao.disabled = true;
                botao.textContent = "Abrindo pagamento...";
                mensagem.textContent =
                    `Preparando a assinatura do plano ${plano.nome}...`;

                const contexto = await resolverContexto();
                const barbeariaId = contexto.barbearia.id;

                const {
                    data: sessao,
                    error: erroSessao
                } = await supabaseV2.auth.getSession();

                if (erroSessao) {
                    throw erroSessao;
                }

                const accessToken =
                    sessao?.session?.access_token;

                if (!accessToken) {
                    throw new Error(
                        "Sua sessão expirou. Entre novamente no painel."
                    );
                }

                const resposta = await fetch(
                    "https://acmhagdtakcrtghfcfsa.supabase.co/functions/v1/criar-assinatura-mercado-pago",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({
                            barbearia_id: barbeariaId,
                            plano_codigo: plano.codigo
                        })
                    }
                );

                let resultado = null;

                try {
                    resultado = await resposta.json();
                } catch {
                    resultado = null;
                }

                if (!resposta.ok) {
                    throw new Error(
                        resultado?.erro ||
                        "Não foi possível iniciar o pagamento."
                    );
                }

                const checkoutUrl =
                    resultado?.checkout_url;

                if (!checkoutUrl) {
                    throw new Error(
                        "O Mercado Pago não retornou o link de pagamento."
                    );
                }

                mensagem.textContent =
                    "Redirecionando para o Mercado Pago...";

                window.location.href = checkoutUrl;

            } catch (erro) {
                console.error(
                    "Erro ao iniciar assinatura:",
                    erro
                );

                mensagem.textContent =
                    erro?.message ||
                    "Não foi possível iniciar a assinatura.";

                botao.disabled = false;
                botao.textContent =
                    ordemDestino > ordemAtual
                        ? "Fazer upgrade"
                        : "Escolher plano";
            }
        });

        return botao;
    }


    function renderizarPlanoAtual(planoAtual) {
        const titulo = obterElemento(
            "planos-plano-atual"
        );

        const resumo = obterElemento(
            "planos-resumo-atual"
        );

        if (!titulo || !resumo) {
            return;
        }

        if (!planoAtual) {
            titulo.textContent = "Plano não identificado";
            resumo.textContent =
                "Não foi possível identificar os dados do plano atual.";
            return;
        }

        titulo.textContent = planoAtual.nome;

        const status =
            assinaturaAtual?.status ||
            "ativa";

        resumo.textContent =
            `${formatarMoeda(planoAtual.preco_mensal)}/mês • ` +
            `Assinatura ${status}.`;
    }


    function renderizarPlanos(uso) {
        const container = obterElemento(
            "lista-planos-admin"
        );

        if (!container) {
            return;
        }

        container.innerHTML = "";

        const planoAtual = obterPlanoAtual();

        planosDisponiveis.forEach(function (plano) {
            const artigo = document.createElement("article");
            artigo.className = "card-admin";

            const atual =
                normalizarCodigo(plano.codigo) ===
                normalizarCodigo(planoAtual?.codigo);

            if (atual) {
                artigo.style.outline =
                    "2px solid var(--cor-destaque, currentColor)";
            }

            const etiqueta = document.createElement("span");
            etiqueta.className = "card-admin-etiqueta";
            etiqueta.textContent = atual
                ? "PLANO ATUAL"
                : "PLANO";

            const titulo = document.createElement("h2");
            titulo.textContent = plano.nome;
            titulo.style.marginTop = "8px";

            const preco = document.createElement("strong");
            preco.textContent =
                `${formatarMoeda(plano.preco_mensal)}/mês`;
            preco.style.display = "block";
            preco.style.fontSize = "1.45rem";
            preco.style.marginTop = "10px";

            const descricao = document.createElement("p");
            descricao.className =
                "texto-secundario-admin";
            descricao.textContent =
                plano.descricao ||
                "Plano de gestão para sua barbearia.";
            descricao.style.marginTop = "10px";

            const lista = document.createElement("ul");
            lista.style.margin = "18px 0 0";
            lista.style.paddingLeft = "20px";

            recursosDoPlano(plano).forEach(function (recurso) {
                const item = document.createElement("li");
                item.textContent = recurso;
                item.style.marginBottom = "8px";
                lista.appendChild(item);
            });

            const botao = criarBotaoPlano(
                plano,
                planoAtual,
                uso
            );

            artigo.appendChild(etiqueta);
            artigo.appendChild(titulo);
            artigo.appendChild(preco);
            artigo.appendChild(descricao);
            artigo.appendChild(lista);
            artigo.appendChild(botao);

            container.appendChild(artigo);
        });
    }


    async function carregarTelaPlanos() {
        if (carregando) {
            return;
        }

        const pagina = obterElemento("pagina-planos");

        if (!pagina) {
            return;
        }

        carregando = true;

        const mensagem = obterElemento(
            "mensagem-planos-admin"
        );

        if (mensagem) {
            mensagem.textContent = "";
        }

        try {
            const contexto = await resolverContexto();
            const barbeariaId = contexto.barbearia.id;

            await Promise.all([
                carregarAssinatura(barbeariaId),
                carregarPlanos()
            ]);

            const uso =
                await contarRecursosAtivos(barbeariaId);

            renderizarPlanoAtual(
                obterPlanoAtual()
            );

            renderizarPlanos(uso);

        } catch (erro) {
            console.error(
                "Erro ao carregar planos:",
                erro
            );

            const titulo = obterElemento(
                "planos-plano-atual"
            );

            const resumo = obterElemento(
                "planos-resumo-atual"
            );

            if (titulo) {
                titulo.textContent =
                    "Não foi possível carregar o plano";
            }

            if (resumo) {
                resumo.textContent =
                    erro?.message ||
                    "Tente novamente em alguns instantes.";
            }

            if (mensagem) {
                mensagem.textContent =
                    "Não foi possível carregar os planos.";
            }
        } finally {
            carregando = false;
        }
    }

    async function confirmarRetornoMercadoPago() {
    if (confirmandoRetornoMercadoPago) {
        return;
    }

    const parametros =
        new URLSearchParams(window.location.search);

    if (parametros.get("pagamento") !== "retorno") {
        return;
    }

    confirmandoRetornoMercadoPago = true;

    try {
        const contexto = await resolverContexto();
        const barbeariaId = contexto?.barbearia?.id;

        if (!barbeariaId) {
            throw new Error(
                "Não foi possível identificar a barbearia."
            );
        }

        const {
            data: sessao,
            error: erroSessao
        } = await supabaseV2.auth.getSession();

        if (erroSessao) {
            throw erroSessao;
        }

        const accessToken =
            sessao?.session?.access_token;

        if (!accessToken) {
            throw new Error(
                "Sua sessão expirou. Entre novamente no painel."
            );
        }

        const resposta = await fetch(
            "https://acmhagdtakcrtghfcfsa.supabase.co/functions/v1/confirmar-assinatura-mercado-pago",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    barbearia_id: barbeariaId
                })
            }
        );

        let resultado = null;

        try {
            resultado = await resposta.json();
        } catch {
            resultado = null;
        }

        if (!resposta.ok) {
            throw new Error(
                resultado?.erro ||
                "Não foi possível confirmar o pagamento."
            );
        }

        const mensagem =
            obterElemento("mensagem-planos-admin");

        if (resultado?.processado === true) {
            assinaturaAtual = null;

            if (mensagem) {
                mensagem.textContent =
                    "Pagamento confirmado. Seu novo plano já está ativo.";
            }

            await carregarTelaPlanos();
        } else {
            if (mensagem) {
                mensagem.textContent =
                    resultado?.mensagem ||
                    "O pagamento ainda está sendo confirmado.";
            }
        }

        parametros.delete("pagamento");

        const novaQuery =
            parametros.toString();

        const novaUrl =
            window.location.pathname +
            (novaQuery ? `?${novaQuery}` : "") +
            window.location.hash;

        window.history.replaceState(
            {},
            "",
            novaUrl
        );

    } catch (erro) {
        console.error(
            "Erro ao confirmar retorno do Mercado Pago:",
            erro
        );

        const mensagem =
            obterElemento("mensagem-planos-admin");

        if (mensagem) {
            mensagem.textContent =
                erro?.message ||
                "Não foi possível confirmar o pagamento.";
        }
    } finally {
        confirmandoRetornoMercadoPago = false;
    }
}


    function paginaPlanosEstaAtiva() {
        return Boolean(
            obterElemento("pagina-planos")
                ?.classList.contains("ativa")
        );
    }


    document.addEventListener(
        "DOMContentLoaded",
        function () {
             confirmarRetornoMercadoPago();
            const botaoPlanos =
                document.querySelector(
                    '.admin-menu-item[data-pagina="planos"]'
                );

            if (botaoPlanos) {
                botaoPlanos.addEventListener(
                    "click",
                    function () {
                        setTimeout(
                            carregarTelaPlanos,
                            0
                        );
                    }
                );
            }
        }
    );


    document.addEventListener(
        "auth:alterado",
        function () {
            contextoAtual = null;
            assinaturaAtual = null;

            if (paginaPlanosEstaAtiva()) {
                carregarTelaPlanos();
            }
        }
    );


    document.addEventListener(
        "onboarding:concluido",
        function () {
            contextoAtual = null;
            assinaturaAtual = null;
        }
    );


    window.adminPlanos = {
        carregar: carregarTelaPlanos,
        obterAssinatura: function () {
            return assinaturaAtual;
        },
        obterPlanoAtual: obterPlanoAtual
    };

})();
