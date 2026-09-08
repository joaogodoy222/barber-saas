window.adminAuthReady = async function () {

    const {
        data,
        error
    } = await supabaseV2.auth.getSession();


    if (error) {

        console.error(
            "Erro ao verificar sessão:",
            error
        );

        window.location.href =
            "admin.html";

        return false;
    }


    if (!data.session) {

        console.log(
            "Administrador não autenticado."
        );

        window.location.href =
            "admin.html";

        return false;
    }


    console.log(
        "Administrador autenticado:",
        data.session.user.email
    );

    return true;
};