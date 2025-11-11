class AuthManager {
  constructor() {
    this.usuarioAtual = null;
    this.inicializar();
  }

  /**
   * Inicializa o gerenciador de autenticação
   */
  inicializar() {
    this.carregarSessao();
    this.configurarBotaoLogout();
  }

  /**
   * Configura o botão de logout do HTML
   */
  configurarBotaoLogout() {
    document.addEventListener('DOMContentLoaded', () => {
      let logoutBtn = document.getElementById('logoutBtn');
      if(!logoutBtn) return;

      document.body.appendChild(logoutBtn);

      logoutBtn.style.position = 'fixed';
      logoutBtn.style.top = '20px';
      logoutBtn.style.right = '20px';
      logoutBtn.style.zIndex = '21';
      logoutBtn.style.pointerEvents = 'auto';

      logoutBtn.addEventListener('click', () => this.logout());
    });
  }

  /**
   * Carrega a sessão do usuário logado
   */
  carregarSessao() {
    try {
      const sessao = localStorage.getItem('sessao_atual');
      if (sessao) {
        const dadosSessao = JSON.parse(sessao);
        // Verifica se a sessão não expirou (24 horas)
        const agora = new Date().getTime();
        const expiracao = new Date(dadosSessao.expiracao).getTime();
        
        if (agora < expiracao) {
          this.usuarioAtual = dadosSessao.usuario;
          return true;
        } else {
          this.logout();
        }
      }
      return false;
    } catch (erro) {
      console.error('Erro ao carregar sessão:', erro);
      return false;
    }
  }

  /**
   * Registra um novo usuário
   */
  registrar(nome, email, senha, tipo = 'paciente') {
    try {
      if (!nome || !email || !senha) {
        throw new Error('Todos os campos são obrigatórios');
      }

      if (senha.length < 8) {
        throw new Error('A senha deve ter pelo menos 8 caracteres');
      }

      if (!this.validarEmail(email)) {
        throw new Error('Email inválido');
      }

      const usuarios = this.obterTodosUsuarios();

      if (usuarios.find(u => u.email === email)) {
        throw new Error('Este email já está cadastrado');
      }

      const novoUsuario = {
        id: this.gerarId(),
        nome: nome,
        email: email,
        senha: senha,
        tipo: tipo,
        dataCadastro: new Date().toISOString(),
        ativo: true
      };

      usuarios.push(novoUsuario);
      localStorage.setItem('usuarios', JSON.stringify(usuarios));

      return {
        sucesso: true,
        usuario: novoUsuario,
        mensagem: 'Cadastro realizado com sucesso!'
      };

    } catch (erro) {
      return {
        sucesso: false,
        mensagem: erro.message
      };
    }
  }

  /**
   * Faz login do usuário
   */
  login(email, senha) {
    try {
      if (!email || !senha) {
        throw new Error('Email e senha são obrigatórios');
      }

      const usuarios = this.obterTodosUsuarios();
      const usuario = usuarios.find(u => u.email === email && u.senha === senha);

      if (!usuario) {
        throw new Error('Email ou senha incorretos');
      }

      if (!usuario.ativo) {
        throw new Error('Usuário inativo. Entre em contato com o suporte');
      }

      const sessao = {
        usuario: usuario,
        dataLogin: new Date().toISOString(),
        expiracao: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      localStorage.setItem('sessao_atual', JSON.stringify(sessao));
      this.usuarioAtual = usuario;

      return {
        sucesso: true,
        usuario: usuario,
        mensagem: 'Login realizado com sucesso!'
      };

    } catch (erro) {
      return {
        sucesso: false,
        mensagem: erro.message
      };
    }
  }

  /**
   * Faz logout do usuário
   */
  logout() {
    localStorage.removeItem('sessao_atual');
    this.usuarioAtual = null;
    window.location.href = './login.html';
  }

  /**
   * Verifica se há um usuário logado
   */
  estaLogado() {
    return this.usuarioAtual !== null;
  }

  obterUsuarioAtual() {
    return this.usuarioAtual;
  }

  eNutricionista() {
    return this.usuarioAtual && this.usuarioAtual.tipo === 'nutricionista';
  }

  ePaciente() {
    return this.usuarioAtual && this.usuarioAtual.tipo === 'paciente';
  }

  obterTodosUsuarios() {
    try {
      const usuarios = localStorage.getItem('usuarios');
      return usuarios ? JSON.parse(usuarios) : [];
    } catch (erro) {
      console.error('Erro ao obter usuários:', erro);
      return [];
    }
  }

  obterUsuarioPorId(id) {
    const usuarios = this.obterTodosUsuarios();
    return usuarios.find(u => u.id === id);
  }

  atualizarUsuario(id, novosDados) {
    try {
      const usuarios = this.obterTodosUsuarios();
      const indice = usuarios.findIndex(u => u.id === id);

      if (indice === -1) {
        throw new Error('Usuário não encontrado');
      }

      const camposPermitidos = ['nome', 'email'];
      camposPermitidos.forEach(campo => {
        if (novosDados[campo] !== undefined) {
          usuarios[indice][campo] = novosDados[campo];
        }
      });

      localStorage.setItem('usuarios', JSON.stringify(usuarios));

      if (this.usuarioAtual && this.usuarioAtual.id === id) {
        this.usuarioAtual = usuarios[indice];
        const sessao = JSON.parse(localStorage.getItem('sessao_atual'));
        sessao.usuario = usuarios[indice];
        localStorage.setItem('sessao_atual', JSON.stringify(sessao));
      }

      return {
        sucesso: true,
        mensagem: 'Usuário atualizado com sucesso'
      };

    } catch (erro) {
      return {
        sucesso: false,
        mensagem: erro.message
      };
    }
  }

  alterarSenha(senhaAtual, novaSenha) {
    try {
      if (!this.usuarioAtual) {
        throw new Error('Usuário não está logado');
      }

      if (this.usuarioAtual.senha !== senhaAtual) {
        throw new Error('Senha atual incorreta');
      }

      if (novaSenha.length < 8) {
        throw new Error('A nova senha deve ter pelo menos 8 caracteres');
      }

      const usuarios = this.obterTodosUsuarios();
      const indice = usuarios.findIndex(u => u.id === this.usuarioAtual.id);

      if (indice === -1) {
        throw new Error('Usuário não encontrado');
      }

      usuarios[indice].senha = novaSenha;
      localStorage.setItem('usuarios', JSON.stringify(usuarios));

      return {
        sucesso: true,
        mensagem: 'Senha alterada com sucesso'
      };

    } catch (erro) {
      return {
        sucesso: false,
        mensagem: erro.message
      };
    }
  }

  validarEmail(email) {
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return regex.test(email);
  }

  gerarId() {
    return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protegerPagina(tipoRequerido = null) {
    if (!this.estaLogado()) {
      window.location.href = 'login.html';
      return false;
    }

    if (tipoRequerido && this.usuarioAtual.tipo !== tipoRequerido) {
      alert('Você não tem permissão para acessar esta página');
      this.logout();
      return false;
    }

    return true;
  }

  redirecionarParaDashboard() {
    if (!this.estaLogado()) {
      window.location.href = 'login.html';
      return;
    }

    if (this.eNutricionista()) {
      window.location.href = 'dashBoardNutri.html';
    } else {
      window.location.href = 'dashBoardNutri.html';
    }
  }
}

// Cria uma instância global
window.authManager = new AuthManager();
