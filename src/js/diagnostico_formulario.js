/**
 * Sistema de Diagnóstico Nutricional
 * Gerencia o formulário de diagnóstico do paciente
 */

class DiagnosticoFormManager {
  constructor() {
    this.diagnostico = this.inicializarDiagnostico();
    this.formulario = document.getElementById('diagnostic-form');
    this.inicializarEventos();
    this.carregarDadosTemp();
  }

  /**
   * Inicializa a estrutura de dados do diagnóstico
   */
  inicializarDiagnostico() {
    return {
      id: this.gerarId(),
      paciente_id: this.obterPacienteId(),
      data_criacao: new Date().toISOString(),
      data_atualizacao: new Date().toISOString(),
      status: 'pendente_avaliacao',
      informacoes_saude: {
        data_nascimento: '',
        idade: 0,
        sexo: '',
        profissao: '',
        nivel_atividade_fisica: '',
        qualidade_sono: '',
        refeicoes_por_dia: '',
        horarios_refeicoes: '',
        lanches_beliscos: '',
        preferencias_alimentares: '',
        aversoes_restricoes: '',
        frequencia_consumo: {
          refrigerantes: false,
          frituras: false,
          doces: false,
          ultraprocessados: false
        },
        consumo_agua: '',
        pula_refeicoes: ''
      },
      historico_medico: {
        doencas_diagnosticadas: '',
        medicamentos_continuos: '',
        suplementos_vitaminas: '',
        digestao: '',
        queixas_gerais: ''
      },
      objetivo_principal: '',
      observacoes_nutricionista: '',
      prescricao_calorias: null,
      macronutrientes_recomendados: {
        proteinas_percentual: null,
        carboidratos_percentual: null,
        gorduras_percentual: null
      }
    };
  }

  /**
   * Carrega dados temporários do sessionStorage (para edição)
   */
  carregarDadosTemp() {
    try {
      const diagnosticoTemp = sessionStorage.getItem('diagnostico_temp');
      if (diagnosticoTemp) {
        this.diagnostico = JSON.parse(diagnosticoTemp);
        this.preencherFormulario();
        sessionStorage.removeItem('diagnostico_temp');
      }
    } catch (erro) {
      console.error('Erro ao carregar dados temporários:', erro);
    }
  }

  /**
   * Inicializa os eventos do formulário
   */
  inicializarEventos() {
    if (!this.formulario) {
      console.error('Formulário de diagnóstico não encontrado');
      return;
    }

    // Listeners para cada campo
    this.adicionarListenersAosCampos();

    // Listeners para botões de ação
    this.adicionarListenersBotoes();
  }

