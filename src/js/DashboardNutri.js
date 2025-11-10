class NutricionistaPacientesManager {
  constructor() {
    //requer login de nutri
    if (
      !window.authManager ||
      !window.authManager.protegerPagina("nutricionista")
    ) {
      return;
    }

    this.nutricionistaAtual = window.authManager.obterUsuarioAtual();
    this.meusPacientes = [];
    this.pacienteAtual = null;

    this.inicializar();
  }

  inicializar() {
    this.carregarMeusPacientes();
    this.renderizarListaPacientes();
    this.inicializarEventos();
  }

  carregarMeusPacientes() {
    const diagnosticosAvaliados =
      JSON.parse(localStorage.getItem("diagnosticos_avaliados")) || [];
    const meusDiagnosticos = diagnosticosAvaliados.filter(
      (d) => d.nutricionista_id === this.nutricionistaAtual.id
    );

    const pacientesUnicos = new Map();

    meusDiagnosticos.forEach((diagnostico) => {
      const pacienteId = diagnostico.paciente_id;

      if (
        !pacientesUnicos.has(pacienteId) ||
        new Date(diagnostico.data_avaliacao) >
          new Date(pacientesUnicos.get(pacienteId).data_avaliacao)
      ) {
        pacientesUnicos.set(pacienteId, {
          id: pacienteId,
          nome: diagnostico.paciente_nome || "Paciente",
          diagnostico: diagnostico,
          objetivo: diagnostico.objetivo_principal,
          calorias: diagnostico.prescricao_calorias,
          macros: diagnostico.macronutrientes_recomendados,
        });
      }
    });

    this.meusPacientes = Array.from(pacientesUnicos.values());

    console.log(`Total de pacientes únicos: ${this.meusPacientes.length}`);
  }

  renderizarListaPacientes() {
    const lista = document.getElementById("patients-list");
    const emptyState = document.getElementById("empty-state");
    const countBadge = document.getElementById("patient-count");

    lista.innerHTML = "";

    if (this.meusPacientes.length === 0) {
      emptyState.style.display = "block";
      countBadge.textContent = "0 pacientes";
      console.log("⚠️ Nenhum paciente encontrado");
      return;
    }

    emptyState.style.display = "none";

    countBadge.textContent = `${this.meusPacientes.length} pacientes${
      this.meusPacientes.length > 1 ? "s" : ""
    }`;

    this.meusPacientes.forEach((paciente) => {
      const card = this.criarCardPaciente(paciente);
      lista.appendChild(card);
    });
  }

  criarCardPaciente(paciente) {
    const li = document.createElement("li");
    li.className = "patients";

    li.innerHTML = `
                <img class="perfil" src="../assets/img/avatar-default.png" alt="Foto de ${
                  paciente.nome
                }">
                    <div class="patient-infos">
                        <h1>${paciente.nome}</h1>
                        <p><strong>Objetivo:</strong> ${
                          paciente.objetivo || "Não informado"
                        }</p>
                        <p><strong>Prescrição:</strong> ${
                          paciente.calorias
                        } kcal/dia</p>
                    </div>

                    <div class="buttons">
                        <button class="info" data-patient-id="${paciente.id}">
                            <i class="fa-solid fa-circle-info" ></i>
                            <span style="display="flex";top="10px">Detalhes</span> 
                        </button>

                        <button class="visualizer" data-patient-id="${
                          paciente.id
                        }">
                            <i class="fa-solid fa-eye"></i>
                            <span>Ver refeições</span>
                        </button>
                    </div>
                
        `;
    return li;
  }

  inicializarEventos() {
    const lista = document.getElementById("patients-list");
    lista.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (!button) return;

      const pacienteId = button.dataset.patientId;
      if (button.classList.contains("visualizer")) {
        this.abrirModalRefeicoes(pacienteId);
      }

      if (button.classList.contains("info")) {
        console.log(`ℹ️ Clicou em "Detalhes" do paciente: ${pacienteId}`);
        this.mostrarDetalhesPaciente(pacienteId);
      }
    });

    const closeBtn = document.getElementById("close-modal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.fecharModal());
    }

    const modal = document.getElementById("modal-refeicoes");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
          this.fecharModal();
        }
      });
    }
  }

  abrirModalRefeicoes(pacienteId) {
    const paciente = this.meusPacientes.find((p) => p.id === pacienteId);
    if (!paciente) {
      alert("paciente não encontrado.");
      return;
    }

    console.log("📋 Dados do paciente:", paciente);

    this.pacienteAtual = paciente;

    const modalTitle = document.getElementById("modal-patient-name");
    modalTitle.textContent = `Refeições de ${paciente.nome}`;

    this.carregarRefeicoesDoModal(pacienteId);

    const modal = document.getElementById("modal-refeicoes");
    modal.style.display = "flex";
  }

  carregarRefeicoesDoModal(pacienteId) {
    const todasRefeicoes = JSON.parse(localStorage.getItem("refeicoes")) || [];
    const refeicoesoPaciente = todasRefeicoes.filter(
      (r) => r.paciente_id === pacienteId
    );
    const modalBody = document.getElementById("modal-refeicoes-list");
    modalBody.innerHTML = "";

    if (refeicoesoPaciente.length === 0) {
      modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <p>Este paciente ainda não registrou nenhuma refeição</p>
                </div>
            `;
      return;
    }

    const refeicoesPorData = this.agruparPorData(refeicoesoPaciente);
    refeicoesPorData.forEach((grupo) => {
      const secao = this.criarSecaoData(grupo.data, grupo.refeicoes);
      modalBody.appendChild(secao);
    });
  }

  agruparPorData(refeicoes) {
    const grupos = new Map();
    refeicoes.forEach((refeicao) => {
      const data = new Date(refeicao.data).toISOString().split("T")[0];

      if (!grupos.has(data)) {
        grupos.set(data, []);
      }

      grupos.get(data).push(refeicao);
    });

    return Array.from(grupos.entries())
      .map(([data, refeicoes]) => ({ data, refeicoes }))
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  criarSecaoData(data, refeicoes) {
    const div = document.createElement("div");
    div.className = "refeicoes-data-grupo";
    div.style.marginBottom = "30px";

    const dataFormatada = new Date(data + "T00:00:00").toLocaleDateString(
      "pt-BR",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    div.innerHTML = `
            <h3 style="color: #667eea; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #eee;">
                ${dataFormatada}
            </h3>
        `;

    refeicoes.forEach((refeicao) => {
      const cardRefeicao = this.criarCardRefeicao(refeicao);
      div.appendChild(cardRefeicao);
    });

    return div;
  }

  criarCardRefeicao(refeicao) {
    const div = document.createElement("div");
    div.className = "refeicao-card";
    div.style.cssText = `
        background: white;
        border: 1px solid #eee;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 15px;
        position: relative;
    `;

    // 🆕 VERIFICA SE JÁ FOI AVALIADA
    const avaliacoes =
      JSON.parse(localStorage.getItem("avaliacoes_refeicoes")) || [];
    const avaliacaoExistente = avaliacoes.find(
      (a) => a.refeicao_id === refeicao.id
    );

    // 🆕 BADGE DE STATUS
    const badgeStatus = avaliacaoExistente
      ? `<span style="
            position: absolute;
            top: 90px;
            right: 15px;
            background: #4caf50;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
          ">
            <i class="fa-solid fa-check-circle"></i>
            Avaliado
          </span>`
      : `<span style="
            position: absolute;
            top: 90px;
            right: 15px;
            background: #ff9800;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
          ">
            <i class="fa-solid fa-clock"></i>
            Pendente
          </span>`;

    div.innerHTML = `
        ${badgeStatus}
        
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1; padding-right: 100px;">
                <h4 style="color: #333; margin-bottom: 10px;">${
                  refeicao.nome
                }</h4>
                <p style="color: #666; margin-bottom: 10px;">${
                  refeicao.descricao
                }</p>
                
                <div style="display: flex; gap: 20px; margin-top: 15px;">
                    <div>
                        <strong style="color: #999; font-size: 0.85em;">CALORIAS</strong>
                        <p style="color: #333; font-size: 1.2em; font-weight: bold; margin: 5px 0;">${Math.round(
                          refeicao.calorias
                        )} kcal</p>
                    </div>
                    <div>
                        <strong style="color: #999; font-size: 0.85em;">CARBOIDRATOS</strong>
                        <p style="color: #ff9800; font-size: 1.2em; font-weight: bold; margin: 5px 0;">${
                          refeicao.macros.carboidratos
                        }g</p>
                    </div>
                    <div>
                        <strong style="color: #999; font-size: 0.85em;">PROTEÍNAS</strong>
                        <p style="color: #f44336; font-size: 1.2em; font-weight: bold; margin: 5px 0;">${
                          refeicao.macros.proteinas
                        }g</p>
                    </div>
                    <div>
                        <strong style="color: #999; font-size: 0.85em;">GORDURAS</strong>
                        <p style="color: #4caf50; font-size: 1.2em; font-weight: bold; margin: 5px 0;">${
                          refeicao.macros.gorduras
                        }g</p>
                    </div>
                </div>
                
                ${
                  avaliacaoExistente
                    ? `
                    <div style="
                        margin-top: 15px;
                        padding: 12px;
                        background: #f0f7ff;
                        border-left: 4px solid #2196f3;
                        border-radius: 5px;
                    ">
                        <strong style="color: #2196f3; font-size: 0.9em;">
                            Avaliação anterior:
                        </strong>
                        <p style="color: #666; margin-top: 5px; font-size: 0.9em;">
                            ${
                              avaliacaoExistente.avaliacao === "bom"
                                ? "👍 Bom"
                                : avaliacaoExistente.avaliacao === "neutro"
                                ? "😐 Neutro"
                                : "👎 Ruim"
                            }
                            ${
                              avaliacaoExistente.observacao
                                ? ` - ${avaliacaoExistente.observacao}`
                                : ""
                            }
                        </p>
                    </div>
                `
                    : ""
                }
            </div>
            
            <div style="display: flex; gap: 10px; margin-left: 20px;">
                <button class="emoji-btn" data-refeicao-id="${
                  refeicao.id
                }" data-avaliacao="bom" style="
                    border: none;
                    background-color: transparent;
                    cursor: pointer;
                    transition: all 0.3s;
                    ${
                      avaliacaoExistente?.avaliacao === "bom"
                        ? "opacity: 1; transform: scale(1.1);"
                        : ""
                    }
                ">
                    <img src="../assets/img/otimo.jpg" alt="Bom" style="width: 50px; height: 50px;">
                </button>
                
                <button class="emoji-btn" data-refeicao-id="${
                  refeicao.id
                }" data-avaliacao="neutro" style="
                    border: none;
                    background-color: transparent;
                    cursor: pointer;
                    transition: all 0.3s;
                    ${
                      avaliacaoExistente?.avaliacao === "neutro"
                        ? "opacity: 1; transform: scale(1.1);"
                        : ""
                    }
                ">
                    <img src="../assets/img/neutro.jpg" alt="Neutro" style="width: 50px; height: 50px;">
                </button>
                
                <button class="emoji-btn" data-refeicao-id="${
                  refeicao.id
                }" data-avaliacao="ruim" style="
                    border: none;
                    background-color: transparent;
                    cursor: pointer;
                    transition: all 0.3s;
                    ${
                      avaliacaoExistente?.avaliacao === "ruim"
                        ? "opacity: 1; transform: scale(1.1);"
                        : ""
                    }
                ">
                    <img src="../assets/img/ruim.jpg" alt="Ruim" style="width: 50px; height: 50px;">
                </button>
            </div>
        </div>
        
        <div id="obs-${refeicao.id}" style="display: ${
      avaliacaoExistente ? "block" : "none"
    }; margin-top: 15px;">
            <textarea placeholder="Adicione uma observação (opcional)..." style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                resize: vertical;
                min-height: 80px;
                font-family: inherit;
            ">${avaliacaoExistente?.observacao || ""}</textarea>
            <button class="salvar-avaliacao-btn" data-refeicao-id="${
              refeicao.id
            }" style="
                margin-top: 10px;
                padding: 10px 20px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
            ">${
              avaliacaoExistente ? "Atualizar Avaliação" : "Salvar Avaliação"
            }</button>
        </div>
    `;

    const emojiBtns = div.querySelectorAll(".emoji-btn");
    emojiBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.selecionarEmoji(btn));
    });

    const salvarBtn = div.querySelector(".salvar-avaliacao-btn");
    salvarBtn.addEventListener("click", () =>
      this.salvarAvaliacao(refeicao.id)
    );

    return div;
  }

  selecionarEmoji(botao) {
    const refeicaoId = botao.dataset.refeicaoId;
    const avaliacao = botao.dataset.avaliacao;

    botao.closest(".refeicao-card").dataset.avaliacaoTemp = avaliacao;

    const todosBotoes = botao.closest("div").querySelectorAll(".emoji-btn");
    todosBotoes.forEach((b) => {
      b.style.opacity = "0.3";
      b.style.transform = "scale(0.9)";
    });

    botao.style.opacity = "1";
    botao.style.transform = "scale(1.1)";

    const campoObs = document.getElementById(`obs-${refeicaoId}`);
    campoObs.style.display = "block";
  }

  salvarAvaliacao(refeicaoId) {
    console.log(`💾 Salvando avaliação da refeição ${refeicaoId}...`);

    const card = document
      .querySelector(`[data-refeicao-id="${refeicaoId}"]`)
      .closest(".refeicao-card");
    const avaliacao = card.dataset.avaliacaoTemp;
    const observacao = card.querySelector("textarea").value;

    if (!avaliacao) {
      alert("Por favor, selecione uma avaliação primeiro!");
      return;
    }

    const avaliacaoObj = {
      id: `aval_${Date.now()}`,
      refeicao_id: refeicaoId,
      paciente_id: this.pacienteAtual.id,
      nutricionista_id: this.nutricionistaAtual.id,
      nutricionista_nome: this.nutricionistaAtual.nome,
      avaliacao: avaliacao,
      observacao: observacao,
      data_avaliacao: new Date().toISOString(),
    };

    const avaliacoes =
      JSON.parse(localStorage.getItem("avaliacoes_refeicoes")) || [];
    const indice = avaliacoes.findIndex((a) => a.refeicao_id === refeicaoId);

    if (indice >= 0) {
      avaliacoes.splice(indice, 1);
    }

    avaliacoes.push(avaliacaoObj);
    localStorage.setItem("avaliacoes_refeicoes", JSON.stringify(avaliacoes));

    
    alert("Avaliação salva com sucesso!");

    this.fecharModal();
  }
  mostrarDetalhesPaciente(pacienteId) {
    const paciente = this.meusPacientes.find((p) => p.id === pacienteId);
    if (!paciente) return;

    alert(`
            Detalhes do paciente
        Nome: ${paciente.nome}
        Objetivo: ${paciente.objetivo}
        Prescrição: ${paciente.calorias} kcal/dia

                Macronutrientes:
            • Carboidratos: ${paciente.macros.carboidratos_percentual}%
            • Proteínas: ${paciente.macros.proteinas_percentual}%
            • Gorduras: ${paciente.macros.gorduras_percentual}%

        `);
  }

  fecharModal() {
    const modal = document.getElementById("modal-refeicoes");
    modal.style.display = "none";
    this.pacienteAtual = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.nutricionistaPacientesManager = new NutricionistaPacientesManager();
});
