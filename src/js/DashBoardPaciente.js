const diasContainer = document.getElementById("dias");
  const hoje = new Date();
  const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Gera 15 dias a partir de hoje
  for (let i = 0; i < 15; i++) {
    const data = new Date();
    data.setDate(hoje.getDate() + i);

    const numero = data.getDate();
    const semana = diasDaSemana[data.getDay()];

    const diaDiv = document.createElement("div");
    diaDiv.classList.add("dia");
    if (i === 0) diaDiv.classList.add("ativo"); // primeiro dia ativo

    diaDiv.innerHTML = `
      <span class="numero">${numero}</span>
      <span class="semana">${semana}</span>
    `;

    // evento de clique pra selecionar o dia
    diaDiv.addEventListener("click", () => {
      document.querySelectorAll(".dia").forEach(d => d.classList.remove("ativo"));
      diaDiv.classList.add("ativo");
    });

    diasContainer.appendChild(diaDiv);
  }

  // Rolagem nas setas
  const esquerda = document.querySelector(".esquerda");
  const direita = document.querySelector(".direita");

  direita.addEventListener("click", () => {
    diasContainer.scrollBy({ left: 200, behavior: "smooth" });
  });

  esquerda.addEventListener("click", () => {
    diasContainer.scrollBy({ left: -200, behavior: "smooth" });
  }); 


/**
 * Sistema de Dashboard do Paciente
 * Gerencia a exibição de informações nutricionais diárias
 */

class DashboardPacienteManager {
  constructor() {
    this.pacienteAtual = this.obterPacienteAtual();
    this.diagnosticoAtual = this.obterDiagnosticoAtual();
    this.refeicoesHoje = this.obterRefeicoesHoje();
    this.dataAtual = new Date();
    this.inicializarDashboard();
  }

  /**
   * Inicializa a dashboard
   */
  inicializarDashboard() {
    this.atualizarSaudacao();
    this.atualizarResumoCalories();
    this.atualizarMacronutrientes();
    this.atualizarUltimasRefeicoes();
    this.inicializarEventos();
  }

  /**
   * Atualiza a saudação com o nome do paciente
   */
  atualizarSaudacao() {
    const welcomeElement = document.querySelector('.welcome');
    if (welcomeElement && this.pacienteAtual) {
      const nome = this.pacienteAtual.nome || 'Paciente';
      welcomeElement.textContent = `Bem-vindo, ${nome}!`;
    }
  }

  /**
   * Atualiza o resumo de calorias
   */
  atualizarResumoCalories() {
    if (!this.diagnosticoAtual) {
      console.warn('Diagnóstico não encontrado. Dashboard não pode ser atualizada.');
      return;
    }

    const caloriasDiarias = this.diagnosticoAtual.prescricao_calorias || 2000;
    const caloriasConsumidas = this.calcularCaloriasConsumidas();
    const caloriasRestantes = Math.max(0, caloriasDiarias - caloriasConsumidas);

    // Atualiza elemento de calorias restantes
    const info1Kcal = document.querySelector('.info-1-kcal');
    if (info1Kcal) {
      info1Kcal.textContent = `${caloriasRestantes}kcal`;
    }

    // Atualiza elemento de calorias consumidas
    const info2Kcal = document.querySelector('.info-2-kcal');
    if (info2Kcal) {
      info2Kcal.textContent = `${caloriasConsumidas}kcal`;
    }

    // Armazena para uso posterior
    this.caloriasDiarias = caloriasDiarias;
    this.caloriasConsumidas = caloriasConsumidas;
    this.caloriasRestantes = caloriasRestantes;
  }

  /**
   * Atualiza os macronutrientes
   */
  atualizarMacronutrientes() {
    if (!this.diagnosticoAtual) {
      console.warn('Diagnóstico não encontrado. Macronutrientes não podem ser atualizados.');
      return;
    }

    const macros = this.diagnosticoAtual.macronutrientes_recomendados || {
      proteinas_percentual: 30,
      carboidratos_percentual: 50,
      gorduras_percentual: 20
    };

    const consumoMacros = this.calcularMacronutrientesConsumidos();

    // Atualiza os campos de macronutrientes
    const prescricoesFiels = document.querySelectorAll('.prescricoes-field');

    if (prescricoesFiels.length >= 3) {
      // Carboidratos
      this.atualizarCampoMacro(prescricoesFiels[0], 'Carboidratos', consumoMacros.carboidratos, macros.carboidratos_percentual);

      // Proteínas
      this.atualizarCampoMacro(prescricoesFiels[1], 'Proteínas', consumoMacros.proteinas, macros.proteinas_percentual);

      // Gorduras
      this.atualizarCampoMacro(prescricoesFiels[2], 'Gorduras', consumoMacros.gorduras, macros.gorduras_percentual);
    }
  }

