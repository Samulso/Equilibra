document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('reset-password-form');
    const emailInput = document.getElementById('email');

    resetForm.addEventListener('submit', (event) => {
        event.preventDefault(); 

        const email = emailInput.value.trim();

        if (email === "") {
            alert("Por favor, insira seu email.");
            return;
        }

        
        alert(`Um email com as instruções para redefinir sua senha foi enviado para ${email}.`);
        window.location.href = 'login.html';
    });
});