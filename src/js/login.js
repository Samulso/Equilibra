/**
 * Sistema de Login - Corrigido
 * Suporta múltiplos usuários e redireciona para dashboard apropriada
 */

document.addEventListener('DOMContentLoaded', () => {
  // Verifica se já está logado
  if (window.authManager && window.authManager.estaLogado()) {
    window.authManager.redirecionarParaDashboard();
    return;
  }

  const loginForm = document.querySelector('form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  if (!loginForm) {
    console.error('Formulário de login não encontrado');
    return;
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const senha = passwordInput.value.trim();

    // Validações básicas
    if (email === "") {
      alert("Por favor, insira seu email.");
      emailInput.focus();
      return;
    }

    if (senha === "") {
      alert("Por favor, insira sua senha.");
      passwordInput.focus();
      return;
    }

    // Verifica se o AuthManager está disponível
    if (!window.authManager) {
      alert("Sistema de autenticação não inicializado. Recarregue a página.");
      return;
    }

    // Tenta fazer login
    const resultado = window.authManager.login(email, senha);

    if (resultado.sucesso) {
      const usuario = resultado.usuario;
      
      // Mensagem personalizada
      const tipoUsuario = usuario.tipo === 'nutricionista' ? 'Nutricionista' : 'Paciente';
      alert(`Bem-vindo(a), ${usuario.nome}! (${tipoUsuario})`);

      // Redireciona após 500ms para dar tempo de mostrar o alerta
      setTimeout(() => {
        window.authManager.redirecionarParaDashboard();
      }, 500);
    } else {
      alert(resultado.mensagem);
      passwordInput.value = '';
      passwordInput.focus();
    }
  });

  // Link para registro (se existir)
  const linkRegistro = document.getElementById('link-registro');
  if (linkRegistro) {
    linkRegistro.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = './register.html';
    });
  }

  
  // Foco automático no email
  if (emailInput) {
    emailInput.focus();
  }
});