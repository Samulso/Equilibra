
class DashboardPacienteManager {
  constructor() {
    // Protege a página (requer login como paciente)
    if (!window.authManager || !window.authManager.protegerPagina('paciente')) {
      return;
    }

    this.pacienteAtual = window.authManager.obterUsuarioAtual();
    this.diagnosticoAtual = null;
    this.prescricaoAtual = null;
    this.refeicoesHoje = [];
    this.dataAtual = new Date();
    
    this.inicializarDashboard();
  }

  /**
   * Inicializa a dashboard
   */
  inicializarDashboard() {
    this.carregarDiagnosticoEPrescricao();
    this.atualizarSaudacao();
    
    // Verifica se há prescrição
    if (!this.prescricaoAtual) {
      this.mostrarAlertaPrescricao();
    } else {
      this.carregarRefeicoesHoje();
      this.atualizarResumoCalories();
      this.atualizarMacronutrientes();
      this.atualizarUltimasRefeicoes();
    }
    
    this.inicializarEventos();
    this.inicializarCalendario();
  }

  /**
   * Carrega o diagnóstico e prescrição do paciente
   */
  carregarDiagnosticoEPrescricao() {
    try {
      const diagnosticosAvaliados = JSON.parse(localStorage.getItem('diagnosticos_avaliados')) || [];
      
      // Busca o diagnóstico do paciente atual que foi avaliado
      const diagnosticosPaciente = diagnosticosAvaliados.filter(
        d => d.paciente_id === this.pacienteAtual.id && d.status === 'avaliado'
      );

      if (diagnosticosPaciente.length > 0) {
        // Pega o mais recente
        this.diagnosticoAtual = diagnosticosPaciente[diagnosticosPaciente.length - 1];
        
        // Verifica se tem prescrição
        if (this.diagnosticoAtual.prescricao_calorias) {
          this.prescricaoAtual = {
            calorias: this.diagnosticoAtual.prescricao_calorias,
            macros: this.diagnosticoAtual.macronutrientes_recomendados,
            observacoes: this.diagnosticoAtual.observacoes_nutricionista
          };
        }
      }
    } catch (erro) {
      console.error('Erro ao carregar diagnóstico:', erro);
    }
  }

