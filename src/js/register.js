document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    function validateEmail(email) {
        
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        return emailRegex.test(email);
    }

    function validatePassword(password) {
        
        return password.length >= 8;
    }

    registerForm.addEventListener('submit', (event) => {
        event.preventDefault(); 

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (name === "") {
            alert("Por favor, insira seu nome completo.");
            return;
        }

        if (email === "") {
            alert("Por favor, insira seu email.");
            return;
        }

        if (!validateEmail(email)) {
            alert("Por favor, insira um email válido.");
            return;
        }

        if (password === "") {
            alert("Por favor, insira sua senha.");
            return;
        }

        if (!validatePassword(password)) {
            alert("A senha deve ter pelo menos 8 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            alert("As senhas não coincidem.");
            return;
        }

       
        const userData = {
            name: name,
            email: email,
            password: password
        };

        localStorage.setItem('userData', JSON.stringify(userData));
        alert("Cadastro realizado com sucesso! Redirecionando para a próxima página.");
        window.location.href = 'login.html'; 
    });
});