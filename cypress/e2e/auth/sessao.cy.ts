// cypress/e2e/auth/sessao.cy.ts
import { DashboardPage } from '../../pages/DashboardPage';
const dash = new DashboardPage();

describe('CT-012 | Logout encerra sessão e redireciona', () => {
  beforeEach(() => {
    cy.visit('/login'); // garante que está na tela de login
    cy.login('admin@teste.com', '123456');
    cy.assertOnDashboard(); // novo helper
  });

  it('Deve encerrar sessão e redirecionar para /login', () => {
    // aciona o logout
    dash.sair().should('be.visible').click();

    // "Redirecionando..." se existir
    cy.get('body').then(($b) => {
      if ($b.text().match(/Redirecionando/i)) {
        cy.contains(/Redirecionando/i, { timeout: 4000 }).should('be.visible');
      }
    });

    // valida logout
    cy.assertLoggedOut();
  });
});
