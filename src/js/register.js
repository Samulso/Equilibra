/**
 * Sistema de Registro - Corrigido
 * Permite cadastro de múltiplos usuários (pacientes e nutricionistas)
 */

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  // Campo de tipo de usuário (se existir no HTML)
  let tipoUsuarioSelect = document.getElementById('tipo-usuario');
  
  // Se não existe o campo de tipo, cria um
  if (!tipoUsuarioSelect && registerForm) {
    const div = document.createElement('div');
    div.style.marginBottom = '15px';
    div.innerHTML = `
      <label for="tipo-usuario" style="display: block; margin-bottom: 5px; font-weight: bold;">
        Tipo de Usuário:
      </label>
      <select id="tipo-usuario" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        <option value="paciente">Paciente</option>
        <option value="nutricionista">Nutricionista</option>
      </select>
    `;
    
    // Insere antes do botão de submit
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      registerForm.insertBefore(div, submitBtn);
    } else {
      registerForm.appendChild(div);
    }
    
    tipoUsuarioSelect = document.getElementById('tipo-usuario');
  }

  if (!registerForm) {
    console.error('Formulário de registro não encontrado');
    return;
  }

  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const nome = nameInput.value.trim();
    const email = emailInput.value.trim();
    const senha = passwordInput.value.trim();
    const confirmarSenha = confirmPasswordInput.value.trim();
    const tipoUsuario = tipoUsuarioSelect ? tipoUsuarioSelect.value : 'paciente';

    // Validações
    if (nome === "") {
      alert("Por favor, insira seu nome completo.");
      nameInput.focus();
      return;
    }

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

    if (senha.length < 8) {
      alert("A senha deve ter pelo menos 8 caracteres.");
      passwordInput.focus();
      return;
    }

    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem.");
      confirmPasswordInput.focus();
      return;
    }

    // Tenta registrar usando o AuthManager
    if (!window.authManager) {
      alert("Sistema de autenticação não inicializado. Recarregue a página.");
      return;
    }

    const resultado = window.authManager.registrar(nome, email, senha, tipoUsuario);

    if (resultado.sucesso) {
      alert(resultado.mensagem + " Redirecionando para o login...");
      
      // Limpa o formulário
      registerForm.reset();
      
      // Redireciona para login após 1 segundo
      setTimeout(() => {
        window.location.href = './login.html';
      }, 1000);
    } else {
      alert(resultado.mensagem);
    }
  });

  // Validação em tempo real do email
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const email = emailInput.value.trim();
      if (email && !window.authManager.validarEmail(email)) {
        emailInput.style.borderColor = 'red';
        alert('Por favor, insira um email válido.');
      } else {
        emailInput.style.borderColor = '';
      }
    });
  }

  // Indicador de força da senha
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const senha = passwordInput.value;
      let forcaDiv = document.getElementById('forca-senha');
      
      if (!forcaDiv) {
        forcaDiv = document.createElement('div');
        forcaDiv.id = 'forca-senha';
        forcaDiv.style.marginTop = '5px';
        forcaDiv.style.fontSize = '12px';
        passwordInput.parentElement.appendChild(forcaDiv);
      }

      if (senha.length === 0) {
        forcaDiv.textContent = '';
        forcaDiv.style.color = '';
      } else if (senha.length < 8) {
        forcaDiv.textContent = 'Senha muito fraca (mínimo 8 caracteres)';
        forcaDiv.style.color = '#f44336';
      } else if (senha.length < 12) {
        forcaDiv.textContent = 'Força da senha: Média';
        forcaDiv.style.color = '#ff9800';
      } else {
        forcaDiv.textContent = 'Força da senha: Forte';
        forcaDiv.style.color = '#4caf50';
      }
    });
  }

  // Confirmação de senha em tempo real
  if (confirmPasswordInput && passwordInput) {
    confirmPasswordInput.addEventListener('input', () => {
      if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
        confirmPasswordInput.style.borderColor = 'red';
      } else {
        confirmPasswordInput.style.borderColor = '';
      }
    });
  }
});