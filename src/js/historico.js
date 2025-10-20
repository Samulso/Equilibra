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