  /**
   * Atualiza um campo de macronutriente específico
   */
  atualizarCampoMacro(elemento, nome, consumido, meta) {
    if (!elemento) return;

    // Atualiza o título
    const titulo = elemento.querySelector('.carb');
    if (titulo) {
      titulo.textContent = nome;
    }

    // Calcula percentual
    const percentual = meta > 0 ? Math.min(100, (consumido / meta) * 100) : 0;

    // Atualiza a barra de progresso
    const barFill = elemento.querySelector('.bar-fill');
    if (barFill) {
      barFill.style.width = `${percentual}%`;
    }

    // Atualiza a quantidade em gramas
    const grams = elemento.querySelector('.grams');
    if (grams) {
      grams.textContent = `${consumido.toFixed(1)}g`;
    }
  }

  /**
   * Atualiza as últimas refeições do dia
   */
  atualizarUltimasRefeicoes() {
    const rightContent = document.querySelector('.rigth-content');
    if (!rightContent) return;

    // Limpa o conteúdo anterior
    rightContent.innerHTML = '';

    // Se não houver refeições, mostra mensagem
    if (this.refeicoesHoje.length === 0) {
      rightContent.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">Nenhuma refeição registrada hoje</p>';
      return;
    }

    // Adiciona cada refeição
    this.refeicoesHoje.forEach(refeicao => {
      const fieldElement = this.criarElementoRefeicao(refeicao);
      rightContent.appendChild(fieldElement);
    });
  }

  /**
   * Cria um elemento HTML para uma refeição
   */
  criarElementoRefeicao(refeicao) {
    const field = document.createElement('div');
    field.className = 'field';

    // Imagem
    const imageDiv = document.createElement('div');
    imageDiv.className = 'image';
    const img = document.createElement('img');
    img.className = 'right-field-img';
    img.src = refeicao.imagem || '../assets/img/cafe_manha.jpg';
    img.alt = refeicao.nome;
    imageDiv.appendChild(img);

    // Informações
    const fieldInfo = document.createElement('div');
    fieldInfo.className = 'field-info';

    const titulo = document.createElement('h1');
    titulo.className = 'field-title';
    titulo.textContent = refeicao.nome;

    const descricao = document.createElement('p');
    descricao.className = 'field-desc';
    descricao.textContent = refeicao.descricao;

    fieldInfo.appendChild(titulo);
    fieldInfo.appendChild(descricao);

    // Nutrientes
    const nutrientesDiv = document.createElement('div');
    nutrientesDiv.className = 'nutrientes-m';

    // Carboidratos
    nutrientesDiv.appendChild(this.criarElementoNutriente(
      '../assets/img/trigo.jpg',
      refeicao.macros.carboidratos
    ));

    // Proteínas
    nutrientesDiv.appendChild(this.criarElementoNutriente(
      '../assets/img/carne.jpg',
      refeicao.macros.proteinas
    ));

    // Gorduras
    nutrientesDiv.appendChild(this.criarElementoNutriente(
      '../assets/img/abacate.jpg',
      refeicao.macros.gorduras
    ));

    field.appendChild(imageDiv);
    field.appendChild(fieldInfo);
    field.appendChild(nutrientesDiv);

    return field;
  }

  /**
   * Cria um elemento de nutriente individual
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
    barFill.style.width = '40%'; // Pode ser ajustado dinamicamente

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
   * Calcula as calorias consumidas no dia
   */
  calcularCaloriasConsumidas() {
    return this.refeicoesHoje.reduce((total, refeicao) => {
      return total + (refeicao.calorias || 0);
    }, 0);
  }

  /**
   * Calcula os macronutrientes consumidos
   */
  calcularMacronutrientesConsumidos() {
    const macros = {
      carboidratos: 0,
      proteinas: 0,
      gorduras: 0
    };

    this.refeicoesHoje.forEach(refeicao => {
      macros.carboidratos += refeicao.macros.carboidratos || 0;
      macros.proteinas += refeicao.macros.proteinas || 0;
      macros.gorduras += refeicao.macros.gorduras || 0;
    });

    return macros;
  }