  /**
   * Adiciona listeners aos campos do formulário
   */
  adicionarListenersAosCampos() {
    // Data de nascimento
    const bornDate = document.getElementById('born-date');
    if (bornDate) {
      bornDate.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.data_nascimento = e.target.value;
        this.diagnostico.informacoes_saude.idade = this.calcularIdade(e.target.value);
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Gênero
    const genero = document.getElementById('genero');
    if (genero) {
      genero.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.sexo = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Profissão
    const profession = document.getElementById('profession');
    if (profession) {
      profession.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.profissao = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Nível de atividade física
    const physicalActivity = document.getElementById('physical-activity');
    if (physicalActivity) {
      physicalActivity.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.nivel_atividade_fisica = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Qualidade do sono
    const sleepQuality = document.getElementById('sleep-quality');
    if (sleepQuality) {
      sleepQuality.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.qualidade_sono = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Refeições por dia
    const mealsPerDay = document.getElementById('meals-per-day');
    if (mealsPerDay) {
      mealsPerDay.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.refeicoes_por_dia = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Lanches ou beliscos
    const snacksOutsideMeals = document.getElementById('snacks-outside-meals');
    if (snacksOutsideMeals) {
      snacksOutsideMeals.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.lanches_beliscos = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Consumo de água
    const waterIntake = document.getElementById('water-intake');
    if (waterIntake) {
      waterIntake.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.consumo_agua = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Pula refeições
    const skipMeals = document.getElementById('skip-meals');
    if (skipMeals) {
      skipMeals.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.pula_refeicoes = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Preferências alimentares
    const foodPreferences = document.getElementById('food-preferences');
    if (foodPreferences) {
      foodPreferences.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.preferencias_alimentares = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Aversões ou restrições
    const foodRestrictions = document.getElementById('food-restrictions');
    if (foodRestrictions) {
      foodRestrictions.addEventListener('change', (e) => {
        this.diagnostico.informacoes_saude.aversoes_restricoes = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Doenças diagnosticadas
    const diagnosedDisease = document.getElementById('diagnosed-disease');
    if (diagnosedDisease) {
      diagnosedDisease.addEventListener('change', (e) => {
        this.diagnostico.historico_medico.doencas_diagnosticadas = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Medicamentos contínuos
    const medication = document.getElementById('medication');
    if (medication) {
      medication.addEventListener('change', (e) => {
        this.diagnostico.historico_medico.medicamentos_continuos = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Suplementos ou vitaminas
    const supplements = document.getElementById('supplements');
    if (supplements) {
      supplements.addEventListener('change', (e) => {
        this.diagnostico.historico_medico.suplementos_vitaminas = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Digestão
    const digestion = document.getElementById('digestion');
    if (digestion) {
      digestion.addEventListener('change', (e) => {
        this.diagnostico.historico_medico.digestao = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Queixas gerais
    const generalComplaints = document.getElementById('general-complaints');
    if (generalComplaints) {
      generalComplaints.addEventListener('change', (e) => {
        this.diagnostico.historico_medico.queixas_gerais = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Objetivo principal
    const mainGoal = document.getElementById('main-goal');
    if (mainGoal) {
      mainGoal.addEventListener('change', (e) => {
        this.diagnostico.objetivo_principal = e.target.value;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    }

    // Frequência de consumo (checkboxes)
    const frequentConsumption = document.querySelectorAll('input[name="frequent-consumption"]');
    frequentConsumption.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const value = e.target.value;
        this.diagnostico.informacoes_saude.frequencia_consumo[value] = e.target.checked;
        this.diagnostico.data_atualizacao = new Date().toISOString();
      });
    });
  }

  /**
   * Adiciona listeners aos botões de ação
   */
  adicionarListenersBotoes() {
    // Botão Próximo (submit)
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.proximaPagina());
    }

    // Botão para salvar rascunho (se existir)
    const btnSalvarRascunho = document.getElementById('btn-salvar-rascunho');
    if (btnSalvarRascunho) {
      btnSalvarRascunho.addEventListener('click', () => this.salvarRascunho());
    }

    // Botão para limpar formulário (se existir)
    const btnLimpar = document.getElementById('btn-limpar-formulario');
    if (btnLimpar) {
      btnLimpar.addEventListener('click', () => this.limparFormulario());
    }
  }

  /**
   * Calcula a idade baseada na data de nascimento
   */
  calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();

    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
  }

  /**
   * Valida se o formulário foi preenchido corretamente
   */
  validarFormulario() {
    const camposObrigatorios = [
      'born-date',
      'genero',
      'profession',
      'physical-activity',
      'sleep-quality',
      'meals-per-day',
      'diagnosed-disease',
      'main-goal'
    ];

    const camposVazios = camposObrigatorios.filter(id => {
      const elemento = document.getElementById(id);
      if (!elemento) return false;
      return !elemento.value || elemento.value.trim() === '';
    });

    if (camposVazios.length > 0) {
      console.warn('Campos obrigatórios vazios:', camposVazios);
      this.mostrarNotificacao(`Por favor, preencha todos os campos obrigatórios.`, 'aviso');
      return false;
    }

    return true;
  }

  /**
   * Vai para a próxima página (resumo)
   */
  proximaPagina() {
    if (!this.validarFormulario()) {
      return false;
    }

    try {
      // Salva o diagnóstico como rascunho
      const rascunhos = JSON.parse(localStorage.getItem('diagnosticos_rascunho')) || [];
      const indice = rascunhos.findIndex(d => d.id === this.diagnostico.id);

      if (indice >= 0) {
        rascunhos[indice] = this.diagnostico;
      } else {
        rascunhos.push(this.diagnostico);
      }

      localStorage.setItem('diagnosticos_rascunho', JSON.stringify(rascunhos));

      // Salva também no sessionStorage para a próxima página
      sessionStorage.setItem('diagnostico_temp', JSON.stringify(this.diagnostico));

      this.mostrarNotificacao('Prosseguindo para resumo...', 'info');

      // Redireciona para a página de resumo após 1 segundo
      setTimeout(() => {
        window.location.href = './resumoFormulario.html'; // Ajuste o caminho conforme necessário
      }, 1000);

      return true;
    } catch (erro) {
      console.error('Erro ao prosseguir:', erro);
      this.mostrarNotificacao('Erro ao prosseguir', 'erro');
      return false;
    }
  }

  /**
   * Salva o diagnóstico como rascunho no localStorage
   */
  salvarRascunho() {
    try {
      const rascunhos = JSON.parse(localStorage.getItem('diagnosticos_rascunho')) || [];
      const indice = rascunhos.findIndex(d => d.id === this.diagnostico.id);

      if (indice >= 0) {
        rascunhos[indice] = this.diagnostico;
      } else {
        rascunhos.push(this.diagnostico);
      }

      localStorage.setItem('diagnosticos_rascunho', JSON.stringify(rascunhos));
      this.mostrarNotificacao('Rascunho salvo com sucesso!', 'sucesso');

      return true;
    } catch (erro) {
      console.error('Erro ao salvar rascunho:', erro);
      this.mostrarNotificacao('Erro ao salvar rascunho', 'erro');
      return false;
    }
  }

  /**
   * Limpa o formulário
   */
  limparFormulario() {
    if (this.formulario) {
      this.formulario.reset();
      this.diagnostico = this.inicializarDiagnostico();
      this.mostrarNotificacao('Formulário limpo', 'info');
    }
  }

  /**
   * Preenche o formulário com os dados do diagnóstico
   */
  preencherFormulario() {
    const mapeamento = {
      'born-date': this.diagnostico.informacoes_saude.data_nascimento,
      'genero': this.diagnostico.informacoes_saude.sexo,
      'profession': this.diagnostico.informacoes_saude.profissao,
      'physical-activity': this.diagnostico.informacoes_saude.nivel_atividade_fisica,
      'sleep-quality': this.diagnostico.informacoes_saude.qualidade_sono,
      'meals-per-day': this.diagnostico.informacoes_saude.refeicoes_por_dia,
      'snacks-outside-meals': this.diagnostico.informacoes_saude.lanches_beliscos,
      'water-intake': this.diagnostico.informacoes_saude.consumo_agua,
      'skip-meals': this.diagnostico.informacoes_saude.pula_refeicoes,
      'food-preferences': this.diagnostico.informacoes_saude.preferencias_alimentares,
      'food-restrictions': this.diagnostico.informacoes_saude.aversoes_restricoes,
      'diagnosed-disease': this.diagnostico.historico_medico.doencas_diagnosticadas,
      'medication': this.diagnostico.historico_medico.medicamentos_continuos,
      'supplements': this.diagnostico.historico_medico.suplementos_vitaminas,
      'digestion': this.diagnostico.historico_medico.digestao,
      'general-complaints': this.diagnostico.historico_medico.queixas_gerais,
      'main-goal': this.diagnostico.objetivo_principal
    };

    for (const [id, valor] of Object.entries(mapeamento)) {
      const elemento = document.getElementById(id);
      if (elemento && valor) {
        elemento.value = valor;
      }
    }

    // Preenche checkboxes
    const frequencia = this.diagnostico.informacoes_saude.frequencia_consumo;
    for (const [chave, valor] of Object.entries(frequencia)) {
      const checkbox = document.getElementById(chave);
      if (checkbox) {
        checkbox.checked = valor;
      }
    }
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
   * Gera um ID único
   */
  gerarId() {
    return `diag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtém o ID do paciente (deve vir da sessão/autenticação)
   */
  obterPacienteId() {
    return localStorage.getItem('paciente_id') || 'paciente_anonimo';
  }
}

// Inicializa o manager quando o DOM está pronto
document.addEventListener('DOMContentLoaded', () => {
  window.diagnosticoFormManager = new DiagnosticoFormManager();
});