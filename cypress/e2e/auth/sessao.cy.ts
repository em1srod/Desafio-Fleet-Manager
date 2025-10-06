// cypress/e2e/auth/sessao.cy.ts

// CT-012 — Guarda de rota: sem sessão não acessa /dashboard
describe('CT-012 | Sessão - rota protegida sem sessão', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then(w => w.sessionStorage.clear());
  });

  // @rf-lgn-202 @bug BUG-CT-012
  //https://github.com/em1srod/Desafio-Fleet-Manager/issues/3
  it('CT-012: ao acessar /dashboard sem sessão, deve redirecionar para /login', () => {
    // Acessa diretamente a rota protegida SEM autenticar
    cy.visit('/dashboard', { failOnStatusCode: false });

    // Oráculo único do requisito: terminar em /login
    cy.location('pathname', { timeout: 6000 }).should('eq', '/login');

    // (opcional) se quiser só logar no console caso apareça a tela intermediária
    cy.get('body').then($b => {
      if ($b.text().match(/Redirecionando/i)) {
        cy.log('Tela transitória "Redirecionando..." exibida antes do /login');
      }
    });
  });
});
