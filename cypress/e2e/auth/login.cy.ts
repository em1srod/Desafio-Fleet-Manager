import { LoginPage } from '../../pages/LoginPage';
import { HeaderPage } from '../../pages/HeaderPage';


const login = new LoginPage();
const header = new HeaderPage();

const CFG = {
  successUrlIncludes: '/dashboard',                       // mude p/ '/home' se for o caso
  apiLoginPath: '/api/auth/login',                        // ajuste p/ rota real (ex.: '/auth/login')
  msgEmailInvalido: /credenciais inválidas/i,             // aceita “Email inválido”, “E-mail inválido” etc.
  msgCredenciaisInvalidas: /Erro no login/i,      // aceita “inválidas” ou “incorretas”
  msgApiFalha: /não foi possível entrar|tente novamente/i,
};

const CRED = {
  ok: { email: 'admin@teste.com', senha: '123456' },
  wrongPass: { email: 'admin@teste.com', senha: '1234567' },
  notFound: { email: 'naoexiste@teste.com', senha: '123456' },
  badEmail: { email: 'admin@n', senha: '123456' },
};

describe('Login - Fluxo de Autenticação', () => {
  beforeEach(() => {
    login.open();
    // tolerante: só verifica que há um form de login visível
    login.cardLogin().should('be.visible');
  });

  it('LGN-001: Sucesso com e-mail e senha válidos', () => {
    cy.login(CRED.ok.email, CRED.ok.senha);
    cy.url().should('include', CFG.successUrlIncludes);
  });

  it('LGN-002: Tecla Enter no campo senha executa login', () => {
    login.email().type(CRED.ok.email);
    login.senha().type(`${CRED.ok.senha}{enter}`);
    cy.url().should('include', CFG.successUrlIncludes);
  });

it('LGN-101: E-mail malformado bloqueia envio e exibe mensagem', () => {
  const login = new LoginPage();
  login.open();

  login.email().type(CRED.badEmail.email);
  login.senha().type(CRED.badEmail.senha);
  login.entrar();

  login.alertaTitulo();
  login.alertaDescricao();

  cy.url().should('include', '/login');
});

});

it('LGN-102: Senha incorreta exibe mensagem genérica e permanece na página', () => {
  const login = new LoginPage();

  login.open();
  login.email().type(CRED.wrongPass.email);
  login.senha().type(CRED.wrongPass.senha);
  login.entrar();

  // Verifica título e descrição separadamente
  login.alertaTitulo();
  login.alertaDescricao();

  cy.url().should('include', '/login');
});

it('LGN-103: Usuário inexistente exibe mensagem genérica e permanece em /login', () => {
  const login = new LoginPage();
  login.open();

  // preenche credenciais de usuário não cadastrado
  login.email().type(CRED.notFound.email);
  login.senha().type(CRED.notFound.senha);

  // aciona o login
  login.entrar();

  // valida o pop-up: título e descrição
  login.alertaTitulo()
    .should('be.visible')
    .and('have.text', 'Erro no login');


  login.alertaErro()
  .should('be.visible')
  .invoke('text')
  .should('match', CFG.msgCredenciaisInvalidas);

  // garante que continuou em /login
  cy.url().should('include', '/login');
});

it('LGN-104: Campos vazios exibem mensagens de obrigatório', () => {
  const login = new LoginPage();
  login.open();

  // tenta enviar sem preencher
  login.entrar();

  // aguarda um pequeno tempo para o navegador aplicar a validação
  cy.wait(100);

  // verifica a mensagem nativa do navegador no campo de e-mail
  login.email().then(($el) => {
    const msg = ($el[0] as HTMLInputElement).validationMessage;
    expect(msg).to.match(/Preencha este campo/i);
  });

  // verifica a mensagem nativa do navegador no campo de senha
  login.senha().then(($el) => {
    const msg = ($el[0] as HTMLInputElement).validationMessage;
    expect(msg).to.match(/Preencha este campo/i);
  });

  cy.url().should('include', '/login');
});
describe('Login - Rota protegida sem sessão', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => win.sessionStorage.clear());
  });

  // @rf-lgn-203 @bug BUG-LOG-203
  // Este cenário é coberto por CT-012 (sessao.cy.ts) para evitar duplicidade.
  // https://github.com/em1srod/Desafio-Fleet-Manager/issues/1
  it.skip('LGN-202: ao acessar /dashboard sem sessão, deve redirecionar para /login', () => {
    cy.visit('/dashboard', { failOnStatusCode: false });

    // Oráculo único: terminar em /login (com timeout para o redirecionamento acontecer)
    cy.location('pathname', { timeout: 6000 }).should('eq', '/login');
  });

// @rf-lgn-203 @bug BUG-LOG-203
// https://github.com/em1srod/Desafio-Fleet-Manager/issues/2
it('LGN-203: ao sair, deve redirecionar para /login e limpar storage', () => {
  // 1) loga
  login.fazerLogin('admin@teste.com', '123456'); // garante que chegou ao /dashboard

  // 2) clica em Sair (botão visível no topo direito)
  header.sair();

  // 3) oráculo único: terminar em /login
  cy.location('pathname', { timeout: 6000 }).should('eq', '/login');

  // 4) (opcional) storage limpo
  cy.window().then((w) => {
    expect(w.localStorage.length, 'localStorage vazio').to.eq(0);
    expect(w.sessionStorage.length, 'sessionStorage vazio').to.eq(0);
  });
});
});