  /**
   * Mostra alerta para paciente sem prescrição
   */
  mostrarAlertaPrescricao() {
    const content = document.getElementById('content');
    if (!content) return;

    // Cria overlay de alerta
    const overlay = document.createElement('div');
    overlay.id = 'alerta-prescricao';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      position: relative;
      padding: 40px;
      border-radius: 15px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    modal.innerHTML = `
      <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
      <h2 style="color: #333; margin-bottom: 15px;">Prescrição Nutricional Pendente</h2>
      <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
        Você ainda não possui uma prescrição nutricional avaliada por um nutricionista.
        <br><br>
        Para utilizar todas as funcionalidades da dashboard, você precisa:
      </p>
      <ol style="text-align: left; color: #555; margin: 20px 40px; line-height: 1.8;">
        <li>Preencher o formulário de diagnóstico</li>
        <li>Aguardar a avaliação do nutricionista</li>
        <li>Receber sua prescrição personalizada</li>
      </ol>
      <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center;">
        <button id="btn-ver-diagnosticos" style="
          padding: 12px 25px;
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
        ">Ver Meus Diagnósticos</button>
        <button id="btn-novo-diagnostico" style="
          padding: 12px 25px;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
        ">Fazer Novo Diagnóstico</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Eventos dos botões
    document.getElementById('btn-ver-diagnosticos').addEventListener('click', () => {
      window.location.href = './meusDiagnosticos.html';
    });

    document.getElementById('btn-novo-diagnostico').addEventListener('click', () => {
      window.location.href = './formularioDiagnostico.html';
    });

    // Oculta o conteúdo da dashboard
    if (content) {
      content.style.filter = 'blur(5px)';
      content.style.pointerEvents = 'none';
    }
  }

  /**
   * Atualiza a saudação
   */
  atualizarSaudacao() {
    const welcomeElement = document.querySelector('.welcome');
    if (welcomeElement && this.pacienteAtual) {
      const nome = this.pacienteAtual.nome.split(' ')[0]; // Primeiro nome
      welcomeElement.textContent = `Bem-vindo, ${nome}!`;
    }
  }

  /**
   * Carrega as refeições do dia
   */
  carregarRefeicoesHoje() {
    try {
      const refeicoes = JSON.parse(localStorage.getItem('refeicoes')) || [];
      const hoje = this.dataAtual.toISOString().split('T')[0];

      this.refeicoesHoje = refeicoes.filter(refeicao => {
        const dataRefeicao = new Date(refeicao.data).toISOString().split('T')[0];
        return dataRefeicao === hoje && refeicao.paciente_id === this.pacienteAtual.id;
      });
    } catch (erro) {
      console.error('Erro ao carregar refeições:', erro);
      this.refeicoesHoje = [];
    }
  }

  /**
   * Atualiza o resumo de calorias
   */
  atualizarResumoCalories() {
    if (!this.prescricaoAtual) return;

    const caloriasDiarias = this.prescricaoAtual.calorias;
    const caloriasConsumidas = this.calcularCaloriasConsumidas();
    const caloriasRestantes = Math.max(0, caloriasDiarias - caloriasConsumidas);

    // Atualiza calorias restantes
    const info1Kcal = document.querySelector('.info-1-kcal');
    if (info1Kcal) {
      info1Kcal.textContent = `${Math.round(caloriasRestantes)}kcal`;
      
      // Cor baseada no status
      if (caloriasRestantes < caloriasDiarias * 0.2) {
        info1Kcal.style.color = '#f44336'; // Vermelho
      } else if (caloriasRestantes < caloriasDiarias * 0.5) {
        info1Kcal.style.color = '#ff9800'; // Laranja
      } else {
        info1Kcal.style.color = '#4caf50'; // Verde
      }
    }

    // Atualiza calorias consumidas
    const info2Kcal = document.querySelector('.info-2-kcal');
    if (info2Kcal) {
      info2Kcal.textContent = `${Math.round(caloriasConsumidas)}kcal`;
    }

    // Armazena para uso posterior
    this.caloriasDiarias = caloriasDiarias;
    this.caloriasConsumidas = caloriasConsumidas;
    this.caloriasRestantes = caloriasRestantes;
  }

  /**
   * Calcula calorias consumidas no dia
   */
  calcularCaloriasConsumidas() {
    return this.refeicoesHoje.reduce((total, refeicao) => {
      return total + (refeicao.calorias || 0);
    }, 0);
  }

  /**
   * Atualiza os macronutrientes
   */
  atualizarMacronutrientes() {
    if (!this.prescricaoAtual) return;

    const macros = this.prescricaoAtual.macros;
    const consumoMacros = this.calcularMacronutrientesConsumidos();

    // Calcula metas em gramas baseado nas calorias diárias
    const caloriasDiarias = this.prescricaoAtual.calorias;
    const metaCarboidratos = (caloriasDiarias * macros.carboidratos_percentual / 100) / 4; // 4 kcal/g
    const metaProteinas = (caloriasDiarias * macros.proteinas_percentual / 100) / 4; // 4 kcal/g
    const metaGorduras = (caloriasDiarias * macros.gorduras_percentual / 100) / 9; // 9 kcal/g

    const prescricoesFiels = document.querySelectorAll('.prescricoes-field');

    if (prescricoesFiels.length >= 3) {
      // Carboidratos
      this.atualizarCampoMacro(prescricoesFiels[0], 'Carboidratos', consumoMacros.carboidratos, metaCarboidratos);

      // Proteínas
      this.atualizarCampoMacro(prescricoesFiels[1], 'Proteínas', consumoMacros.proteinas, metaProteinas);

      // Gorduras
      this.atualizarCampoMacro(prescricoesFiels[2], 'Gorduras', consumoMacros.gorduras, metaGorduras);
    }
  }

  /**
   * Atualiza um campo de macronutriente
   */
  atualizarCampoMacro(elemento, nome, consumido, meta) {
    if (!elemento) return;

    // Atualiza título
    const titulo = elemento.querySelector('.carb');
    if (titulo) {
      titulo.textContent = nome;
    }

    // Calcula percentual
    const percentual = meta > 0 ? Math.min(100, (consumido / meta) * 100) : 0;

    // Atualiza barra de progresso
    const barFill = elemento.querySelector('.bar-fill');
    if (barFill) {
      barFill.style.width = `${percentual}%`;
      
      // Cor baseada no percentual
      if (percentual > 100) {
        barFill.style.backgroundColor = '#f44336'; // Vermelho - excedeu
      } else if (percentual > 80) {
        barFill.style.backgroundColor = '#ff9800'; // Laranja - perto do limite
      } else {
        barFill.style.backgroundColor = '#4caf50'; // Verde - ok
      }
    }

    // Atualiza quantidade em gramas
    const grams = elemento.querySelector('.grams');
    if (grams) {
      grams.textContent = `${consumido.toFixed(1)}g / ${meta.toFixed(1)}g`;
    }
  }

  /**
   * Calcula macronutrientes consumidos
   */
  calcularMacronutrientesConsumidos() {
    const macros = {
      carboidratos: 0,
      proteinas: 0,
      gorduras: 0
    };

    this.refeicoesHoje.forEach(refeicao => {
      if (refeicao.macros) {
        macros.carboidratos += refeicao.macros.carboidratos || 0;
        macros.proteinas += refeicao.macros.proteinas || 0;
        macros.gorduras += refeicao.macros.gorduras || 0;
      }
    });

    return macros;
  }

  /**
   * Atualiza últimas refeições
   */
  atualizarUltimasRefeicoes() {
    const rightContent = document.querySelector('.rigth-content');
    if (!rightContent) return;

    rightContent.innerHTML = '';

    if (this.refeicoesHoje.length === 0) {
      rightContent.innerHTML = `
        <div style="padding: 30px; text-align: center; color: #999;">
          <p style="font-size: 18px; margin-bottom: 10px;">📋</p>
          <p>Nenhuma refeição registrada hoje</p>
          <p style="font-size: 12px; margin-top: 10px;">Adicione sua primeira refeição abaixo!</p>
        </div>
      `;
      return;
    }

    this.refeicoesHoje.forEach(refeicao => {
      const fieldElement = this.criarElementoRefeicao(refeicao);
      rightContent.appendChild(fieldElement);
    });
  }

  /**
   * Cria elemento de refeição
   */
  criarElementoRefeicao(refeicao) {
    const field = document.createElement('div');
    field.className = 'field';
    field.style.position = 'relative';

    const imageDiv = document.createElement('div');
    imageDiv.className = 'image';
    const img = document.createElement('img');
    img.className = 'right-field-img';
    img.src = refeicao.imagem || '../assets/img/cafe_manha.jpg';
    img.alt = refeicao.nome;
    imageDiv.appendChild(img);

    const fieldInfo = document.createElement('div');
    fieldInfo.className = 'field-info';

    const titulo = document.createElement('h1');
    titulo.className = 'field-title';
    titulo.textContent = refeicao.nome;

    const descricao = document.createElement('p');
    descricao.className = 'field-desc';
    descricao.textContent = refeicao.descricao || 'Sem descrição';

    const calorias = document.createElement('p');
    calorias.style.cssText = 'font-weight: bold; color: #4caf50; margin-top: 5px;';
    calorias.textContent = `${Math.round(refeicao.calorias)} kcal`;

    fieldInfo.appendChild(titulo);
    fieldInfo.appendChild(descricao);
    fieldInfo.appendChild(calorias);

    // Nutrientes
    const nutrientesDiv = document.createElement('div');
    nutrientesDiv.className = 'nutrientes-m';

    if (refeicao.macros) {
      nutrientesDiv.appendChild(this.criarElementoNutriente(
        '../assets/img/trigo.jpg',
        refeicao.macros.carboidratos || 0
      ));

      nutrientesDiv.appendChild(this.criarElementoNutriente(
        '../assets/img/carne.jpg',
        refeicao.macros.proteinas || 0
      ));

      nutrientesDiv.appendChild(this.criarElementoNutriente(
        '../assets/img/abacate.jpg',
        refeicao.macros.gorduras || 0
      ));
    }

    // Botão de remover
    const btnRemover = document.createElement('button');
    btnRemover.textContent = '×';
    btnRemover.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      transition: background 0.3s;
    `;
    btnRemover.addEventListener('mouseover', () => btnRemover.style.background = '#d32f2f');
    btnRemover.addEventListener('mouseout', () => btnRemover.style.background = '#f44336');
    btnRemover.addEventListener('click', () => this.removerRefeicao(refeicao.id));

    field.appendChild(imageDiv);
    field.appendChild(fieldInfo);
    field.appendChild(nutrientesDiv);
    field.appendChild(btnRemover);

    return field;
  }

