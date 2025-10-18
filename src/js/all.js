document.addEventListener("DOMContentLoaded", () => {
  const loadComponent = (selector, file) => {
    const target = document.querySelector(selector);
    if (!target) return;

    const type = target.id;

    fetch(file)
      .then(response => {
        if (!response.ok) throw new Error(`Erro ao carregar ${selector}`);
        return response.text();
      })
      .then(data => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = data;

        const selected = tempDiv.querySelector(`#${type}`);
        if (selected) {
          target.innerHTML = selected.innerHTML;
        }
      })
      .catch(error => console.error(error));
  };


  loadComponent("header[id^='header-']", "../components/header.html");
  
});

console.log("oi")