  /**
   * Obtém o paciente atual (deve vir da sessão/autenticação)
   */
  obterPacienteAtual() {
    try {
      const paciente = localStorage.getItem('paciente_atual');
      return paciente ? JSON.parse(paciente) : null;
    } catch (erro) {
      console.error('Erro ao obter paciente atual:', erro);
      return null;
    }
  }

  /**
   * Obtém o diagnóstico atual do paciente
   */
  obterDiagnosticoAtual() {
    try {
      const diagnosticosAvaliados = JSON.parse(localStorage.getItem('diagnosticos_avaliados')) || [];
      
      // Retorna o diagnóstico mais recente
      if (diagnosticosAvaliados.length > 0) {
        return diagnosticosAvaliados[diagnosticosAvaliados.length - 1];
      }

      return null;
    } catch (erro) {
      console.error('Erro ao obter diagnóstico atual:', erro);
      return null;
    }
  }

  /**
   * Obtém as refeições do dia atual
   */
  obterRefeicoesHoje() {
    try {
      const refeicoes = JSON.parse(localStorage.getItem('refeicoes')) || [];
      const hoje = new Date().toISOString().split('T')[0];

      return refeicoes.filter(refeicao => {
        const dataRefeicao = new Date(refeicao.data).toISOString().split('T')[0];
        return dataRefeicao === hoje;
      });
    } catch (erro) {
      console.error('Erro ao obter refeições do dia:', erro);
      return [];
    }
  }

  /**
   * Inicializa os eventos da dashboard
   */
  inicializarEventos() {
    // Listeners para botões de adicionar refeição (topic-2)
    const addButtons = document.querySelectorAll('.add-button');
    addButtons.forEach(button => {
      button.addEventListener('click', (e) => this.handleAdicionarRefeicao(e));
    });

    // Listeners para navegação de dias (se existir)
    const setaEsquerda = document.querySelector('.seta.esquerda');
    const setaDireita = document.querySelector('.seta.direita');

    if (setaEsquerda) {
      setaEsquerda.addEventListener('click', () => this.navegarDia(-1));
    }

    if (setaDireita) {
      setaDireita.addEventListener('click', () => this.navegarDia(1));
    }
  }

  /**
   * Trata o clique no botão de adicionar refeição
   */
  handleAdicionarRefeicao(event) {
    const button = event.target;
    const field = button.closest('.field-2');
    if (!field) return;

    const nomeRefeicao = field.querySelector('.field-2-title').textContent;
    
    // Abre um modal ou formulário para adicionar refeição
    console.log(`Adicionar refeição: ${nomeRefeicao}`);
    
    // Você pode disparar um evento customizado ou chamar uma função do gerenciador de refeições
    window.dispatchEvent(new CustomEvent('adicionarRefeicao', {
      detail: { nomeRefeicao }
    }));
  }

  /**
   * Navega entre dias
   */
  navegarDia(direcao) {
    this.dataAtual.setDate(this.dataAtual.getDate() + direcao);
    this.atualizarDashboard();
  }

  /**
   * Atualiza a dashboard com os dados do novo dia
   */
  atualizarDashboard() {
    this.refeicoesHoje = this.obterRefeicoesHoje();
    this.atualizarResumoCalories();
    this.atualizarMacronutrientes();
    this.atualizarUltimasRefeicoes();
  }

  /**
   * Adiciona uma nova refeição ao dia
   */
  adicionarRefeicao(refeicao) {
    try {
      const refeicoes = JSON.parse(localStorage.getItem('refeicoes')) || [];
      
      // Adiciona ID e data se não existirem
      refeicao.id = refeicao.id || this.gerarId();
      refeicao.data = refeicao.data || new Date().toISOString();

      refeicoes.push(refeicao);
      localStorage.setItem('refeicoes', JSON.stringify(refeicoes));

      // Atualiza a dashboard
      this.atualizarDashboard();

      this.mostrarNotificacao(`Refeição "${refeicao.nome}" adicionada com sucesso!`, 'sucesso');
      return true;
    } catch (erro) {
      console.error('Erro ao adicionar refeição:', erro);
      this.mostrarNotificacao('Erro ao adicionar refeição', 'erro');
      return false;
    }
  }

