class DashboardNutricionistaManager {
    constructor() {
        //requer login de nutri
        if(!window.authManager || !window.authManager.protegerPagina('nutricionista')) {
            return;
        }

        this.nutricionistaAtual = window.authManager.obterUsuarioAtual();
        

    }
}