  /**
   * Cria elemento de nutriente
   */
  criarElementoNutriente(imagem, valor) {
    const nutriente = document.createElement('div');
    nutriente.className = 'nutriente-m';

    const img = document.createElement('img');
    img.src = imagem;
    img.alt = 'Nutriente';

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container-m';

    const barFill = document.createElement('div');
    barFill.className = 'bar-fill-m';
    barFill.style.width = '70%';

    barContainer.appendChild(barFill);

    const grams = document.createElement('span');
    grams.className = 'grams-m';
    grams.textContent = `${valor.toFixed(1)}g`;

    nutriente.appendChild(img);
    nutriente.appendChild(barContainer);
    nutriente.appendChild(grams);

    return nutriente;
  }

  /**
   * Inicializa o calendário de dias
   */
  inicializarCalendario() {
    const diasContainer = document.getElementById("dias");
    if (!diasContainer) return;

    diasContainer.innerHTML = '';
    const hoje = new Date();
    const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    for (let i = 0; i < 15; i++) {
      const data = new Date();
      data.setDate(hoje.getDate() + i);

      const numero = data.getDate();
      const semana = diasDaSemana[data.getDay()];

      const diaDiv = document.createElement("div");
      diaDiv.classList.add("dia");
      if (i === 0) diaDiv.classList.add("ativo");

      diaDiv.innerHTML = `
        <span class="numero">${numero}</span>
        <span class="semana">${semana}</span>
      `;

      diaDiv.addEventListener("click", () => {
        document.querySelectorAll(".dia").forEach(d => d.classList.remove("ativo"));
        diaDiv.classList.add("ativo");
        this.dataAtual = data;
        this.atualizarDashboard();
      });

      diasContainer.appendChild(diaDiv);
    }

    // Setas de navegação
    const esquerda = document.querySelector(".esquerda");
    const direita = document.querySelector(".direita");

    if (direita) {
      direita.addEventListener("click", () => {
        diasContainer.scrollBy({ left: 200, behavior: "smooth" });
      });
    }

    if (esquerda) {
      esquerda.addEventListener("click", () => {
        diasContainer.scrollBy({ left: -200, behavior: "smooth" });
      });
    }
  }

