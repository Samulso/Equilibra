/**
 * Sistema de Resumo do Diagnóstico
 * Exibe os dados preenchidos pelo paciente e permite envio para o nutricionista
 */

class ResumoDiagnosticoManager {
  constructor() {
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
   * Carrega o diagnóstico do localStorage
   */
  carregarDiagnostico() {
    try {
      // Tenta carregar o diagnóstico em rascunho
      const rascunhos = JSON.parse(localStorage.getItem('diagnosticos_rascunho')) || [];
      if (rascunhos.length > 0) {
        // Carrega o rascunho mais recente
        this.diagnostico = rascunhos[rascunhos.length - 1];
      }

      // Se não encontrou rascunho, tenta carregar do sessionStorage (dados temporários)
      if (!this.diagnostico) {
        const diagnosticoTemp = sessionStorage.getItem('diagnostico_temp');
        if (diagnosticoTemp) {
          this.diagnostico = JSON.parse(diagnosticoTemp);
        }
      }
    } catch (erro) {
      console.error('Erro ao carregar diagnóstico:', erro);
    }
  }

  /**
   * Preenche o resumo com os dados do diagnóstico
   */
  preencherResumo() {
    const d = this.diagnostico.informacoes_saude;
    const h = this.diagnostico.historico_medico;

    // Atualiza a data do documento
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
   * Preenche um elemento com um valor
   */
  preencherElemento(elementId, valor) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
      elemento.textContent = valor || 'Não informado';
    }
  }

  /**
   * Inicializa os eventos
   */
  inicializarEventos() {
    // Procura por botões de ação
    const btnEnviar = document.getElementById('btn-enviar-diagnostico');
    const btnEditar = document.getElementById('btn-editar-diagnostico');
    const btnVoltar = document.getElementById('btn-voltar');
    const btnImprimir = document.getElementById('btn-imprimir');
    const btnExportar = document.getElementById('btn-exportar');

    if (btnEnviar) {
      btnEnviar.addEventListener('click', () => this.enviarParaNutricionista());
    }

    if (btnEditar) {
      btnEditar.addEventListener('click', () => this.voltarParaEdicao());
    }

    if (btnVoltar) {
      btnVoltar.addEventListener('click', () => this.voltarParaEdicao());
    }

    if (btnImprimir) {
      btnImprimir.addEventListener('click', () => this.imprimirResumo());
    }

    if (btnExportar) {
      btnExportar.addEventListener('click', () => this.exportarJSON());
    }

    // Se não houver botões, cria uma barra de ação flutuante
    this.criarBarraAcao();
  }

