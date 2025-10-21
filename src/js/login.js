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

  // Opção de "Esqueci minha senha" (simulado)
  const linkEsqueciSenha = document.getElementById('link-esqueci-senha');
  if (linkEsqueciSenha) {
    linkEsqueciSenha.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Funcionalidade "Esqueci minha senha" será implementada em breve.\nPor favor, entre em contato com o suporte.');
    });
  }

  // Adiciona botão de "Criar conta" se não existir
  if (!document.getElementById('btn-criar-conta')) {
    const btnCriarConta = document.createElement('div');
    btnCriarConta.style.marginTop = '20px';
    btnCriarConta.style.textAlign = 'center';
    btnCriarConta.innerHTML = `
      <p style="color: #666; margin-bottom: 10px;">Não tem uma conta?</p>
      <a href="./register.html" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #334d36;
        color: white;
        font-size:1rem;
        text-decoration: none;
        border-radius: 17px;
        font-weight: bold;
        transition: background-color 0.3s;
      " onmouseover="this.style.backgroundColor='#3f6042'" 
         onmouseout="this.style.backgroundColor='#3f6042'">
        Criar uma conta
      </a>
    `;
    loginForm.parentElement.appendChild(btnCriarConta);
  }

  // Foco automático no email
  if (emailInput) {
    emailInput.focus();
  }
});