class DashboardPacienteManager {
  constructor() {
    // Protege a página (requer login como paciente)
    if (!window.authManager || !window.authManager.protegerPagina("paciente")) {
      return;
    }

    this.pacienteAtual = window.authManager.obterUsuarioAtual();
    this.diagnosticoAtual = null;
    
    // *** MODIFICADO ***
    // 'prescricaoAtual' agora é 'planoRefeicoesAtual'
    this.planoRefeicoesAtual = null; 
    
    this.refeicoesHoje = [];
    this.dataAtual = new Date();

    // *** NOVO ***
    // Mapeia os títulos dos botões para as chaves do objeto do plano
    this.mapaTiposRefeicao = {
      "Café da manhã": "breakfast",
      "Almoço": "lunch",
      "Lanche da tarde": "snack",
      "Jantar": "dinner"
    };

    this.inicializarDashboard();
  }

  /**
   * Inicializa a dashboard
   */
  inicializarDashboard() {
    this.carregarDiagnosticoEPlano(); // Renomeado
    this.atualizarSaudacao();

    // *** MODIFICADO ***
    // Verifica se há um PLANO de refeições
    if (!this.planoRefeicoesAtual) {
      this.mostrarAlertaPrescricao(); // O alerta de "prescrição pendente" ainda é válido
    } else {
      this.carregarRefeicoesHoje();
      
      // *** MODIFICADO ***
      // Atualiza o resumo para mostrar apenas o consumido
      this.atualizarResumoConsumido(); 
      this.atualizarMacrosConsumidos();
      
      this.atualizarUltimasRefeicoes();
    }

    this.inicializarEventos();
    this.inicializarCalendario();
  }

  /**
   * *** MODIFICADO ***
   * Carrega o diagnóstico e o PLANO DE REFEIÇÕES
   */
  carregarDiagnosticoEPlano() {
    try {
      const diagnosticosAvaliados =
        JSON.parse(localStorage.getItem("diagnosticos_avaliados")) || [];

      // Busca o diagnóstico do paciente atual que foi avaliado
      const diagnosticosPaciente = diagnosticosAvaliados.filter(
        (d) =>
          d.paciente_id === this.pacienteAtual.id && d.status === "avaliado"
      );

      if (diagnosticosPaciente.length > 0) {
        // Pega o mais recente
        this.diagnosticoAtual =
          diagnosticosPaciente[diagnosticosPaciente.length - 1];

        // *** MODIFICADO ***
        // Verifica se tem o PLANO DE REFEIÇÕES
        if (this.diagnosticoAtual.plano_refeicoes) {
          this.planoRefeicoesAtual = this.diagnosticoAtual.plano_refeicoes;
        }
      }
    } catch (erro) {
      console.error("Erro ao carregar diagnóstico:", erro);
    }
  }

  /**
   * Mostra alerta para paciente sem prescrição
   */
  mostrarAlertaPrescricao() {
    const content = document.getElementById("content");
    if (!content) return;

    // Cria overlay de alerta
    const overlay = document.createElement("div");
    overlay.id = "alerta-prescricao";
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

    const modal = document.createElement("div");
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
      <h2 style="color: #333; margin-bottom: 15px;">Plano de Refeições Pendente</h2>
      <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
        Você ainda não possui um plano de refeições avaliado por um nutricionista.
        <br><br>
        Para utilizar todas as funcionalidades da dashboard, você precisa:
      </p>
      <ol style="text-align: left; color: #555; margin: 20px 40px; line-height: 1.8;">
        <li>Preencher o formulário de diagnóstico</li>
        <li>Aguardar a avaliação do nutricionista</li>
        <li>Receber seu plano de refeições personalizado</li>
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
    document
      .getElementById("btn-ver-diagnosticos")
      .addEventListener("click", () => {
        window.location.href = "./meusDiagnosticos.html";
      });

    document
      .getElementById("btn-novo-diagnostico")
      .addEventListener("click", () => {
        window.location.href = "./formularioDiagnostico.html";
      });

    // Oculta o conteúdo da dashboard
    if (content) {
      content.style.filter = "blur(5px)";
      content.style.pointerEvents = "none";
    }
  }

