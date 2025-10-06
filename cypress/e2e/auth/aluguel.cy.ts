// cypress/e2e/dashboard/aluguel.cy.ts
import { DashboardPage } from '../../pages/DashboardPage';

const dash = new DashboardPage();

const parseMoney = (s: string) =>
  Number(String(s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));

const readIntFromCard = (el: JQuery<HTMLElement>) => {
  const onlyDigits = el.text().replace(/[^\d]/g, '');
  return onlyDigits ? parseInt(onlyDigits, 10) : NaN;
};

// ---------- helpers de fluxo ----------
const clickPrimeiroAlugar = () =>
  // procura um botão "Alugar" visível
  cy.contains('button, [role=button], a', /^alugar$/i).filter(':visible').first().click({ force: true });

// espera modal "Alugar Veículo" e confirma
const confirmarAlugarNoModal = () =>
  cy.get('[role=dialog], .modal, .v-overlay', { timeout: 8000 })
    .filter(':visible')
    .first()
    .within(() => {
      cy.contains('button, [role=button]', /confirmar aluguel/i, { timeout: 5000 })
        .should('be.visible')
        .click();
    });

// modal Pagamento
const modalPagamento = () =>
  cy.contains(/^pagamento$/i, { timeout: 8000 })
    .parents('[role=dialog], .modal, .v-overlay')
    .first();

// confirma pagamento (cartão/pix – qualquer um)
const confirmarPagamento = () =>
  modalPagamento().within(() => {
    cy.contains(/cartão de crédito|pix/i).first().click({ force: true });
    cy.contains(/confirmar pagamento/i).click({ force: true });
  });

// pega um card pelo status (“Disponível”, “Alugado”, “Manutenção”)
const getCardByStatus = (statusRe: RegExp) =>
  cy.get('.md\\:grid-cols-2 > * , .md\\:grid-cols-3 > * , [data-cy=lista-veiculos] > *')
    .filter(':visible')
    .filter((_i, el) => statusRe.test((el as HTMLElement).innerText));

// dentro do card, retorna o botão Alugar (se existir)
const getAlugarBtnInside = ($card: JQuery<HTMLElement>) =>
  cy.wrap($card).within(() =>
    cy.contains('button, [role=button], a', /^alugar$/i).filter(':visible').first()
  );

