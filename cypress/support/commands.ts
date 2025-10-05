/// <reference types="cypress" />

// Augmentação de tipos: UMA definição só.
declare global {
  namespace Cypress {
    interface Chainable {
      /** Login via UI — mantém o comportamento original */
      login(email: string, senha: string): Chainable<void>;

      /** Helper: assert de que estamos no dashboard (para CT-012) */
      assertOnDashboard(): Chainable<void>;

      /** Helper: assert de que o logout ocorreu (para CT-012) */
      assertLoggedOut(): Chainable<void>;
    }
  }
}

// =====================
// Comandos
// =====================

// ✅ Mantém seu login original (sem cy.session e sem visit)
Cypress.Commands.add('login', (email: string, senha: string) => {
  cy.get('#email').clear().type(email);
  cy.get('#password').clear().type(senha, { log: false });
  cy.contains('button', /entrar|login|acessar/i).click();
});

// ✅ Helper usado só no CT-012 (não interfere nos demais)
Cypress.Commands.add('assertOnDashboard', () => {
  cy.location('pathname', { timeout: 10000 }).should('include', '/dashboard');
});

// ✅ Helper usado só no CT-012 (sem depender de rota '/Redirecionando...')
Cypress.Commands.add('assertLoggedOut', () => {
  // 1) Estado intermediário: a página mostra "Redirecionando..."
  cy.get('body').then(($b) => {
    if ($b.text().match(/Redirecionando/i)) {
      cy.contains(/Redirecionando/i, { timeout: 5000 }).should('be.visible');
    }
  });
  // 2) Sem sessão: nenhum cookie de auth deve restar
  cy.getCookies().then((cookies) => {
    const authLike = cookies.filter((c) => /auth|token|session/i.test(c.name));
    expect(authLike.length, 'cookies de sessão removidos').to.eq(0);
  });
});


export {}; // UMA só exportação para marcar como módulo
