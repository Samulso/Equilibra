/**
 * Sistema de Gerenciamento de Diagnósticos - Nutricionista Corrigido
 * Visualiza e avalia diagnósticos dos pacientes
 */

class NutricionistaDiagnosticosManager {
  constructor() {
    // Protege a página (requer login como nutricionista)
    if (!window.authManager || !window.authManager.protegerPagina('nutricionista')) {
      return;
    }

    this.nutricionistaAtual = window.authManager.obterUsuarioAtual();
    this.diagnosticoAtual = null;
    this.diagnosticosEnviados = [];
    this.diagnosticosAvaliados = [];
    this.inicializar();
  }

  /**
   * Inicializa o gerenciador
   */
  inicializar() {
    this.carregarDiagnosticos();
    this.renderizarDiagnosticos();
    this.inicializarEventos();
  }

  /**
   * Carrega os diagnósticos
   */
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

  /**
   * Renderiza a lista de diagnósticos
   */
  renderizarDiagnosticos() {
    const lista = document.getElementById('diagnosticos-lista');
    if (!lista) return;

    lista.innerHTML = '';

    const filtroStatus = document.getElementById('filtro-status');
    const statusFiltro = filtroStatus ? filtroStatus.value : '';

    let diagnosticos = [...this.diagnosticosEnviados, ...this.diagnosticosAvaliados];

    // Aplica filtro
    if (statusFiltro) {
      diagnosticos = diagnosticos.filter(d => d.status === statusFiltro);
    }

    if (diagnosticos.length === 0) {
      lista.innerHTML = '<p class="sem-diagnosticos" style="padding: 30px; text-align: center; color: #999;">Nenhum diagnóstico encontrado</p>';
      return;
    }

    // Ordena por data (mais recentes primeiro)
    diagnosticos.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));

    diagnosticos.forEach(diagnostico => {
      const card = this.criarCardDiagnostico(diagnostico);
      lista.appendChild(card);
    });
  }

  /**
   * Cria card de diagnóstico
   */
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

  /**
   * Obtém texto do status
   */
  obterTextoStatus(status) {
    const statusMap = {
      'enviado_para_avaliacao': 'Pendente de Avaliação',
      'avaliado': 'Avaliado'
    };
    return statusMap[status] || status;
  }

  /**
   * Abre modal com diagnóstico
   */
  abrirModalDiagnostico(diagnostico) {
    this.diagnosticoAtual = diagnostico;
    this.preencherModalComDados(diagnostico);
    
    const modal = document.getElementById('modal-diagnostico');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  /**
   * Preenche modal com dados
   */
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

    // Preenche formulário de prescrição
    this.preencherFormularioPrescricao(diagnostico);
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
   * Preenche formulário de prescrição
   */
  preencherFormularioPrescricao(diagnostico) {
    if (diagnostico.prescricao_calorias) {
      const prescricaoCalorias = document.getElementById('prescricao-calorias');
      const prescricaoCarboidratos = document.getElementById('prescricao-carboidratos');
      const prescricaoProteinas = document.getElementById('prescricao-proteinas');
      const prescricaoGorduras = document.getElementById('prescricao-gorduras');
      const prescricaoObservacoes = document.getElementById('prescricao-observacoes');

      if (prescricaoCalorias) prescricaoCalorias.value = diagnostico.prescricao_calorias;
      if (prescricaoCarboidratos) prescricaoCarboidratos.value = diagnostico.macronutrientes_recomendados.carboidratos_percentual || '';
      if (prescricaoProteinas) prescricaoProteinas.value = diagnostico.macronutrientes_recomendados.proteinas_percentual || '';
      if (prescricaoGorduras) prescricaoGorduras.value = diagnostico.macronutrientes_recomendados.gorduras_percentual || '';
      if (prescricaoObservacoes) prescricaoObservacoes.value = diagnostico.observacoes_nutricionista || '';
    }
  }

  /**
   * Inicializa eventos
   */
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
      formPrescricao.addEventListener('submit', (e) => this.handleSubmitPrescricao(e));
    }

    const modal = document.getElementById('modal-diagnostico');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.fecharModal();
      });
    }
  }

  /**
   * Trata submit da prescrição
   */
  handleSubmitPrescricao(event) {
    event.preventDefault();

    if (!this.diagnosticoAtual) {
      this.mostrarNotificacao('Erro: Nenhum diagnóstico selecionado', 'erro');
      return;
    }

    const formData = new FormData(event.target);
    
    const prescricao = {
      prescricao_calorias: parseFloat(formData.get('prescricao_calorias')) || 0,
      macronutrientes_recomendados: {
        carboidratos_percentual: parseFloat(formData.get('carboidratos_percentual')) || 0,
        proteinas_percentual: parseFloat(formData.get('proteinas_percentual')) || 0,
        gorduras_percentual: parseFloat(formData.get('gorduras_percentual')) || 0
      },
      observacoes_nutricionista: formData.get('observacoes_nutricionista') || ''
    };

    if (!this.validarPrescricao(prescricao)) {
      return;
    }

    this.atualizarDiagnosticoComPrescricao(prescricao);
    this.fecharModal();
    this.mostrarNotificacao('Diagnóstico avaliado e salvo com sucesso!', 'sucesso');
    this.renderizarDiagnosticos();
  }

  /**
   * Valida prescrição
   */
  validarPrescricao(prescricao) {
    const { prescricao_calorias, macronutrientes_recomendados } = prescricao;
    const { carboidratos_percentual, proteinas_percentual, gorduras_percentual } = macronutrientes_recomendados;

    if (prescricao_calorias <= 0) {
      this.mostrarNotificacao('As calorias devem ser um valor positivo.', 'erro');
      return false;
    }

    const somaPercentuais = carboidratos_percentual + proteinas_percentual + gorduras_percentual;
    if (Math.abs(somaPercentuais - 100) > 0.1) {
      this.mostrarNotificacao(`A soma dos percentuais de macronutrientes deve ser 100%, mas é ${somaPercentuais.toFixed(2)}%.`, 'erro');
      return false;
    }

    return true;
  }

  /**
   * Atualiza diagnóstico com prescrição
   */
  atualizarDiagnosticoComPrescricao(prescricao) {
    this.diagnosticoAtual.status = 'avaliado';
    this.diagnosticoAtual.prescricao_calorias = prescricao.prescricao_calorias;
    this.diagnosticoAtual.macronutrientes_recomendados = prescricao.macronutrientes_recomendados;
    this.diagnosticoAtual.observacoes_nutricionista = prescricao.observacoes_nutricionista;
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