describe('Dashboard - Aluguel e Regras de Status', () => {
  beforeEach(() => {
    // sincroniza com carga inicial
    cy.intercept('GET', '**/api/vehicles*').as('vehicles');

    // login + dashboard
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then(w => w.sessionStorage.clear());
    cy.visit('/login');
    cy.login('admin@teste.com', '123456');
    cy.location('pathname', { timeout: 10000 }).should('include', '/dashboard');

    // espera a grade inicial
    cy.wait('@vehicles');
    // há cards
    cy.get('.md\\:grid-cols-2 > * , .md\\:grid-cols-3 > * , [data-cy=lista-veiculos] > *')
      .filter(':visible')
      .should('have.length.greaterThan', 0);
  });

  // CT-005: Alugar veículo Disponível altera KPI "Veículos Alugados" (1 -> 2)
it('CT-005: Alugar veículo Disponível deve levar o KPI "Alugados" de 1 para 2', () => {
  const readInt = (s: string) => parseInt(s.replace(/[^\d]/g, ''), 10) || 0;

  // 1) KPI "Alugados" deve iniciar em 1
  cy.get('.md\\:grid-cols-3 > :nth-child(2)') // card de KPI "Veículos Alugados"
    .should('be.visible')
    .invoke('text')
    .then((txt) => {
      const before = readInt(txt);
      expect(before, 'KPI "Alugados" antes do fluxo').to.eq(1);
    });

  // 2) Escolhe o primeiro card que contenha "Disponível"
  cy.get('.md\\:grid-cols-2 > * , .md\\:grid-cols-3 > * , [data-cy=lista-veiculos] > *')
    .filter(':visible')
    .filter((_i, el) => /disponível/i.test((el as HTMLElement).innerText))
    .first()
    .as('cardDisp');

  // 3) Dentro do card, clica no botão "Alugar"
  cy.get('@cardDisp').within(() => {
    cy.contains('button, [role=button], a', /^alugar$/i)
      .should('be.visible')
      .click();
  });

  // 4) Modal "Alugar Veículo" → "Confirmar Aluguel"
  cy.get('[role=dialog], .modal, .v-overlay', { timeout: 10000 })
    .filter(':visible')
    .first()
    .within(() => {
      cy.contains('button, [role=button]', /confirmar aluguel/i, { timeout: 5000 })
        .should('be.visible')
        .click();
    });

        // workaround BUG-PAG-001 (CTA fora da viewport)
    cy.viewport(Cypress.config('viewportWidth') || 1366, 1100); // ou 1200 se precisar
    cy.get('[role=dialog], .modal, .v-overlay').filter(':visible').first().within(() => {
    cy.contains(/cartão de crédito|pix/i).first().click({ force: true });
    cy.contains('button, [role=button]', /confirmar pagamento/i)
      .should('be.visible')
      .click();
    });

  // 5) Modal "Pagamento" → "Confirmar Pagamento"
  cy.get('[role=dialog], .modal, .v-overlay', { timeout: 10000 })
    .filter(':visible')
    .first()
    .within(() => {
      // Se houver seleção de forma de pagamento, escolha a primeira visível
      cy.contains(/cartão de crédito|pix/i).first().click({ force: true });
      cy.contains('button, [role=button]', /confirmar pagamento/i)
        .should('be.visible')
        .click();
    });

  // 6) Feedback de sucesso
  cy.contains(/sucesso|confirmado|processado/i, { timeout: 10000 }).should('be.visible');

  // 7) KPI "Alugados" deve agora ser 2
  cy.get('.md\\:grid-cols-3 > :nth-child(2)')
    .should('be.visible')
    .invoke('text')
    .then((txt) => {
      const after = readInt(txt);
      expect(after, 'KPI "Veículos Alugados" após o aluguel').to.eq(2);
    });
});


  // CT-006: bloquear aluguel de veículo alugado
it('CT-006: Bloquear aluguel de veículo já Alugado', () => {
  // card 3 no seu grid é o carro “Alugado”
  const BTN_ALUGADO = ':nth-child(3) > .pt-0 > .justify-between > .justify-center';

  // garante que o card é de “Alugado”
  cy.get(':nth-child(3)').should(($card) => {
    expect(($card.text() || '').toLowerCase()).to.match(/alugado/);
  });

  // verifica “desabilitado” de forma ampla (HTML e CSS)
  cy.get(BTN_ALUGADO)
    .should('exist')
    .and(($el) => {
      const el = $el[0] as HTMLElement;
      const disabledAttr =
        $el.is(':disabled') ||
        $el.attr('aria-disabled') === 'true' ||
        $el.attr('disabled') !== undefined;

      const cssBlocked =
        getComputedStyle(el).pointerEvents === 'none' ||
        $el.hasClass('pointer-events-none');

      expect(disabledAttr || cssBlocked, 'botão de Alugar deve estar desabilitado/sem ação').to.be.true;
    });

  // mesmo forçando clique, status não deve mudar
  cy.get(BTN_ALUGADO).click({ force: true });
  cy.get(':nth-child(3)').should(($card) => {
    expect(($card.text() || '').toLowerCase()).to.match(/alugado/);
  });
});


  // CT-007: bloquear aluguel de veículo em Manutenção
it('CT-007: Bloquear aluguel de veículo em Manutenção', () => {
  const BTN_MANUTENCAO = ':nth-child(5) > .pt-0 > .justify-between > .justify-center';

  cy.get(':nth-child(5)').should(($card) => {
    expect(($card.text() || '').toLowerCase()).to.match(/manutenç|manutencao/);
  });

  cy.get(BTN_MANUTENCAO)
    .should('exist')
    .and(($el) => {
      const el = $el[0] as HTMLElement;
      const disabledAttr =
        $el.is(':disabled') ||
        $el.attr('aria-disabled') === 'true' ||
        $el.attr('disabled') !== undefined;

      const cssBlocked =
        getComputedStyle(el).pointerEvents === 'none' ||
        $el.hasClass('pointer-events-none');

      expect(disabledAttr || cssBlocked, 'botão de Alugar deve estar desabilitado/sem ação').to.be.true;
    });

  cy.get(BTN_MANUTENCAO).click({ force: true });
  cy.get(':nth-child(5)').should(($card) => {
    expect(($card.text() || '').toLowerCase()).to.match(/manutenç|manutencao/);
  });
});


// CT-010: Duplo clique em "Alugar" não deve efetivar aluguel nem alterar estado
it('CT-010: Duplo clique em "Alugar" não efetiva aluguel (sem efeitos colaterais)', () => {
  const SEL_MODAL = '[role=dialog], .modal, .v-overlay';
  const readInt = (s: string) => parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0;

  // snapshot do KPI "Alugados"
  let before = 0;
  dash.kpiAlugados().should(($el) => { before = readInt($el.text()); });

  // localiza um card "Disponível" sem usar filter(predicate)
  cy.get('.md\\:grid-cols-2 > * , .md\\:grid-cols-3 > * , [data-cy=lista-veiculos] > *')
    .filter(':visible')
    .then(($els) => {
      const arr = Array.from($els as any as HTMLElement[]);
      const match = arr.find(el => /disponível/i.test(el.innerText));
      expect(match, 'um card com status "Disponível"').to.exist;
      cy.wrap(match!).as('cardDisp');
    });

  // botão "Alugar" dentro do card
  cy.get('@cardDisp').within(() => {
    cy.contains('button, [role=button], a', /^alugar$/i)
      .filter(':visible')
      .first()
      .as('btnAlugar');
  });

  // duplo clique — pode abrir/fechar o modal
  cy.get('@btnAlugar').dblclick({ force: true });
  cy.wait(150);

  // se o modal ficou aberto, fecha clicando fora dele (coordenada segura)
  cy.get('body').then(($b) => {
    const aberto = $b.find(SEL_MODAL).filter(':visible').length > 0;
    if (aberto) cy.get('body').click(10, 10, { force: true });
  });

  // oráculos mínimos: sem modal / na mesma página / sem navegação a pagamento
  cy.get(SEL_MODAL).should('not.exist');
  cy.location('pathname').should('include', '/dashboard');
  cy.contains(/^pagamento$/i).should('not.exist');

  // card continua "Disponível"
  cy.get('@cardDisp').should(($c) => {
    expect(($c.text() || '').toLowerCase()).to.match(/disponível/);
  });

  // KPI não alterou
  dash.kpiAlugados().should(($el) => {
    const after = readInt($el.text());
    expect(after, 'KPI "Veículos Alugados" deve permanecer igual').to.eq(before);
  });
});
});