  /**
   * Cria uma barra de ação flutuante se não houver botões
   */
  criarBarraAcao() {
    // Verifica se já existe uma barra de ação
    if (document.getElementById('barra-acao-resumo')) {
      return;
    }

    const barraAcao = document.createElement('div');
    barraAcao.id = 'barra-acao-resumo';
    barraAcao.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 1000;
      flex-direction: column;
    `;

    // Botão Enviar
    const btnEnviar = document.createElement('button');
    btnEnviar.textContent = 'Enviar para Nutricionista';
    btnEnviar.style.cssText = `
      padding: 12px 20px;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: background-color 0.3s;
    `;
    btnEnviar.addEventListener('mouseover', () => btnEnviar.style.backgroundColor = '#45a049');
    btnEnviar.addEventListener('mouseout', () => btnEnviar.style.backgroundColor = '#4caf50');
    btnEnviar.addEventListener('click', () => this.enviarParaNutricionista());

    // Botão Editar
    const btnEditar = document.createElement('button');
    btnEditar.textContent = 'Editar Formulário';
    btnEditar.style.cssText = `
      padding: 12px 20px;
      background-color: #2196f3;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: background-color 0.3s;
    `;
    btnEditar.addEventListener('mouseover', () => btnEditar.style.backgroundColor = '#0b7dda');
    btnEditar.addEventListener('mouseout', () => btnEditar.style.backgroundColor = '#2196f3');
    btnEditar.addEventListener('click', () => this.voltarParaEdicao());

    // Botão Imprimir
    const btnImprimir = document.createElement('button');
    btnImprimir.textContent = 'Imprimir';
    btnImprimir.style.cssText = `
      padding: 12px 20px;
      background-color: #ff9800;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: background-color 0.3s;
    `;
    btnImprimir.addEventListener('mouseover', () => btnImprimir.style.backgroundColor = '#e68900');
    btnImprimir.addEventListener('mouseout', () => btnImprimir.style.backgroundColor = '#ff9800');
    btnImprimir.addEventListener('click', () => this.imprimirResumo());

    barraAcao.appendChild(btnEnviar);
    barraAcao.appendChild(btnEditar);
    barraAcao.appendChild(btnImprimir);

    document.body.appendChild(barraAcao);
  }

  /**
   * Envia o diagnóstico para o nutricionista
   */
  enviarParaNutricionista() {
    try {
      // Atualiza o status do diagnóstico
      this.diagnostico.status = 'enviado_para_avaliacao';
      this.diagnostico.data_atualizacao = new Date().toISOString();

      // Remove dos rascunhos
      const rascunhos = JSON.parse(localStorage.getItem('diagnosticos_rascunho')) || [];
      const indiceRascunho = rascunhos.findIndex(d => d.id === this.diagnostico.id);
      if (indiceRascunho >= 0) {
        rascunhos.splice(indiceRascunho, 1);
        localStorage.setItem('diagnosticos_rascunho', JSON.stringify(rascunhos));
      }

      // Adiciona aos diagnósticos enviados
      const diagnosticosEnviados = JSON.parse(localStorage.getItem('diagnosticos_enviados')) || [];
      diagnosticosEnviados.push(this.diagnostico);
      localStorage.setItem('diagnosticos_enviados', JSON.stringify(diagnosticosEnviados));

      // Limpa o sessionStorage
      sessionStorage.removeItem('diagnostico_temp');

      this.mostrarNotificacao('Diagnóstico enviado com sucesso! Aguarde a avaliação do nutricionista.', 'sucesso');

      // Redireciona para a dashboard após 2 segundos
      setTimeout(() => {
        window.location.href = './DashBoardPaciente.html'; // Ajuste o caminho conforme necessário
      }, 2000);

      return true;
    } catch (erro) {
      console.error('Erro ao enviar diagnóstico:', erro);
      this.mostrarNotificacao('Erro ao enviar diagnóstico', 'erro');
      return false;
    }
  }

  /**
   * Volta para a página de edição do formulário
   */
  voltarParaEdicao() {
    // Salva o diagnóstico no sessionStorage para recuperar na página de formulário
    sessionStorage.setItem('diagnostico_temp', JSON.stringify(this.diagnostico));
    
    // Redireciona para a página de formulário
    window.location.href = './formularioDiagnostico.html'; // Ajuste o caminho conforme necessário
  }

  /**
   * Imprime o resumo
   */
  imprimirResumo() {
    window.print();
  }

  /**
   * Exporta o diagnóstico em JSON
   */
  exportarJSON() {
    const dataStr = JSON.stringify(this.diagnostico, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagnostico_${this.diagnostico.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Mostra uma notificação ao usuário
   */
  mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-weight: bold;
      animation: slideIn 0.3s ease-in-out;
    `;

    const cores = {
      sucesso: '#4caf50',
      erro: '#f44336',
      aviso: '#ff9800',
      info: '#2196f3'
    };

    notificacao.style.backgroundColor = cores[tipo] || cores.info;
    notificacao.style.color = 'white';

    document.body.appendChild(notificacao);

    setTimeout(() => {
      notificacao.remove();
    }, 3000);
  }

  /**
   * Mostra uma mensagem de erro
   */
  mostrarMensagemErro(mensagem) {
    const container = document.querySelector('.document-container');
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #f44336;">
          <h2>${mensagem}</h2>
          <button onclick="window.location.href='./formularioDiagnostico.html'" style="
            padding: 10px 20px;
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
}

// Inicializa o manager quando o DOM está pronto
document.addEventListener('DOMContentLoaded', () => {
  window.resumoDiagnosticoManager = new ResumoDiagnosticoManager();
});