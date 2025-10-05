// Tipagem global para o comando login()
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, senha: string): Chainable<void>;
    }
  }
}

// cypress/support/commands.ts
Cypress.Commands.add('login', (email: string, senha: string) => {
  cy.get('#email')
    .clear()
    .type(email);

  cy.get('#password')
    .clear()
    .type(senha);

  cy.get('button[type="submit"], button[role="button"]')
    .contains(/entrar|login|acessar/i)
    .click();
});


export {};