  /**
   * Inicializa eventos
   */
  inicializarEventos() {
    // Botões de adicionar refeição
    const addButtons = document.querySelectorAll('.add-button');
    addButtons.forEach(button => {
      button.addEventListener('click', (e) => this.abrirModalAdicionarRefeicao(e));
    });
  }

  /**
   * Abre modal para adicionar refeição
   */
  abrirModalAdicionarRefeicao(event) {
    const button = event.target;
    const field = button.closest('.field-2');
    if (!field) return;

    const tipoRefeicao = field.querySelector('.field-2-title').textContent;
    this.mostrarModalRefeicao(tipoRefeicao);
  }

  /**
   * Mostra modal de adicionar refeição
   */
  mostrarModalRefeicao(tipoRefeicao) {
    // Remove modal anterior se existir
    const modalAnterior = document.getElementById('modal-adicionar-refeicao');
    if (modalAnterior) modalAnterior.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-adicionar-refeicao';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      ">
        <h2 style="margin-bottom: 20px; color: #333;">Adicionar ${tipoRefeicao}</h2>
        
        <form id="form-adicionar-refeicao">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Descrição da Refeição:</label>
            <input type="text" id="refeicao-descricao" required
              placeholder="Ex: Pão integral com ovo e queijo"
              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Calorias (kcal):</label>
            <input type="number" id="refeicao-calorias" required min="0" step="0.1"
              placeholder="Ex: 350"
              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Carboidratos (g):</label>
            <input type="number" id="refeicao-carboidratos" required min="0" step="0.1"
              placeholder="Ex: 45"
              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Proteínas (g):</label>
            <input type="number" id="refeicao-proteinas" required min="0" step="0.1"
              placeholder="Ex: 20"
              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Gorduras (g):</label>
            <input type="number" id="refeicao-gorduras" required min="0" step="0.1"
              placeholder="Ex: 12"
              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          </div>

          <div style="display: flex; gap: 10px;">
            <button type="submit" style="
              flex: 1;
              padding: 12px;
              background: #4caf50;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
            ">Adicionar</button>
            <button type="button" id="btn-cancelar-refeicao" style="
              flex: 1;
              padding: 12px;
              background: #f44336;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
            ">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Eventos
    const form = document.getElementById('form-adicionar-refeicao');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.salvarRefeicao(tipoRefeicao);
    });

    document.getElementById('btn-cancelar-refeicao').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * Salva a refeição
   */
  salvarRefeicao(tipoRefeicao) {
    const descricao = document.getElementById('refeicao-descricao').value;
    const calorias = parseFloat(document.getElementById('refeicao-calorias').value);
    const carboidratos = parseFloat(document.getElementById('refeicao-carboidratos').value);
    const proteinas = parseFloat(document.getElementById('refeicao-proteinas').value);
    const gorduras = parseFloat(document.getElementById('refeicao-gorduras').value);

    const refeicao = {
      id: this.gerarId(),
      paciente_id: this.pacienteAtual.id,
      nome: tipoRefeicao,
      descricao: descricao,
      calorias: calorias,
      macros: {
        carboidratos: carboidratos,
        proteinas: proteinas,
        gorduras: gorduras
      },
      data: this.dataAtual.toISOString(),
      imagem: this.obterImagemPorTipo(tipoRefeicao)
    };

    try {
      const refeicoes = JSON.parse(localStorage.getItem('refeicoes')) || [];
      refeicoes.push(refeicao);
      localStorage.setItem('refeicoes', JSON.stringify(refeicoes));

      this.mostrarNotificacao(`${tipoRefeicao} adicionada com sucesso!`, 'sucesso');
      
      document.getElementById('modal-adicionar-refeicao').remove();
      this.atualizarDashboard();
    } catch (erro) {
      console.error('Erro ao salvar refeição:', erro);
      this.mostrarNotificacao('Erro ao salvar refeição', 'erro');
    }
  }

  /**
   * Remove uma refeição
   */
  removerRefeicao(refeicaoId) {
    if (!confirm('Deseja realmente remover esta refeição?')) return;

    try {
      const refeicoes = JSON.parse(localStorage.getItem('refeicoes')) || [];
      const indice = refeicoes.findIndex(r => r.id === refeicaoId);

      if (indice >= 0) {
        refeicoes.splice(indice, 1);
        localStorage.setItem('refeicoes', JSON.stringify(refeicoes));
        this.mostrarNotificacao('Refeição removida', 'sucesso');
        this.atualizarDashboard();
      }
    } catch (erro) {
      console.error('Erro ao remover refeição:', erro);
      this.mostrarNotificacao('Erro ao remover refeição', 'erro');
    }
  }

  /**
   * Atualiza a dashboard
   */
  atualizarDashboard() {
    this.carregarRefeicoesHoje();
    this.atualizarResumoCalories();
    this.atualizarMacronutrientes();
    this.atualizarUltimasRefeicoes();
  }

  /**
   * Obtém imagem por tipo de refeição
   */
  obterImagemPorTipo(tipo) {
    const imagens = {
      'Café da manhã': '../assets/img/cafe_manha.jpg',
      'Almoço': '../assets/img/almoco.jpg',
      'Lanche da tarde': '../assets/img/lancheTarde.jpg',
      'Jantar': '../assets/img/jantar.jpg'
    };
    return imagens[tipo] || '../assets/img/cafe_manha.jpg';
  }

  /**
   * Gera ID único
   */
  gerarId() {
    return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      background: ${tipo === 'sucesso' ? '#4caf50' : tipo === 'erro' ? '#f44336' : '#2196f3'};
      color: white;
      border-radius: 5px;
      z-index: 10001;
      font-weight: bold;
      animation: slideIn 0.3s;
    `;

    document.body.appendChild(notificacao);
    setTimeout(() => notificacao.remove(), 3000);
  }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardPacienteManager = new DashboardPacienteManager();
});