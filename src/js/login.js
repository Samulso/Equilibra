document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); 
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (email === "") {
            alert("Por favor, insira seu email.");
            return;
        }

        if (password === "") {
            alert("Por favor, insira sua senha.");
            return;
        }

        
        const storedData = localStorage.getItem('userData');

        if (storedData) {
            try {
                const userData = JSON.parse(storedData);
                if (userData.email === email && userData.password === password) {
                    alert("Login realizado com sucesso!");
                    
                    window.location.href = 'dashboard.html'; 
                } else {
                    alert("Email ou senha incorretos.");
                }
            } catch (error) {
                console.error("Erro ao analisar os dados do usuário:", error);
                alert("Ocorreu um erro ao processar os dados do usuário. Por favor, tente novamente.");
            }
        } else {
            alert("Usuário não encontrado. Por favor, cadastre-se.");
        }
    });
});