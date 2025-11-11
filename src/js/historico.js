class HistoricoRefeicoesManager {
  constructor() {
    if (!window.authManager || !window.authManager.protegerPagina("paciente")) {
      return;
    }

    this.pacienteAtual = window.authManager.obterUsuarioAtual();
    this.dataAtual = new Date();
    this.todasRefeicoes = [];
    this.refeicoesDoDay = [];

    this.inicializar();
  }

  inicializar() {
    console.log("🍽️ Iniciando histórico de refeições...");

    this.inicializarCalendario();
    this.carregarTodasRefeicoes();
    this.carregarRefeicoesDoDay(this.dataAtual);
    this.renderizarRefeicoes();
  }

  inicializarCalendario() {
    const diasContainer = document.getElementById("dias");
    if (!diasContainer) return;

    diasContainer.innerHTML = "";
    const hoje = new Date();
    const hojeSemHora = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate()
    );
    const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Gera 7 dias atrás + hoje + 7 dias à frente = 15 dias
    for (let i = -7; i <= 7; i++) {
      const data = new Date();
      data.setDate(hoje.getDate() + i);

      const dataSemHora = new Date(
        data.getFullYear(),
        data.getMonth(),
        data.getDate()
      );
      const eHoje = dataSemHora.getTime() === hojeSemHora.getTime();
      const ePassado = dataSemHora < hojeSemHora;

      const numero = data.getDate();
      const semana = diasDaSemana[data.getDay()];

      const diaDiv = document.createElement("div");
      diaDiv.classList.add("dia");

      // Marca o dia de hoje
      if (eHoje) {
        diaDiv.classList.add("ativo", "hoje");
        // Rola para o dia de hoje
        setTimeout(() => {
          diaDiv.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }, 100);
      }

      // Marca dias no passado (opcional)
      if (ePassado) {
        diaDiv.classList.add("passado");
      }

      diaDiv.innerHTML = `
            ${
              eHoje
                ? '<span style="font-size: 10px; display: block; margin-bottom: 2px;">HOJE</span>'
                : ""
            }
            <span class="numero">${numero}</span>
            <span class="semana">${semana}</span>
        `;

      // Evento de clique
      diaDiv.addEventListener("click", () => {
        document.querySelectorAll(".dia").forEach((d) => {
          d.classList.remove("ativo");
          // Mantém a classe "hoje" no dia atual
          if (!d.classList.contains("hoje")) {
            d.classList.remove("hoje");
          }
        });

        diaDiv.classList.add("ativo");
        this.dataAtual = data;
        this.carregarRefeicoesDoDay(data);
        this.renderizarRefeicoes();
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

  carregarTodasRefeicoes() {
    try {
      const refeicoes = JSON.parse(localStorage.getItem("refeicoes")) || [];
      this.todasRefeicoes = refeicoes.filter(
        (r) => r.paciente_id === this.pacienteAtual.id
      );

      console.log(`✅ ${this.todasRefeicoes.length} refeições carregadas`);
    } catch (erro) {
      console.error("Erro ao carregar refeições:", erro);
      this.todasRefeicoes = [];
    }
  }

  carregarRefeicoesDoDay(data) {
    const dataString = data.toISOString().split("T")[0];

    this.refeicoesDoDay = this.todasRefeicoes.filter((refeicao) => {
      const dataRefeicao = new Date(refeicao.data).toISOString().split("T")[0];
      return dataRefeicao === dataString;
    });

    console.log(`📅 ${this.refeicoesDoDay.length} refeições em ${dataString}`);
  }

  renderizarRefeicoes() {
    const lista = document.querySelector(".items-list");
    if (!lista) return;

    lista.innerHTML = "";

    const topicTitle = document.querySelector(".topic-title");
    if (topicTitle) {
      const dataFormatada = this.dataAtual.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      topicTitle.textContent = `Histórico de refeições - ${dataFormatada}`;
    }

    if (this.refeicoesDoDay.length === 0) {
      lista.innerHTML = `
                <div style="
                    text-align: center;
                    justify-content:center;
                    margin: 25px auto;
                    padding: 60px 20px;
                    color: #999;
                ">
                    
                    <h3 style="color: #666; margin-bottom: 10px;">Nenhuma refeição registrada</h3>
                    <p>Não há refeições registradas neste dia</p>
                </div>
            `;
      return;
    }

    const avaliacoes =
      JSON.parse(localStorage.getItem("avaliacoes_refeicoes")) || [];

    this.refeicoesDoDay.forEach((refeicao) => {
      const avaliacao = avaliacoes.find((a) => a.refeicao_id === refeicao.id);
      const li = this.criarItemRefeicao(refeicao, avaliacao);
      lista.appendChild(li);
    });
  }

  criarItemRefeicao(refeicao, avaliacao) {
    const li = document.createElement("li");
    li.className = "item";
    li.style.position = "relative";

    let badgeAvaliacao = "";
    if (avaliacao) {
      const emojiMap = {
        bom: "👍",
        neutro: "😐",
        ruim: "👎",
      };

      const corMap = {
        bom: { bg: "#d4edda", border: "#28a745" },
        neutro: { bg: "#fff3cd", border: "#ffc107" },
        ruim: { bg: "#f8d7da", border: "#dc3545" },
      };

      const cores = corMap[avaliacao.avaliacao];

      badgeAvaliacao = `
                <div style="
                    position: absolute;
                    top: 90px;
                    right: 210px;
                    z-index: 10;
                ">
                    <button class="btn-ver-avaliacao" data-refeicao-id="${
                      refeicao.id
                    }" style="
                        padding: 8px 15px;
                        background: ${cores.bg};
                        border: 2px solid ${cores.border};
                        border-radius: 20px;
                        color: ${cores.border};
                        font-weight: bold;
                        font-size: 0.9em;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    ">
                        <span style="font-size: 1.2em;">${
                          emojiMap[avaliacao.avaliacao]
                        }</span>
                        <span>Ver Avaliação</span>
                    </button>
                </div>
            `;
    }

    li.innerHTML = `
            ${badgeAvaliacao}
            
            <div class="field">
                <div class="image">
                    <img class="right-field-img" src="${
                      refeicao.imagem || "../assets/img/cafe_manha.jpg"
                    }" alt="${refeicao.nome}">
                </div>
                <div class="field-info">
                    <h1 class="field-title">${refeicao.nome}</h1>
                    <p class="field-desc">${refeicao.descricao}</p>
                    <p style="font-weight: bold; color: #4caf50; margin-top: 8px;">
                        ${Math.round(refeicao.calorias)} kcal
                    </p>
                </div>

                <div class="nutrientes-m">
                    <div class="nutriente-m">
                        <img src="../assets/img/trigo.jpg" alt="Carboidratos">
                        <div class="bar-container-m">
                            <div class="bar-fill-m" style="width: 70%;"></div>
                        </div>
                        <span class="grams-m">${
                          refeicao.macros.carboidratos
                        }g</span>
                    </div>

                    <div class="nutriente-m">
                        <img src="../assets/img/carne.jpg" alt="Proteínas">
                        <div class="bar-container-m">
                            <div class="bar-fill-m" style="width: 70%;"></div>
                        </div>
                        <span class="grams-m">${
                          refeicao.macros.proteinas
                        }g</span>
                    </div>

                    <div class="nutriente-m">
                        <img src="../assets/img/abacate.jpg" alt="Gorduras">
                        <div class="bar-container-m">
                            <div class="bar-fill-m" style="width: 70%;"></div>
                        </div>
                        <span class="grams-m">${
                          refeicao.macros.gorduras
                        }g</span>
                    </div>
                </div>                             
            </div>
            
            <div class="item-buttons">
                <button class="edit-btn" data-refeicao-id="${refeicao.id}">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="delete-btn" data-refeicao-id="${refeicao.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

    // Eventos dos botões
    const btnVerAvaliacao = li.querySelector(".btn-ver-avaliacao");
    if (btnVerAvaliacao) {
      btnVerAvaliacao.addEventListener("click", () => {
        this.mostrarModalAvaliacao(avaliacao, refeicao);
      });

      btnVerAvaliacao.addEventListener("mouseenter", () => {
        btnVerAvaliacao.style.transform = "scale(1.05)";
        btnVerAvaliacao.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
      });

      btnVerAvaliacao.addEventListener("mouseleave", () => {
        btnVerAvaliacao.style.transform = "scale(1)";
        btnVerAvaliacao.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
      });
    }

    const btnEditar = li.querySelector(".edit-btn");
    btnEditar.addEventListener("click", () => {
      alert("Funcionalidade de editar em desenvolvimento!");
    });

    const btnDeletar = li.querySelector(".delete-btn");
    btnDeletar.addEventListener("click", () => {
      this.deletarRefeicao(refeicao.id);
    });

    return li;
  }

  mostrarModalAvaliacao(avaliacao, refeicao) {
    const modalAnterior = document.getElementById("modal-ver-avaliacao");
    if (modalAnterior) modalAnterior.remove();

    const modal = document.createElement("div");
    modal.id = "modal-ver-avaliacao";
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
            animation: fadeIn 0.3s ease;
        `;

    const emojiMap = {
      bom: "👍",
      neutro: "😐",
      ruim: "👎",
    };

    const textoMap = {
      bom: "Bom",
      neutro: "Neutro",
      ruim: "Precisa melhorar",
    };

    const corMap = {
      bom: { bg: "#d4edda", border: "#28a745", text: "#155724" },
      neutro: { bg: "#fff3cd", border: "#ffc107", text: "#856404" },
      ruim: { bg: "#f8d7da", border: "#dc3545", text: "#721c24" },
    };

    const cores = corMap[avaliacao.avaliacao];

    modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                max-width: 500px;
                width: 90%;
                padding: 0;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                animation: slideUp 0.3s ease;
            ">
                <!-- Cabeçalho -->
                <div style="
                    background: linear-gradient(135deg, #384420 0%, #44571fff 100%);
                    padding: 25px;
                    color: white;
                    position: relative;
                ">
                    <button id="fechar-modal-avaliacao" style="
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        color: white;
                        font-size: 24px;
                        width: 35px;
                        height: 35px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s;
                    ">&times;</button>
                    <h2 style="margin: 0; font-size: 1.5em;">Avaliação do Nutricionista</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 0.9em;">${
                      refeicao.nome
                    }</p>
                </div>

                <!-- Corpo -->
                <div style="padding: 30px;">
                    <!-- Emoji e Avaliação -->
                    <div style="
                        text-align: center;
                        padding: 25px;
                        background: ${cores.bg};
                        border: 3px solid ${cores.border};
                        border-radius: 15px;
                        margin-bottom: 20px;
                    ">
                        <div style="font-size: 4em; margin-bottom: 10px;">
                            ${emojiMap[avaliacao.avaliacao]}
                        </div>
                        <h3 style="
                            margin: 0;
                            color: ${cores.text};
                            font-size: 1.5em;
                            font-weight: bold;
                        ">${textoMap[avaliacao.avaliacao]}</h3>
                    </div>

                    ${
                      avaliacao.observacao
                        ? `
                        <!-- Observação -->
                        <div style="
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 10px;
                            border-left: 4px solid #384420;
                            margin-bottom: 20px;
                        ">
                            <strong style="color: #333; display: block; margin-bottom: 8px;">
                                💬 Observação:
                            </strong>
                            <p style="
                                margin: 0;
                                color: #555;
                                line-height: 1.6;
                                font-style: italic;
                            ">"${avaliacao.observacao}"</p>
                        </div>
                    `
                        : ""
                    }

                    <!-- Info do Nutricionista -->
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 10px;
                    ">
                        <i class="fa-solid fa-user-doctor" style="
                            font-size: 1.5em;
                            color: #384420;
                        "></i>
                        <div>
                            <strong style="display: block; color: #333; font-size: 0.9em;">
                                ${
                                  avaliacao.nutricionista_nome ||
                                  "Nutricionista"
                                }
                            </strong>
                            <small style="color: #888;">
                                ${new Date(
                                  avaliacao.data_avaliacao
                                ).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Eventos
    const btnFechar = document.getElementById("fechar-modal-avaliacao");
    btnFechar.addEventListener("click", () => modal.remove());

    btnFechar.addEventListener("mouseenter", () => {
      btnFechar.style.background = "rgba(255, 255, 255, 0.3)";
      btnFechar.style.transform = "rotate(90deg)";
    });

    btnFechar.addEventListener("mouseleave", () => {
      btnFechar.style.background = "rgba(255, 255, 255, 0.2)";
      btnFechar.style.transform = "rotate(0deg)";
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  deletarRefeicao(refeicaoId) {
    if (!confirm("Deseja realmente excluir esta refeição?")) return;

    try {
      const refeicoes = JSON.parse(localStorage.getItem("refeicoes")) || [];
      const indice = refeicoes.findIndex((r) => r.id === refeicaoId);

      if (indice >= 0) {
        refeicoes.splice(indice, 1);
        localStorage.setItem("refeicoes", JSON.stringify(refeicoes));

        this.mostrarNotificacao("Refeição excluída com sucesso!", "sucesso");

        this.carregarTodasRefeicoes();
        this.carregarRefeicoesDoDay(this.dataAtual);
        this.renderizarRefeicoes();
      }
    } catch (erro) {
      console.error("Erro ao deletar refeição:", erro);
      this.mostrarNotificacao("Erro ao excluir refeição", "erro");
    }
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
              tipo === "sucesso"
                ? "#4caf50"
                : tipo === "erro"
                ? "#f44336"
                : "#2196f3"
            };
            color: white;
            border-radius: 5px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s;
        `;

    document.body.appendChild(notificacao);
    setTimeout(() => notificacao.remove(), 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🎬 Iniciando HistoricoRefeicoesManager...");
  window.historicoRefeicoesManager = new HistoricoRefeicoesManager();
});
