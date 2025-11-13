class NutricionistaDiagnosticosManager {
  constructor() {

    if (!window.authManager || !window.authManager.protegerPagina('nutricionista')) {
      return;
    }

    this.nutricionistaAtual = window.authManager.obterUsuarioAtual();
    this.diagnosticoAtual = null;
    this.diagnosticosEnviados = [];
    this.diagnosticosAvaliados = [];

    // *** NOVO ***
    // Estado para o plano de refeições sendo editado no modal
    this.planoRefeicoesAtual = this.getPlanoRefeicoesVazio();
    this.abaRefeicaoAtual = 'breakfast'; // 'breakfast', 'lunch', 'snack', 'dinner'
    this.mapaNomesRefeicoes = {
        breakfast: 'Café da Manhã',
        lunch: 'Almoço',
        snack: 'Café da Tarde',
        dinner: 'Jantar'
    };
    // *** FIM NOVO ***

    this.inicializar();
  }


  inicializar() {
    this.carregarDiagnosticos();
    this.renderizarDiagnosticos();
    this.inicializarEventos();
  }

  // *** NOVO ***
  getPlanoRefeicoesVazio() {
    return {
      breakfast: [],
      lunch: [],
      snack: [],
      dinner: []
    };
  }
  // *** FIM NOVO ***

  carregarDiagnosticos() {
    try {
      this.diagnosticosEnviados = JSON.parse(localStorage.getItem('diagnosticos_enviados')) || [];
      this.diagnosticosAvaliados = JSON.parse(localStorage.getItem('diagnosticos_avaliados')) || [];
    } catch (erro) {
      console.error('Erro ao carregar diagnósticos:', erro);
      this.diagnosticosEnviados = [];
      this.diagnosticosAvaliados = [];
    }
  }

  renderizarDiagnosticos() {
    const lista = document.getElementById('diagnosticos-lista');
    if (!lista) return;

    lista.innerHTML = '';

    const filtroStatus = document.getElementById('filtro-status');
    const statusFiltro = filtroStatus ? filtroStatus.value : '';

    let diagnosticos = [...this.diagnosticosEnviados, ...this.diagnosticosAvaliados];

    if (statusFiltro) {
      diagnosticos = diagnosticos.filter(d => d.status === statusFiltro);
    }

    if (diagnosticos.length === 0) {
      lista.innerHTML = '<p class="sem-diagnosticos" style="padding: 30px; text-align: center; color: #999;">Nenhum diagnóstico encontrado</p>';
      return;
    }

    diagnosticos.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));

    diagnosticos.forEach(diagnostico => {
      const card = this.criarCardDiagnostico(diagnostico);
      lista.appendChild(card);
    });
  }


  criarCardDiagnostico(diagnostico) {
    const card = document.createElement('div');
    card.className = `diagnostico-card status-${diagnostico.status}`;
    card.style.cssText = `
      background: white;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
      cursor: pointer;
    `;
    card.addEventListener('mouseover', () => card.style.transform = 'translateY(-2px)');
    card.addEventListener('mouseout', () => card.style.transform = 'translateY(0)');

    const dataCriacao = new Date(diagnostico.data_criacao).toLocaleDateString('pt-BR');
    const idade = diagnostico.informacoes_saude.idade || 'N/A';
    const objetivo = diagnostico.objetivo_principal || 'Não informado';
    const statusTexto = this.obterTextoStatus(diagnostico.status);
    const corStatus = diagnostico.status === 'enviado_para_avaliacao' ? '#ff9800' : '#4caf50';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
        <div>
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">
            ${diagnostico.paciente_nome || 'Paciente ID: ' + diagnostico.paciente_id}
          </h3>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">
            <strong>Data:</strong> ${dataCriacao}
          </p>
        </div>
        <span style="
          padding: 6px 12px;
          background: ${corStatus};
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        ">${statusTexto}</span>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
        <div>
          <p style="margin: 0; color: #999; font-size: 12px;">Idade</p>
          <p style="margin: 5px 0 0 0; color: #333; font-weight: bold;">${idade} anos</p>
        </div>
        <div>
          <p style="margin: 0; color: #999; font-size: 12px;">Gênero</p>
          <p style="margin: 5px 0 0 0; color: #333; font-weight: bold;">${diagnostico.informacoes_saude.sexo || 'N/A'}</p>
        </div>
        <div>
          <p style="margin: 0; color: #999; font-size: 12px;">Objetivo</p>
          <p style="margin: 5px 0 0 0; color: #333; font-weight: bold;">${objetivo}</p>
        </div>
      </div>
      
      <button class="btn-visualizar" style="
        width: 13%;
        margin-top: 50px;
        justify-content:center;
        padding: 12px;
        background: #2196f3;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: background 0.3s;
      ">Visualizar e Avaliar</button>
    `;

    const btnVisualizar = card.querySelector('.btn-visualizar');
    btnVisualizar.addEventListener('mouseover', () => btnVisualizar.style.background = '#0b7dda');
    btnVisualizar.addEventListener('mouseout', () => btnVisualizar.style.background = '#2196f3');
    btnVisualizar.addEventListener('click', (e) => {
      e.stopPropagation();
      this.abrirModalDiagnostico(diagnostico);
    });

    return card;
  }

  obterTextoStatus(status) {
    const statusMap = {
      'enviado_para_avaliacao': 'Pendente de Avaliação',
      'avaliado': 'Avaliado'
    };
    return statusMap[status] || status;
  }

  abrirModalDiagnostico(diagnostico) {
    this.diagnosticoAtual = diagnostico;
    
    // *** MODIFICADO ***
    // Carrega os dados do paciente
    this.preencherModalComDados(diagnostico);
    
    // Carrega o plano de refeições (novo ou existente)
    this.carregarPlanoRefeicoes(diagnostico);
    
    // *** FIM MODIFICADO ***
    
    const modal = document.getElementById('modal-diagnostico');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  preencherModalComDados(diagnostico) {
    const d = diagnostico.informacoes_saude;
    const h = diagnostico.historico_medico;

    // Dados do paciente
    this.atualizarElemento('modal-nomePaciente', diagnostico.paciente_nome || `Paciente ID: ${diagnostico.paciente_id}`);
    this.atualizarElemento('modal-dataNascimento', d.data_nascimento || 'N/A');
    this.atualizarElemento('modal-genero', d.sexo || 'N/A');
    this.atualizarElemento('modal-profissao', d.profissao || 'N/A');

    // Hábitos
    this.atualizarElemento('modal-nivelAtividadeFisica', d.nivel_atividade_fisica || 'N/A');
    this.atualizarElemento('modal-qualidadeSono', d.qualidade_sono || 'N/A');
    this.atualizarElemento('modal-refeicoesDia', d.refeicoes_por_dia || 'N/A');
    this.atualizarElemento('modal-consumoAgua', d.consumo_agua ? `${d.consumo_agua} copos` : 'N/A');

    // Alimentação
    this.atualizarElemento('modal-preferenciasAlimentares', d.preferencias_alimentares || 'Não informado');
    this.atualizarElemento('modal-restricoes', d.aversoes_restricoes || 'Não informado');
    
    const frequencia = d.frequencia_consumo || {};
    const itensFrequencia = [];
    if (frequencia.refrigerantes) itensFrequencia.push('Refrigerantes');
    if (frequencia.frituras) itensFrequencia.push('Frituras');
    if (frequencia.doces) itensFrequencia.push('Doces');
    if (frequencia.ultraprocessados) itensFrequencia.push('Ultraprocessados');
    this.atualizarElemento('modal-frequenciaConsumo', itensFrequencia.length > 0 ? itensFrequencia.join(', ') : 'Nenhum');

    // Saúde
    this.atualizarElemento('modal-doencaDiagnosticada', h.doencas_diagnosticadas || 'Nenhuma');
    this.atualizarElemento('modal-medicamento', h.medicamentos_continuos || 'Nenhum');
    this.atualizarElemento('modal-suplementos', h.suplementos_vitaminas || 'Nenhum');
    this.atualizarElemento('modal-digestao', h.digestao || 'Normal');
    this.atualizarElemento('modal-queixasGerais', h.queixas_gerais || 'Nenhuma');

    // Objetivo
    this.atualizarElemento('modal-objetivoPrincipal', diagnostico.objetivo_principal || 'Não informado');

    // ESTA FUNÇÃO NÃO PREENCHE MAIS O FORMULÁRIO DE PRESCRIÇÃO
    // this.preencherFormularioPrescricao(diagnostico);
  }

  /**
   * Atualiza elemento do DOM
   */
  atualizarElemento(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
    }
  }

  /**
   * *** REMOVIDA/SUBSTITUÍDA ***
   * Preenche formulário de prescrição (lógica movida para carregarPlanoRefeicoes)
   */
  // preencherFormularioPrescricao(diagnostico) { ... }


  // *** NOVAS FUNÇÕES PARA O PLANO DE REFEIÇÕES ***

  /**
   * Carrega o plano de refeições existente ou um novo
   */
  carregarPlanoRefeicoes(diagnostico) {
    if (diagnostico.plano_refeicoes) {
      // Se já existe um plano, carrega
      // O 'parse/stringify' clona o objeto para evitar mutação do original
      this.planoRefeicoesAtual = JSON.parse(JSON.stringify(diagnostico.plano_refeicoes));
    } else {
      // Se não, inicia um vazio
      this.planoRefeicoesAtual = this.getPlanoRefeicoesVazio();
    }
    
    // Seleciona a primeira aba por padrão
    this.selecionarAbaRefeicao('breakfast');
  }

  /**
   * Troca a aba de refeição (Café, Almoço, etc.)
   */
  selecionarAbaRefeicao(mealType) {
    this.abaRefeicaoAtual = mealType;
    
    // Atualiza título do form
    const tituloForm = document.getElementById('form-prato-titulo');
    if (tituloForm) {
      tituloForm.textContent = `Adicionar Prato para ${this.mapaNomesRefeicoes[mealType]}`;
    }

    // Atualiza estilo 'active' das abas
    document.querySelectorAll('#meal-tabs .tab-link').forEach(tab => {
      tab.classList.remove('active');
    });
    const abaAtiva = document.querySelector(`#meal-tabs .tab-link[onclick*="'${mealType}'"]`);
    if (abaAtiva) {
      abaAtiva.classList.add('active');
    }

    // Renderiza os pratos da aba selecionada
    this.renderizarPratosRefeicao();
  }

  /**
   * Mostra os pratos cadastrados para a refeição atual
   */
  renderizarPratosRefeicao() {
    const listaContainer = document.getElementById('lista-pratos-cadastrados');
    if (!listaContainer) return;

    listaContainer.innerHTML = ''; // Limpa a lista
    
    const pratos = this.planoRefeicoesAtual[this.abaRefeicaoAtual];

    if (!pratos || pratos.length === 0) {
      listaContainer.innerHTML = '<p style="text-align: center; color: #777; padding: 10px 0;">Nenhum prato cadastrado.</p>';
      return;
    }

    pratos.forEach((prato, index) => {
      const cardPrato = document.createElement('div');
      cardPrato.className = 'dish-card';
      cardPrato.innerHTML = `
        <div class="dish-card-header">
          <h5>${prato.nome || 'Prato sem nome'}</h5>
          <button type="button" class="btn-remover-prato" onclick="window.nutricionistaDiagnosticosManager.removerPrato(${index})">&times;</button>
        </div>
        <div class="dish-card-macros">
          <span><strong>${prato.kcal || 0}</strong> kcal</span>
          <span><strong>C:</strong> ${prato.carb || 0}g</span>
          <span><strong>P:</strong> ${prato.prot || 0}g</span>
          <span><strong>G:</strong> ${prato.gord || 0}g</span>
        </div>
        <p class="dish-card-obs">${prato.obs || 'Sem observações.'}</p>
      `;
      listaContainer.appendChild(cardPrato);
    });
  }

  /**
   * Adiciona um novo prato ao plano
   */
  adicionarPrato() {
    const nome = document.getElementById('prato-nome').value;
    const kcal = parseFloat(document.getElementById('prato-kcal').value) || 0;
    const carb = parseFloat(document.getElementById('prato-carb').value) || 0;
    const prot = parseFloat(document.getElementById('prato-prot').value) || 0;
    const gord = parseFloat(document.getElementById('prato-gord').value) || 0;
    const obs = document.getElementById('prato-obs').value;

    if (!nome || kcal <= 0) {
      this.mostrarNotificacao('O nome do prato e as calorias (maior que 0) são obrigatórios.', 'erro');
      return;
    }

    const novoPrato = { nome, kcal, carb, prot, gord, obs };
    
    // Adiciona ao array da refeição atual
    this.planoRefeicoesAtual[this.abaRefeicaoAtual].push(novoPrato);

    // Limpa o formulário
    document.getElementById('prato-nome').value = '';
    document.getElementById('prato-kcal').value = '';
    document.getElementById('prato-carb').value = '';
    document.getElementById('prato-prot').value = '';
    document.getElementById('prato-gord').value = '';
    document.getElementById('prato-obs').value = '';
    
    // Atualiza a lista
    this.renderizarPratosRefeicao();
  }

  /**
   * Remove um prato do plano
   */
  removerPrato(index) {
    if (confirm('Tem certeza que deseja remover este prato?')) {
      this.planoRefeicoesAtual[this.abaRefeicaoAtual].splice(index, 1);
      this.renderizarPratosRefeicao(); // Atualiza a lista
    }
  }


  // *** FIM DAS NOVAS FUNÇÕES ***


  inicializarEventos() {
    const filtroStatus = document.getElementById('filtro-status');
    if (filtroStatus) {
      filtroStatus.addEventListener('change', () => this.renderizarDiagnosticos());
    }

    const btnFecharModal = document.getElementById('btn-fechar-modal');
    if (btnFecharModal) {
      btnFecharModal.addEventListener('click', () => this.fecharModal());
    }

    const btnCancelarPrescricao = document.getElementById('btn-cancelar-prescricao');
    if (btnCancelarPrescricao) {
      btnCancelarPrescricao.addEventListener('click', () => this.fecharModal());
    }

    const formPrescricao = document.getElementById('form-prescricao');
    if (formPrescricao) {
      // *** MODIFICADO ***
      // O submit agora é para salvar o PLANO
      formPrescricao.addEventListener('submit', (e) => this.handleSubmitPlanoRefeicoes(e));
    }
    
    // *** NOVO ***
    // Evento para o botão de ADICIONAR PRATO
    const btnAddPrato = document.getElementById('btn-add-prato');
    if (btnAddPrato) {
      btnAddPrato.addEventListener('click', () => this.adicionarPrato());
    }
    // *** FIM NOVO ***


    const modal = document.getElementById('modal-diagnostico');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.fecharModal();
      });
    }
  }

  /**
   * *** RENOMEADA E MODIFICADA ***
   * (Antiga handleSubmitPrescricao)
   */
  handleSubmitPlanoRefeicoes(event) {
    event.preventDefault();

    if (!this.diagnosticoAtual) {
      this.mostrarNotificacao('Erro: Nenhum diagnóstico selecionado', 'erro');
      return;
    }

    // *** NOVO ***
    // Valida o plano de refeições
    if (!this.validarPlanoRefeicoes(this.planoRefeicoesAtual)) {
      return; // A notificação de erro já foi mostrada na validação
    }
    // *** FIM NOVO ***

    // A variável 'prescricao' agora é o nosso plano de refeições
    const planoRefeicoes = this.planoRefeicoesAtual;

    this.atualizarDiagnosticoComPlano(planoRefeicoes);
    this.fecharModal();
    this.mostrarNotificacao('Plano de refeições salvo com sucesso!', 'sucesso');
    this.renderizarDiagnosticos();
  }

  /**
   * *** RENOMEADA E MODIFICADA ***
   * (Antiga validarPrescricao)
   */
  validarPlanoRefeicoes(plano) {
    
    const { breakfast, lunch, snack, dinner } = plano;

    // Verifica se CADA refeição tem pelo menos 3 pratos
    if (breakfast.length < 3) {
      this.mostrarNotificacao('É preciso cadastrar no mínimo 3 pratos para o Café da Manhã.', 'erro');
      return false;
    }
    if (lunch.length < 3) {
      this.mostrarNotificacao('É preciso cadastrar no mínimo 3 pratos para o Almoço.', 'erro');
      return false;
    }
    if (snack.length < 3) {
      this.mostrarNotificacao('É preciso cadastrar no mínimo 3 pratos para o Café da Tarde.', 'erro');
      return false;
    }
    if (dinner.length < 3) {
      this.mostrarNotificacao('É preciso cadastrar no mínimo 3 pratos para o Jantar.', 'erro');
      return false;
    }

    return true;
  }

  /**
   * *** RENOMEADA E MODIFICADA ***
   * (Antiga atualizarDiagnosticoComPrescricao)
   */
  atualizarDiagnosticoComPlano(plano) {
    this.diagnosticoAtual.status = 'avaliado';
    
    // *** NOVO ***
    // Adiciona o plano de refeições ao diagnóstico
    this.diagnosticoAtual.plano_refeicoes = plano;
    
    // *** REMOVIDO ***
    // Remove os campos antigos
    delete this.diagnosticoAtual.prescricao_calorias;
    delete this.diagnosticoAtual.macronutrientes_recomendados;
    delete this.diagnosticoAtual.observacoes_nutricionista;
    // *** FIM REMOVIDO ***

    this.diagnosticoAtual.data_avaliacao = new Date().toISOString();
    this.diagnosticoAtual.nutricionista_id = this.nutricionistaAtual.id;
    this.diagnosticoAtual.nutricionista_nome = this.nutricionistaAtual.nome;

    // Remove dos enviados
    const index = this.diagnosticosEnviados.findIndex(d => d.id === this.diagnosticoAtual.id);
    if (index !== -1) {
      this.diagnosticosEnviados.splice(index, 1);
    }

    // Adiciona/atualiza nos avaliados
    const avaliadoIndex = this.diagnosticosAvaliados.findIndex(d => d.id === this.diagnosticoAtual.id);
    if (avaliadoIndex !== -1) {
      this.diagnosticosAvaliados[avaliadoIndex] = this.diagnosticoAtual;
    } else {
      this.diagnosticosAvaliados.push(this.diagnosticoAtual);
    }

    this.salvarDiagnosticos();
  }

  /**
   * Salva diagnósticos
   */
  salvarDiagnosticos() {
    localStorage.setItem('diagnosticos_enviados', JSON.stringify(this.diagnosticosEnviados));
    localStorage.setItem('diagnosticos_avaliados', JSON.stringify(this.diagnosticosAvaliados));
  }

  /**
   * Fecha modal
   */
  fecharModal() {
    const modal = document.getElementById('modal-diagnostico');
    if (modal) {
      modal.style.display = 'none';
    }
    this.diagnosticoAtual = null;
    
    // *** NOVO ***
    // Reseta o plano de refeições e a aba ao fechar
    this.planoRefeicoesAtual = this.getPlanoRefeicoesVazio();
    this.abaRefeicaoAtual = 'breakfast';
    // *** FIM NOVO ***
  }

  /**
   * Mostra notificação
   */
  mostrarNotificacao(mensagem, tipo) {
    const notificacao = document.createElement('div');
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${tipo === 'sucesso' ? '#4caf50' : '#f44336'};
      color: white;
      border-radius: 5px;
      z-index: 10001;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;

    document.body.appendChild(notificacao);
    setTimeout(() => notificacao.remove(), 5000);
  }
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.nutricionistaDiagnosticosManager = new NutricionistaDiagnosticosManager();
});