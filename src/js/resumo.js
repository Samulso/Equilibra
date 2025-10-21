/**
 * Sistema de Resumo do Diagnóstico - Corrigido
 * Exibe resumo e envia para nutricionista
 */

class ResumoDiagnosticoManager {
  constructor() {
    // Protege a página
    if (!window.authManager || !window.authManager.protegerPagina('paciente')) {
      return;
    }

    this.pacienteAtual = window.authManager.obterUsuarioAtual();
    this.diagnostico = null;
    this.inicializar();
  }

  /**
   * Inicializa o gerenciador
   */
  inicializar() {
    this.carregarDiagnostico();
    if (this.diagnostico) {
      this.preencherResumo();
      this.inicializarEventos();
    } else {
      this.mostrarMensagemErro('Nenhum diagnóstico encontrado. Por favor, preencha o formulário novamente.');
    }
  }

  /**
   * Carrega o diagnóstico
   */
  carregarDiagnostico() {
    try {
      // Tenta carregar do sessionStorage primeiro (dados temporários)
      const diagnosticoTemp = sessionStorage.getItem('diagnostico_temp');
      if (diagnosticoTemp) {
        const dados = JSON.parse(diagnosticoTemp);
        if (dados.paciente_id === this.pacienteAtual.id) {
          this.diagnostico = dados;
          return;
        }
      }

      // Se não encontrou, tenta carregar do rascunho
      const rascunhos = JSON.parse(localStorage.getItem('diagnosticos_rascunho')) || [];
      const rascunhoPaciente = rascunhos.find(d => d.paciente_id === this.pacienteAtual.id);
      
      if (rascunhoPaciente) {
        this.diagnostico = rascunhoPaciente;
      }
    } catch (erro) {
      console.error('Erro ao carregar diagnóstico:', erro);
    }
  }

  /**
   * Preenche o resumo
   */
  preencherResumo() {
    const d = this.diagnostico.informacoes_saude;
    const h = this.diagnostico.historico_medico;

    // Data do documento
    const dataElement = document.querySelector('.document-date');
    if (dataElement) {
      const dataCriacao = new Date(this.diagnostico.data_criacao).toLocaleDateString('pt-BR');
      dataElement.textContent = `Data: ${dataCriacao}`;
    }

    // Informações Pessoais
    this.preencherElemento('resumo-dataNascimento', d.data_nascimento);
    this.preencherElemento('resumo-genero', d.sexo);
    this.preencherElemento('resumo-profissao', d.profissao);

    // Hábitos e Estilo de Vida
    this.preencherElemento('resumo-nivelAtividadeFisica', d.nivel_atividade_fisica);
    this.preencherElemento('resumo-qualidadeSono', d.qualidade_sono);
    this.preencherElemento('resumo-refeicoesDia', d.refeicoes_por_dia);
    this.preencherElemento('resumo-lanches', d.lanches_beliscos);
    this.preencherElemento('resumo-consumoAgua', d.consumo_agua ? `${d.consumo_agua} copos` : '');
    this.preencherElemento('resumo-pulaRefeicoes', d.pula_refeicoes);

    // Informações Alimentares
    this.preencherElemento('resumo-preferenciasAlimentares', d.preferencias_alimentares);
    this.preencherElemento('resumo-restricoes', d.aversoes_restricoes);

    // Frequência de Consumo
    const frequencia = d.frequencia_consumo;
    const itensFrequencia = [];
    if (frequencia.refrigerantes) itensFrequencia.push('Refrigerantes');
    if (frequencia.frituras) itensFrequencia.push('Frituras');
    if (frequencia.doces) itensFrequencia.push('Doces');
    if (frequencia.ultraprocessados) itensFrequencia.push('Ultraprocessados');
    this.preencherElemento('resumo-frequenciaConsumo', itensFrequencia.length > 0 ? itensFrequencia.join(', ') : 'Nenhum');

    // Histórico de Saúde
    this.preencherElemento('resumo-doencaDiagnosticada', h.doencas_diagnosticadas);
    this.preencherElemento('resumo-medicamento', h.medicamentos_continuos);
    this.preencherElemento('resumo-suplementos', h.suplementos_vitaminas);
    this.preencherElemento('resumo-digestao', h.digestao);
    this.preencherElemento('resumo-queixasGerais', h.queixas_gerais);

    // Objetivo Principal
    this.preencherElemento('resumo-objetivoPrincipal', this.diagnostico.objetivo_principal);
  }

