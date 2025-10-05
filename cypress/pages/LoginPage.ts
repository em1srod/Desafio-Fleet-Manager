/// <reference types="cypress" />

export class LoginPage {
  open() {
    cy.visit('/login');
  }

private pick(selectors: string[]) {
  const joined = selectors.join(', ');
  // primeiro tenta elementos visíveis
  return cy.get(joined, { timeout: 10000 }).then(($els) => {
    const $visible = $els.filter(':visible').first();
    if ($visible.length) {
      return cy.wrap($visible);
    }

    // se não houver elementos visíveis, faz scroll e tenta revelar o primeiro elemento
    const $first = $els.first();
    return cy.wrap($first)
      .scrollIntoView({ easing: 'linear' })
      .then(($el) => cy.wrap($el).invoke('show').then(() => cy.wrap($el)));
  });
}

  email() {
    return this.pick([
     '.inner-container input[type="email"]',
      '.inner-container input[name="email"]',
      '.inner-container input[placeholder*="mail" i]',
      '#email',
      '[data-testid="email"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder="E-mail" i]',
      'input[aria-label*="mail" i]'
    ]);
  }

  senha() {
    return this.pick([
      '#password',
      '#senha',
      '[data-testid="senha"]',
      'input[name="senha"]',
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="senha" i]',
      'input[placeholder*="pass" i]'
    ]);
  }

  entrar() {
    const byClick = () => this.pick([
      '[data-testid="entrar"]',
      'button#entrar[name="entrar"]',
      'button[type="submit"]'
    ]).then(($btn) => cy.wrap($btn).click());

    return cy.window().then(() => {
      return byClick().then(
        undefined as never,
        () => cy.contains('button, [role="button"]', /entrar|login|acessar|sign in/i).click()
      );
    });
  }

  alertaErro() {
    // lista todos os seletores possíveis, mas
    // prioriza o filho que exibe a mensagem
    const sel = [
      '[data-description]',         // filho que contém o texto do erro
      '[data-title]',               // fallback alternativo
      '[data-testid="alerta-erro"]',
      '[role="alert"]',
      '.alert-error',
      '.error-message'
    ].join(', ');

    return cy
      .get(sel, { timeout: 10000 })
      .filter(':visible')
      .first();
  }
  cardLogin() {
    return this.pick([
      '[data-testid="card-login"]',
      '[class*="login" i]',
      'form[action*="login" i]',
      'form:has(input[type="password"])'
    ]);
  }
  alertaTitulo() {
    return cy.contains('Erro no login').should('be.visible');
  }
  alertaDescricao() {
    return cy.contains('Erro no login').should('be.visible');
  }
  emailValidationMessage() {
  return cy.get('li.v-messages__message');
  }

  
}
