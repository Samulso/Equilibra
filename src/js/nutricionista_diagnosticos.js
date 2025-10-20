/**
 * Sistema de Gerenciamento de Diagnósticos - Nutricionista
 * Gerencia a visualização e avaliação de diagnósticos de pacientes
 */

class NutricionistaDiagnosticosManager {
  constructor() {
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
   * Carrega os diagnósticos do localStorage
   */
  carregarDiagnosticos() {
    try {
      this.diagnosticosEnviados = JSON.parse(localStorage.getItem("diagnosticos_enviados")) || [];
      this.diagnosticosAvaliados = JSON.parse(localStorage.getItem("diagnosticos_avaliados")) || [];
    } catch (erro) {
      console.error("Erro ao carregar diagnósticos:", erro);
      this.diagnosticosEnviados = [];
      this.diagnosticosAvaliados = [];
    }
  }

  /**
   * Renderiza a lista de diagnósticos
   */
  renderizarDiagnosticos() {
    const lista = document.getElementById("diagnosticos-lista");
    if (!lista) return;

    lista.innerHTML = "";

    const filtroStatus = document.getElementById("filtro-status");
    const statusFiltro = filtroStatus ? filtroStatus.value : "";

    let diagnosticos = [...this.diagnosticosEnviados, ...this.diagnosticosAvaliados];

    if (statusFiltro) {
      diagnosticos = diagnosticos.filter(d => d.status === statusFiltro);
    }

    if (diagnosticos.length === 0) {
      lista.innerHTML = '<p class="sem-diagnosticos">Nenhum diagnóstico encontrado</p>';
      return;
    }

    diagnosticos.forEach(diagnostico => {
      const card = this.criarCardDiagnostico(diagnostico);
      lista.appendChild(card);
    });
  }

  /**
   * Cria um card para um diagnóstico
   */
  criarCardDiagnostico(diagnostico) {
    const card = document.createElement("div");
    card.className = `diagnostico-card status-${diagnostico.status}`;

    const dataCriacao = new Date(diagnostico.data_criacao).toLocaleDateString("pt-BR");
    const idade = diagnostico.informacoes_saude.idade || "N/A";
    const objetivo = diagnostico.objetivo_principal || "Não informado";
    const statusTexto = this.obterTextoStatus(diagnostico.status);

    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">Nome: ${diagnostico.paciente_id}</h3>
        <p><strong>Data do Diagnóstico:</strong> ${dataCriacao}</p>
        <div class="card-body">
          <div class="card-info">
            <p><strong>Idade:</strong> ${idade} anos</p>
            <p><strong>Gênero:</strong> ${diagnostico.informacoes_saude.sexo || "N/A"}</p>
            <p><strong>Objetivo:</strong> ${objetivo}</p>
          </div>
          <div class="rigth-content">
            <span class="card-status status-badge-${diagnostico.status}">${statusTexto}</span>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn-visualizar" data-diagnostico-id="${diagnostico.id}">Visualizar e Avaliar</button>
        </div>
      </div>
    `;

    const btnVisualizar = card.querySelector(".btn-visualizar");
    btnVisualizar.addEventListener("click", () => this.abrirModalDiagnostico(diagnostico));

    return card;
  }

  /**
   * Obtém o texto do status
   */
  obterTextoStatus(status) {
    const statusMap = {
      "enviado_para_avaliacao": "Pendente de Avaliação",
      "avaliado": "Avaliado"
    };
    return statusMap[status] || status;
  }

  /**
   * Abre o modal com os dados do diagnóstico
   */
  abrirModalDiagnostico(diagnostico) {
    this.diagnosticoAtual = diagnostico;
    this.preencherModalComDados(diagnostico);
    
    const modal = document.getElementById("modal-diagnostico");
    if (modal) {
      modal.style.display = "flex";
    }
  }

  /**
   * Preenche o modal com os dados do diagnóstico
   */
  preencherModalComDados(diagnostico) {
    const d = diagnostico.informacoes_saude;
    const h = diagnostico.historico_medico;

    document.getElementById("modal-nomePaciente").textContent = `Paciente ID: ${diagnostico.paciente_id}`;
    document.getElementById("modal-dataNascimento").textContent = d.data_nascimento || "N/A";
    document.getElementById("modal-genero").textContent = d.sexo || "N/A";
    document.getElementById("modal-profissao").textContent = d.profissao || "N/A";

    document.getElementById("modal-nivelAtividadeFisica").textContent = d.nivel_atividade_fisica || "N/A";
    document.getElementById("modal-qualidadeSono").textContent = d.qualidade_sono || "N/A";
    document.getElementById("modal-refeicoesDia").textContent = d.refeicoes_por_dia || "N/A";
    document.getElementById("modal-consumoAgua").textContent = d.consumo_agua ? `${d.consumo_agua} copos` : "N/A";

    document.getElementById("modal-preferenciasAlimentares").textContent = d.preferencias_alimentares || "Não informado";
    document.getElementById("modal-restricoes").textContent = d.aversoes_restricoes || "Não informado";
    
    const frequencia = d.frequencia_consumo;
    const itensFrequencia = [];
    if (frequencia.refrigerantes) itensFrequencia.push("Refrigerantes");
    if (frequencia.frituras) itensFrequencia.push("Frituras");
    if (frequencia.doces) itensFrequencia.push("Doces");
    if (frequencia.ultraprocessados) itensFrequencia.push("Ultraprocessados");
    document.getElementById("modal-frequenciaConsumo").textContent = itensFrequencia.length > 0 ? itensFrequencia.join(", ") : "Nenhum";

    document.getElementById("modal-doencaDiagnosticada").textContent = h.doencas_diagnosticadas || "Nenhuma";
    document.getElementById("modal-medicamento").textContent = h.medicamentos_continuos || "Nenhum";
    document.getElementById("modal-suplementos").textContent = h.suplementos_vitaminas || "Nenhum";
    document.getElementById("modal-digestao").textContent = h.digestao || "Normal";
    document.getElementById("modal-queixasGerais").textContent = h.queixas_gerais || "Nenhuma";

    document.getElementById("modal-objetivoPrincipal").textContent = diagnostico.objetivo_principal || "Não informado";

    this.preencherFormularioPrescricao(diagnostico);
  }

  /**
   * Preenche o formulário de prescrição com dados existentes
   */
  preencherFormularioPrescricao(diagnostico) {
    const form = document.getElementById("form-prescricao");
    if (!form) return;

    if (diagnostico.prescricao_calorias) {
      document.getElementById("prescricao-calorias").value = diagnostico.prescricao_calorias;
      document.getElementById("prescricao-carboidratos").value = diagnostico.macronutrientes_recomendados.carboidratos_percentual || "";
      document.getElementById("prescricao-proteinas").value = diagnostico.macronutrientes_recomendados.proteinas_percentual || "";
      document.getElementById("prescricao-gorduras").value = diagnostico.macronutrientes_recomendados.gorduras_percentual || "";
      document.getElementById("prescricao-observacoes").value = diagnostico.observacoes_nutricionista || "";
    } else {
      form.reset();
    }
  }

  /**
   * Inicializa os eventos
   */
  inicializarEventos() {
    const filtroStatus = document.getElementById("filtro-status");
    if (filtroStatus) {
      filtroStatus.addEventListener("change", () => this.renderizarDiagnosticos());
    }

    const btnFecharModal = document.getElementById("btn-fechar-modal");
    if (btnFecharModal) {
      btnFecharModal.addEventListener("click", () => this.fecharModal());
    }

    const btnCancelarPrescricao = document.getElementById("btn-cancelar-prescricao");
    if (btnCancelarPrescricao) {
      btnCancelarPrescricao.addEventListener("click", () => this.fecharModal());
    }

    const formPrescricao = document.getElementById("form-prescricao");
    if (formPrescricao) {
      formPrescricao.addEventListener("submit", (e) => this.handleSubmitPrescricao(e));
    }

    const modal = document.getElementById("modal-diagnostico");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.fecharModal();
        }
      });
    }
  }

  /**
   * Trata o submit do formulário de prescrição
   */
  handleSubmitPrescricao(event) {
    event.preventDefault();

    if (!this.diagnosticoAtual) {
      this.mostrarNotificacao("Erro: Nenhum diagnóstico selecionado", "erro");
      return;
    }

    const formData = new FormData(event.target);
    
    const prescricao = {
      prescricao_calorias: parseFloat(formData.get("prescricao_calorias")) || 0,
      macronutrientes_recomendados: {
        carboidratos_percentual: parseFloat(formData.get("carboidratos_percentual")) || 0,
        proteinas_percentual: parseFloat(formData.get("proteinas_percentual")) || 0,
        gorduras_percentual: parseFloat(formData.get("gorduras_percentual")) || 0
      },
      observacoes_nutricionista: formData.get("observacoes_nutricionista") || ""
    };

    if (!this.validarPrescricao(prescricao)) {
      return;
    }

    this.atualizarDiagnosticoComPrescricao(prescricao);

    this.fecharModal();
    this.mostrarNotificacao("Diagnóstico avaliado e salvo com sucesso!", "sucesso");

    this.renderizarDiagnosticos();
  }

  /**
   * Valida os dados da prescrição
   */
  validarPrescricao(prescricao) {
    const { prescricao_calorias, macronutrientes_recomendados } = prescricao;
    const { carboidratos_percentual, proteinas_percentual, gorduras_percentual } = macronutrientes_recomendados;

    if (prescricao_calorias <= 0) {
      this.mostrarNotificacao("As calorias devem ser um valor positivo.", "erro");
      return false;
    }

    const somaPercentuais = carboidratos_percentual + proteinas_percentual + gorduras_percentual;
    if (Math.abs(somaPercentuais - 100) > 0.1) {
      this.mostrarNotificacao(`A soma dos percentuais de macronutrientes deve ser 100%, mas é ${somaPercentuais.toFixed(2)}%.`, "erro");
      return false;
    }

    return true;
  }

  /**
   * Atualiza o diagnóstico com a prescrição
   */
  atualizarDiagnosticoComPrescricao(prescricao) {
    this.diagnosticoAtual.status = "avaliado";
    this.diagnosticoAtual.prescricao_calorias = prescricao.prescricao_calorias;
    this.diagnosticoAtual.macronutrientes_recomendados = prescricao.macronutrientes_recomendados;
    this.diagnosticoAtual.observacoes_nutricionista = prescricao.observacoes_nutricionista;

    const index = this.diagnosticosEnviados.findIndex(d => d.id === this.diagnosticoAtual.id);
    if (index !== -1) {
      this.diagnosticosEnviados.splice(index, 1);
    }

    const avaliadoIndex = this.diagnosticosAvaliados.findIndex(d => d.id === this.diagnosticoAtual.id);
    if (avaliadoIndex !== -1) {
      this.diagnosticosAvaliados[avaliadoIndex] = this.diagnosticoAtual;
    } else {
      this.diagnosticosAvaliados.push(this.diagnosticoAtual);
    }

    this.salvarDiagnosticos();
  }

  /**
   * Salva os diagnósticos no localStorage
   */
  salvarDiagnosticos() {
    localStorage.setItem("diagnosticos_enviados", JSON.stringify(this.diagnosticosEnviados));
    localStorage.setItem("diagnosticos_avaliados", JSON.stringify(this.diagnosticosAvaliados));
  }

  /**
   * Fecha o modal
   */
  fecharModal() {
    const modal = document.getElementById("modal-diagnostico");
    if (modal) {
      modal.style.display = "none";
    }
    this.diagnosticoAtual = null;
  }

  /**
   * Mostra uma notificação
   */
  mostrarNotificacao(mensagem, tipo) {
    const container = document.getElementById("notificacao-container");
    if (!container) return;

    const notificacao = document.createElement("div");
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;

    container.appendChild(notificacao);

    setTimeout(() => {
      notificacao.remove();
    }, 5000);
  }
}

// Inicializa o manager quando o DOM está pronto
document.addEventListener("DOMContentLoaded", () => {
  window.nutricionistaDiagnosticosManager = new NutricionistaDiagnosticosManager();
});
