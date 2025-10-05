/// <reference types="cypress" />

export class LoginPage {
  open() {
    cy.visit('/login');
  }

  private pick(selectors: string[]) {
    const joined = selectors.join(', ');
    return cy.get(joined, { timeout: 10000 }).then(($els) => {
      const $visible = $els.filter(':visible').first();
      if ($visible.length) {
        return cy.wrap($visible);
      }

      const $first = $els.first();
      return cy.wrap($first)
        .scrollIntoView({ easing: 'linear' })
        .then(($el) => cy.wrap($el).invoke('show').then(() => cy.wrap($el)));
    });
  }

  private safePick(selectors: string[]) {
    const joined = selectors.join(', ');
    return cy.get('body', { timeout: 10000 }).then(($body) => {
      if ($body.find(joined).length > 0) {
        return cy.get(joined, { timeout: 10000 });
      } else {
        return cy.wrap(null);
      }
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
  const candidates = [
    '[data-testid="entrar"]',
    'button#entrar[name="entrar"]',
    'button[type="submit"]'
  ].join(', ');

  // Decide antes do clique: se há botões candidatos, clica neles; senão usa fallback por texto.
  return cy.get('body').then(($body) => {
    const hasCandidates = $body.find(candidates).length > 0;

    if (hasCandidates) {
      return cy.get(candidates).filter(':visible').first().click();
    }

    // Fallback seguro (não roda se já tiver botão candidato)
    return cy.contains('button, [role="button"]', /entrar|login|acessar|sign in/i)
      .filter(':visible')
      .first()
      .click();
  });
}

    // Helper para autenticar de ponta a ponta usando os métodos já existentes
  fazerLogin(email: string, senha: string) {
    this.open();
    this.email().type(email);
    this.senha().type(senha);
    this.entrar();
    // sanity: garante que entrou
    cy.location('pathname').should('eq', '/dashboard');
  }

  alertaErro() {
    const sel = [
      '[data-description]',
      '[data-title]',
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

  cardLoginIfExists() {
  const selectors = [
    '[data-testid="card-login"]',
    '[class*="login" i]',
    'form[action*="login" i]',
    'form:has(input[type="password"])'
  ];
  const joined = selectors.join(', ');

  return cy.document({ timeout: 10000 }).then((doc) => {
    const bodyText = doc.body.innerText;

    // Se o texto "Redirecionando..." estiver presente, retorna null
    if (bodyText.includes('Redirecionando')) {
      return cy.wrap(null);
    }

    // Se algum dos elementos existir, retorna o cy.get normalmente
    const found = doc.querySelector(joined);
    if (found) {
      return cy.get(joined, { timeout: 10000 });
    }

    return cy.wrap(null);
  });
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