  /**
   * Remove uma refeição
   */
  removerRefeicao(refeicaoId) {
    try {
      const refeicoes = JSON.parse(localStorage.getItem('refeicoes')) || [];
      const indice = refeicoes.findIndex(r => r.id === refeicaoId);

      if (indice >= 0) {
        const nomeRefeicao = refeicoes[indice].nome;
        refeicoes.splice(indice, 1);
        localStorage.setItem('refeicoes', JSON.stringify(refeicoes));

        // Atualiza a dashboard
        this.atualizarDashboard();

        this.mostrarNotificacao(`Refeição "${nomeRefeicao}" removida`, 'sucesso');
        return true;
      }

      return false;
    } catch (erro) {
      console.error('Erro ao remover refeição:', erro);
      this.mostrarNotificacao('Erro ao remover refeição', 'erro');
      return false;
    }
  }

  /**
   * Edita uma refeição existente
   */
  editarRefeicao(refeicaoId, novosDados) {
    try {
      const refeicoes = JSON.parse(localStorage.getItem('refeicoes')) || [];
      const indice = refeicoes.findIndex(r => r.id === refeicaoId);

      if (indice >= 0) {
        refeicoes[indice] = { ...refeicoes[indice], ...novosDados };
        localStorage.setItem('refeicoes', JSON.stringify(refeicoes));

        // Atualiza a dashboard
        this.atualizarDashboard();

        this.mostrarNotificacao('Refeição atualizada com sucesso!', 'sucesso');
        return true;
      }

      return false;
    } catch (erro) {
      console.error('Erro ao editar refeição:', erro);
      this.mostrarNotificacao('Erro ao editar refeição', 'erro');
      return false;
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
    return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Exporta os dados do dia em JSON
   */
  exportarDiaJSON() {
    const dados = {
      data: this.dataAtual.toISOString().split('T')[0],
      paciente: this.pacienteAtual,
      diagnostico: this.diagnosticoAtual,
      refeicoes: this.refeicoesHoje,
      resumo: {
        caloriasDiarias: this.caloriasDiarias,
        caloriasConsumidas: this.caloriasConsumidas,
        caloriasRestantes: this.caloriasRestantes
      }
    };

    const dataStr = JSON.stringify(dados, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_${dados.data}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Imprime a dashboard
   */
  imprimirDashboard() {
    const janela = window.open('', '', 'width=900,height=700');
    janela.document.write(this.gerarHTMLDashboard());
    janela.document.close();
    janela.print();
  }

  /**
   * Gera HTML da dashboard para impressão
   */
  gerarHTMLDashboard() {
    const d = this.dataAtual.toISOString().split('T')[0];
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Dashboard - ${d}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .secao { margin-bottom: 20px; page-break-inside: avoid; }
          .secao h2 { color: #666; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
          .campo { margin: 10px 0; }
          .label { font-weight: bold; color: #333; }
          .valor { color: #666; margin-left: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>Dashboard Nutricional - ${d}</h1>
        <p><strong>Paciente:</strong> ${this.pacienteAtual?.nome || 'N/A'}</p>

        <div class="secao">
          <h2>Resumo do Dia</h2>
          <div class="campo"><span class="label">Calorias Diárias:</span><span class="valor">${this.caloriasDiarias} kcal</span></div>
          <div class="campo"><span class="label">Calorias Consumidas:</span><span class="valor">${this.caloriasConsumidas} kcal</span></div>
          <div class="campo"><span class="label">Calorias Restantes:</span><span class="valor">${this.caloriasRestantes} kcal</span></div>
        </div>

        <div class="secao">
          <h2>Refeições do Dia</h2>
          <table>
            <tr>
              <th>Refeição</th>
              <th>Descrição</th>
              <th>Calorias</th>
              <th>Carboidratos</th>
              <th>Proteínas</th>
              <th>Gorduras</th>
            </tr>
            ${this.refeicoesHoje.map(r => `
              <tr>
                <td>${r.nome}</td>
                <td>${r.descricao}</td>
                <td>${r.calorias} kcal</td>
                <td>${r.macros.carboidratos.toFixed(1)}g</td>
                <td>${r.macros.proteinas.toFixed(1)}g</td>
                <td>${r.macros.gorduras.toFixed(1)}g</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </body>
      </html>
    `;
  }
}

// Inicializa o manager quando o DOM está pronto
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardPacienteManager = new DashboardPacienteManager();
});