  /**
   * Atualiza a saudação
   */
  atualizarSaudacao() {
    const welcomeElement = document.querySelector(".welcome");
    if (welcomeElement && this.pacienteAtual) {
      const nome = this.pacienteAtual.nome.split(" ")[0]; // Primeiro nome
      welcomeElement.textContent = `Bem-vindo, ${nome}!`;
    }
  }

  /**
   * Carrega as refeições do dia
   */
  carregarRefeicoesHoje() {
    try {
      const refeicoes = JSON.parse(localStorage.getItem("refeicoes")) || [];
      const hoje = this.dataAtual.toISOString().split("T")[0];

      this.refeicoesHoje = refeicoes.filter((refeicao) => {
        const dataRefeicao = new Date(refeicao.data)
          .toISOString()
          .split("T")[0];
        return (
          dataRefeicao === hoje &&
          refeicao.paciente_id === this.pacienteAtual.id
        );
      });
    } catch (erro) {
      console.error("Erro ao carregar refeições:", erro);
      this.refeicoesHoje = [];
    }
  }

  /**
   * *** MODIFICADO ***
   * Atualiza o resumo para mostrar apenas o consumido
   */
  atualizarResumoConsumido() {
    const caloriasConsumidas = this.calcularCaloriasConsumidas();

    // Esconde o "info-1" (restantes)
    const info1 = document.querySelector(".info-1");
    if (info1) {
      info1.style.display = "none";
    }

    // Atualiza calorias consumidas
    const info2Kcal = document.querySelector(".info-2-kcal");
    if (info2Kcal) {
      info2Kcal.textContent = `${Math.round(caloriasConsumidas)}kcal`;
    }
    
    // Centraliza o "info-2"
    const topLeftContent = document.querySelector(".top-left-content");
    if (topLeftContent) {
        topLeftContent.style.justifyContent = "center";
    }

    this.caloriasConsumidas = caloriasConsumidas;
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
   * *** MODIFICADO ***
   * Atualiza os macros para mostrar apenas o consumido
   */
  atualizarMacrosConsumidos() {
    const consumoMacros = this.calcularMacronutrientesConsumidos();
    const prescricoesFiels = document.querySelectorAll(".prescricoes-field");

    if (prescricoesFiels.length >= 3) {
      // Carboidratos
      this.atualizarCampoMacroConsumido(
        prescricoesFiels[0],
        "Carboidratos",
        consumoMacros.carboidratos
      );

      // Proteínas
      this.atualizarCampoMacroConsumido(
        prescricoesFiels[1],
        "Proteínas",
        consumoMacros.proteinas
      );

      // Gorduras
      this.atualizarCampoMacroConsumido(
        prescricoesFiels[2],
        "Gorduras",
        consumoMacros.gorduras
      );
    }
  }

  /**
   * *** MODIFICADO ***
   * Atualiza um campo de macro (sem meta)
   */
  atualizarCampoMacroConsumido(elemento, nome, consumido) {
    if (!elemento) return;

    // Atualiza título
    const titulo = elemento.querySelector(".carb");
    if (titulo) {
      titulo.textContent = nome;
    }

    // Esconde a barra de progresso
    const barFill = elemento.querySelector(".bar-container");
    if (barFill) {
      barFill.style.display = "none";
    }

    // Atualiza quantidade em gramas
    const grams = elemento.querySelector(".grams");
    if (grams) {
      grams.textContent = `${consumido.toFixed(1)}g`;
      grams.style.justifyContent = 'flex-end'; // Garante alinhamento
      grams.style.width = 'auto'; // Ajusta largura
      grams.style.marginRight = '0';
      grams.style.marginLeft = '15px';
    }
  }

  /**
   * Calcula macronutrientes consumidos
   */
  calcularMacronutrientesConsumidos() {
    const macros = {
      carboidratos: 0,
      proteinas: 0,
      gorduras: 0,
    };

    this.refeicoesHoje.forEach((refeicao) => {
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
    const rightContent = document.querySelector(".rigth-content");
    if (!rightContent) return;

    rightContent.innerHTML = "";

    if (this.refeicoesHoje.length === 0) {
      rightContent.innerHTML = `
        <div style="padding: 30px; text-align: center; color: #999;">
          <p>Nenhuma refeição registrada hoje</p>
          <p style="font-size: 12px; margin-top: 10px;">Adicione sua primeira refeição abaixo!</p>
        </div>
      `;
      return;
    }

    this.refeicoesHoje.forEach((refeicao) => {
      const fieldElement = this.criarElementoRefeicao(refeicao);
      rightContent.appendChild(fieldElement);
    });
  }

  /**
   * Cria elemento de refeição
   */
  criarElementoRefeicao(refeicao) {
    const field = document.createElement("div");
    field.className = "field";
    field.style.position = "relative";

    // 🆕 BUSCA AVALIAÇÃO DO NUTRICIONISTA
    const avaliacoes =
      JSON.parse(localStorage.getItem("avaliacoes_refeicoes")) || [];
    const avaliacaoDaRefeicao = avaliacoes.find(
      (a) => a.refeicao_id === refeicao.id
    );

    const imageDiv = document.createElement("div");
    imageDiv.className = "image";
    const img = document.createElement("img");
    img.className = "right-field-img";
    img.src = refeicao.imagem || "../assets/img/cafe_manha.jpg";
    img.alt = refeicao.nome;
    imageDiv.appendChild(img);

    const fieldInfo = document.createElement("div");
    fieldInfo.className = "field-info";

    const titulo = document.createElement("h1");
    titulo.className = "field-title";
    titulo.textContent = refeicao.nome; // Ex: "Almoço"

    const descricao = document.createElement("p");
    descricao.className = "field-desc";
    descricao.textContent = refeicao.descricao || "Sem descrição"; // Ex: "Frango com legumes"

    const calorias = document.createElement("p");
    calorias.style.cssText =
      "font-weight: bold; color: #4caf50; margin-top: 5px;";
    calorias.textContent = `${Math.round(refeicao.calorias)} kcal`;

    fieldInfo.appendChild(titulo);
    fieldInfo.appendChild(descricao);
    fieldInfo.appendChild(calorias);

    // 🆕 MOSTRA AVALIAÇÃO DO NUTRICIONISTA (SE EXISTIR)
    if (avaliacaoDaRefeicao) {
        // ... (código do modal de avaliação mantido, sem alterações) ...
    }

    // Nutrientes
    const nutrientesDiv = document.createElement("div");
    nutrientesDiv.className = "nutrientes-m";

    if (refeicao.macros) {
      nutrientesDiv.appendChild(
        this.criarElementoNutriente(
          "../assets/img/trigo.jpg",
          refeicao.macros.carboidratos || 0
        )
      );

      nutrientesDiv.appendChild(
        this.criarElementoNutriente(
          "../assets/img/carne.jpg",
          refeicao.macros.proteinas || 0
        )
      );

      nutrientesDiv.appendChild(
        this.criarElementoNutriente(
          "../assets/img/abacate.jpg",
          refeicao.macros.gorduras || 0
        )
      );
    }

    // Botão de remover
    const btnRemover = document.createElement("button");
    btnRemover.style.cssText = `
        border: none;
        background-color: #1f2420;
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        height: 100px;
        margin-left:30px;
        width: 50px;
        font-size: 16px;
        transition: transform 0.2s ease;
    `;

    const icon = document.createElement("i");
    icon.classList.add("fa-solid", "fa-trash");
    icon.style.fontWeight = "600";
    icon.style.fontSize = "20px";
    icon.style.pointerEvents = "none";

    btnRemover.appendChild(icon);

    btnRemover.addEventListener("mouseenter", () => {
      btnRemover.style.transform = "translatex(9px)";
    });

    btnRemover.addEventListener("mouseleave", () => {
      btnRemover.style.transform = "translatex(0)";
    });

    btnRemover.addEventListener("click", () =>
      this.removerRefeicao(refeicao.id)
    );

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
    const nutriente = document.createElement("div");
    nutriente.className = "nutriente-m";

    const img = document.createElement("img");
    img.src = imagem;
    img.alt = "Nutriente";

    const barContainer = document.createElement("div");
    barContainer.className = "bar-container-m";

    const barFill = document.createElement("div");
    barFill.className = "bar-fill-m";
    // *** MODIFICADO ***
    // A barra aqui é apenas visual, não representa meta
    barFill.style.width = `${Math.min(valor, 100)}%`; // Largura baseada no valor, max 100%

    barContainer.appendChild(barFill);

    const grams = document.createElement("span");
    grams.className = "grams-m";
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
    // ... (código do calendário mantido, sem alterações) ...
    // ...
  }

  /**
   * Inicializa eventos
   */
  inicializarEventos() {
    // Botões de adicionar refeição
    const addButtons = document.querySelectorAll(".add-button");
    addButtons.forEach((button) => {
      button.addEventListener("click", (e) =>
        this.abrirModalAdicionarRefeicao(e)
      );
    });
  }

  /**
   * Abre modal para adicionar refeição
   */
  abrirModalAdicionarRefeicao(event) {
    const button = event.target;
    const field = button.closest(".field-2");
    if (!field) return;

    const tipoRefeicao = field.querySelector(".field-2-title").textContent;
    
    // *** NOVO ***
    // Verifica se o plano existe antes de abrir o modal
    if (!this.planoRefeicoesAtual) {
      this.mostrarNotificacao("Você ainda não tem um plano de refeições.", "erro");
      return;
    }
    
    this.mostrarModalRefeicao(tipoRefeicao);
  }

  /**
   * *** MODIFICADO ***
   * Mostra modal com dropdown de pratos
   */
  mostrarModalRefeicao(tipoRefeicao) {
    // Remove modal anterior se existir
    const modalAnterior = document.getElementById("modal-adicionar-refeicao");
    if (modalAnterior) modalAnterior.remove();
    
    // *** NOVO ***
    // Pega a chave correta (ex: "breakfast")
    const mealKey = this.mapaTiposRefeicao[tipoRefeicao];
    if (!mealKey) {
        console.error("Tipo de refeição não mapeado:", tipoRefeicao);
        return;
    }

    // Pega os pratos prescritos para esta refeição
    const pratos = this.planoRefeicoesAtual[mealKey];
    
    if (!pratos || pratos.length === 0) {
        this.mostrarNotificacao(`O nutricionista não cadastrou pratos para ${tipoRefeicao}.`, "info");
        return;
    }

    // Cria as opções do dropdown
    let opcoesDropdown = pratos.map((prato, index) => {
        return `<option value="${index}">
            ${prato.nome} (${prato.kcal} kcal)
        </option>`;
    }).join('');
    // *** FIM NOVO ***


    const modal = document.createElement("div");
    modal.id = "modal-adicionar-refeicao";
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

    // *** MODIFICADO ***
    // O HTML do modal agora usa <select> e <textarea>
    modal.innerHTML = `
      <div style="
        background: #ffffffff;
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
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Selecione o Prato:</label>
            <select id="refeicao-prato-select" required>
              <option value="" disabled selected>Escolha um prato...</option>
              ${opcoesDropdown}
            </select>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Observação (opcional):</label>
            <textarea id="refeicao-observacao"
              placeholder="Ex: Troquei o brócolis por couve-flor..."
            ></textarea>
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
    // *** FIM MODIFICADO ***


    document.body.appendChild(modal);

    // Eventos
    const form = document.getElementById("form-adicionar-refeicao");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // *** MODIFICADO ***
      // Chama a nova função de salvar
      this.salvarRefeicaoSelecionada(tipoRefeicao, mealKey); 
    });

    document
      .getElementById("btn-cancelar-refeicao")
      .addEventListener("click", () => {
        modal.remove();
      });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * *** MODIFICADO ***
   * Salva a refeição selecionada do dropdown
   */
  salvarRefeicaoSelecionada(tipoRefeicao, mealKey) {
    const pratoIndex = document.getElementById("refeicao-prato-select").value;
    const observacao = document.getElementById("refeicao-observacao").value;

    if (!pratoIndex) {
        this.mostrarNotificacao("Por favor, selecione um prato.", "erro");
        return;
    }
    
    // Pega o objeto do prato selecionado
    const pratoSelecionado = this.planoRefeicoesAtual[mealKey][pratoIndex];

    if (!pratoSelecionado) {
        this.mostrarNotificacao("Erro ao encontrar o prato selecionado.", "erro");
        return;
    }

    const refeicao = {
      id: this.gerarId(),
      paciente_id: this.pacienteAtual.id,
      nome: tipoRefeicao, // Ex: "Almoço"
      descricao: pratoSelecionado.nome, // Ex: "Frango grelhado com legumes"
      calorias: pratoSelecionado.kcal,
      macros: {
        carboidratos: pratoSelecionado.carb,
        proteinas: pratoSelecionado.prot,
        gorduras: pratoSelecionado.gord,
      },
      data: this.dataAtual.toISOString(),
      imagem: this.obterImagemPorTipo(tipoRefeicao),
      observacao_paciente: observacao,
      observacao_nutricionista: pratoSelecionado.obs // Salva a obs. original do nutri
    };

    try {
      const refeicoes = JSON.parse(localStorage.getItem("refeicoes")) || [];
      refeicoes.push(refeicao);
      localStorage.setItem("refeicoes", JSON.stringify(refeicoes));

      this.mostrarNotificacao(
        `${tipoRefeicao} adicionada com sucesso!`,
        "sucesso"
      );

      document.getElementById("modal-adicionar-refeicao").remove();
      this.atualizarDashboard();
    } catch (erro) {
      console.error("Erro ao salvar refeição:", erro);
      this.mostrarNotificacao("Erro ao salvar refeição", "erro");
    }
  }

  /**
   * Remove uma refeição
   */
  removerRefeicao(refeicaoId) {
    if (!confirm("Deseja realmente remover esta refeição?")) return;

    try {
      const refeicoes = JSON.parse(localStorage.getItem("refeicoes")) || [];
      const indice = refeicoes.findIndex((r) => r.id === refeicaoId);

      if (indice >= 0) {
        refeicoes.splice(indice, 1);
        localStorage.setItem("refeicoes", JSON.stringify(refeicoes));
        this.mostrarNotificacao("Refeição removida", "sucesso");
        this.atualizarDashboard();
      }
    } catch (erro) {
      console.error("Erro ao remover refeição:", erro);
      this.mostrarNotificacao("Erro ao remover refeição", "erro");
    }
  }

  /**
   * Atualiza a dashboard
   */
  atualizarDashboard() {
    this.carregarRefeicoesHoje();
    this.atualizarResumoConsumido();
    this.atualizarMacrosConsumidos();
    this.atualizarUltimasRefeicoes();
  }

  /**
   * Obtém imagem por tipo de refeição
   */
  obterImagemPorTipo(tipo) {
    const imagens = {
      "Café da manhã": "../assets/img/cafe_manha.jpg",
      Almoço: "../assets/img/almoco.jpg",
      "Lanche da tarde": "../assets/img/lancheTarde.jpg",
      Jantar: "../assets/img/jantar.jpg",
    };
    return imagens[tipo] || "../assets/img/cafe_manha.jpg";
  }

  /**
   * Mostra modal de avaliação (sem alterações)
   */
  mostrarModalAvaliacao(avaliacao, refeicao) {
    // ... (código do modal de avaliação mantido, sem alterações) ...
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
  mostrarNotificacao(mensagem, tipo = "info") {
    const notificacao = document.createElement("div");
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${
        tipo === "sucesso" ? "#4caf50" : tipo === "erro" ? "#f44336" : "#2196f3"
      };
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
document.addEventListener("DOMContentLoaded", () => {
  window.dashboardPacienteManager = new DashboardPacienteManager();
});