  /**
   * Preenche um elemento
   */
  preencherElemento(elementId, valor) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
      elemento.textContent = valor || 'Não informado';
    }
  }

  /**
   * Inicializa eventos
   */
  inicializarEventos() {
    const btnEnviar = document.getElementById('btn-enviar-diagnostico');
    const btnEditar = document.getElementById('btn-editar-diagnostico');
    const btnVoltar = document.getElementById('btn-voltar');
    const btnImprimir = document.getElementById('btn-imprimir');

    if (btnEnviar) {
      btnEnviar.addEventListener('click', () => this.enviarParaNutricionista());
    }

    if (btnEditar || btnVoltar) {
      const btn = btnEditar || btnVoltar;
      btn.addEventListener('click', () => this.voltarParaEdicao());
    }

    if (btnImprimir) {
      btnImprimir.addEventListener('click', () => window.print());
    }

    // Cria barra de ação se não houver botões
    if (!btnEnviar && !btnEditar && !btnVoltar) {
      this.criarBarraAcao();
    }
  }

  /**
   * Cria barra de ação flutuante
   */
  criarBarraAcao() {
    if (document.getElementById('barra-acao-resumo')) return;

    const barra = document.createElement('div');
    barra.id = 'barra-acao-resumo';
    barra.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 1000;
    `;

    const btnEnviar = this.criarBotao('Enviar para Nutricionista', '#4caf50', () => this.enviarParaNutricionista());
    const btnEditar = this.criarBotao('Editar Formulário', '#2196f3', () => this.voltarParaEdicao());

    barra.appendChild(btnEnviar);
    barra.appendChild(btnEditar);
    document.body.appendChild(barra);
  }

  /**
   * Cria um botão
   */
  criarBotao(texto, cor, callback) {
    const btn = document.createElement('button');
    btn.textContent = texto;
    btn.style.cssText = `
      padding: 12px 20px;
      background-color: ${cor};
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: opacity 0.3s;
    `;
    btn.addEventListener('mouseover', () => btn.style.opacity = '0.9');
    btn.addEventListener('mouseout', () => btn.style.opacity = '1');
    btn.addEventListener('click', callback);
    return btn;
  }

  /**
   * Envia para nutricionista
   */
  enviarParaNutricionista() {
    if (!confirm('Deseja enviar este diagnóstico para avaliação do nutricionista?')) {
      return false;
    }

    try {
      // Atualiza o status
      this.diagnostico.status = 'enviado_para_avaliacao';
      this.diagnostico.data_atualizacao = new Date().toISOString();

      // Remove dos rascunhos
      const rascunhos = JSON.parse(localStorage.getItem('diagnosticos_rascunho')) || [];
      const rascunhosFiltrados = rascunhos.filter(d => d.id !== this.diagnostico.id);
      localStorage.setItem('diagnosticos_rascunho', JSON.stringify(rascunhosFiltrados));

      // Adiciona aos diagnósticos enviados
      const diagnosticosEnviados = JSON.parse(localStorage.getItem('diagnosticos_enviados')) || [];
      diagnosticosEnviados.push(this.diagnostico);
      localStorage.setItem('diagnosticos_enviados', JSON.stringify(diagnosticosEnviados));

      // Limpa sessionStorage
      sessionStorage.removeItem('diagnostico_temp');

      this.mostrarNotificacao('Diagnóstico enviado com sucesso! Aguarde a avaliação do nutricionista.', 'sucesso');

      setTimeout(() => {
        window.location.href = './dashboardPaciente.html';
      }, 2000);

      return true;
    } catch (erro) {
      console.error('Erro ao enviar diagnóstico:', erro);
      this.mostrarNotificacao('Erro ao enviar diagnóstico', 'erro');
      return false;
    }
  }

  /**
   * Volta para edição
   */
  voltarParaEdicao() {
    sessionStorage.setItem('diagnostico_temp', JSON.stringify(this.diagnostico));
    window.location.href = './formularioDiagnostico.html';
  }

  /**
   * Mostra notificação
   */
  mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-weight: bold;
      background: ${tipo === 'sucesso' ? '#4caf50' : tipo === 'erro' ? '#f44336' : '#2196f3'};
      color: white;
    `;

    document.body.appendChild(notificacao);
    setTimeout(() => notificacao.remove(), 3000);
  }

  /**
   * Mostra mensagem de erro
   */
  mostrarMensagemErro(mensagem) {
    const container = document.querySelector('.document-container') || document.body;
    container.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h2 style="color: #f44336; margin-bottom: 20px;">${mensagem}</h2>
        <button onclick="window.location.href='./formularioDiagnostico.html'" style="
          padding: 12px 25px;
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        ">Voltar ao Formulário</button>
      </div>
    `;
  }
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.resumoDiagnosticoManager = new ResumoDiagnosticoManager();
});