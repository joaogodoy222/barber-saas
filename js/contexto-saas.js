(function () {
    "use strict";

    let contextoAtual = null;
    let carregando = null;

    async function carregar() {
        if (contextoAtual) return contextoAtual;
        if (carregando) return carregando;

        carregando = (async function () {
            const { data: { session }, error: erroSessao } =
                await supabaseV2.auth.getSession();

            if (erroSessao) throw erroSessao;
            if (!session?.user) throw new Error("Usuário não autenticado.");

            const { data: vinculo, error: erroVinculo } =
                await supabaseV2
                    .from("usuarios_barbearias")
                    .select("id, user_id, barbearia_id, papel, ativo")
                    .eq("user_id", session.user.id)
                    .eq("ativo", true)
                    .limit(1)
                    .maybeSingle();

            if (erroVinculo) throw erroVinculo;

            if (!vinculo) {
                throw new Error(
                    "Este usuário não possui uma barbearia ativa vinculada."
                );
            }

            const { data: barbearia, error: erroBarbearia } =
                await supabaseV2
                    .from("barbearias")
                    .select("id, nome, slug, telefone, ativo, created_at")
                    .eq("id", vinculo.barbearia_id)
                    .eq("ativo", true)
                    .single();

            if (erroBarbearia) throw erroBarbearia;

            contextoAtual = {
                usuario: session.user,
                vinculo,
                barbearia,
                barbeariaId: barbearia.id,
                papel: vinculo.papel
            };

            document.dispatchEvent(
                new CustomEvent("saas:contexto-carregado", {
                    detail: contextoAtual
                })
            );

            return contextoAtual;
        })();

        try {
            return await carregando;
        } finally {
            carregando = null;
        }
    }

    function obter() {
        return contextoAtual;
    }

    function obterBarbeariaId() {
        return contextoAtual?.barbeariaId || null;
    }

    function obterPapel() {
        return contextoAtual?.papel || null;
    }

    function limpar() {
        contextoAtual = null;
        carregando = null;
        document.dispatchEvent(new CustomEvent("saas:contexto-limpo"));
    }

    window.contextoSaaS = {
        carregar,
        obter,
        obterBarbeariaId,
        obterPapel,
        limpar
    };
})();
