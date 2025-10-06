// cypress/e2e/auth/bugs_regressao.cy.ts
// v2025-10-06 determinístico: identifica o MESMO card por placa (Mercosul/antiga) ou índice da grid;
// cancela dentro do contexto de Pagamento; espera refresh da lista antes de validar.

const GRID_ITEMS =
  '.md\\:grid-cols-2 > * , .md\\:grid-cols-3 > * , [data-cy=lista-veiculos] > *';

const CARD_SEL =
  '[data-cy=card-veiculo], .vehicle-card, .rounded-lg.border.bg-card.text-card-foreground.shadow-sm.vehicle-card, .rounded-lg.border.bg-card.text-card-foreground.shadow-sm.dashboard-card';

const MODAL = '[role=dialog], .modal, .v-overlay, .v-dialog';
const PAG_CONTEXT = [
  MODAL,
  '.drawer, .ant-drawer, .ant-drawer-content, .mantine-Drawer-content',
  '.sheet, .v-bottom-sheet, .MuiDrawer-root, .MuiDialog-root',
  '[data-cy=pagamento], [data-testid=pagamento], #pagamento',
].join(', ');

// Placa antiga: ABC1234  | Mercosul: ABC1D23
const RE_PLACA = /[A-Z]{3}\s?-?\s?(?:\d{4}|\d[A-Z]\d{2})/;

const waitDashboardReady = () => {
  cy.location('pathname', { timeout: 10000 }).should('include', '/dashboard');
  cy.get(GRID_ITEMS).filter(':visible').should('have.length.greaterThan', 0);
};

const firstDisponivel_getCard_saveKeyAndIndex = () => {
  cy.get(GRID_ITEMS).filter(':visible').then(($els) => {
    const arr = Array.from($els as any as HTMLElement[]);
    const idx = arr.findIndex((el) => /dispon[ií]vel/i.test(el.innerText));
    expect(idx, 'existir pelo menos 1 card "Disponível"').to.be.greaterThan(-1);

    const el = arr[idx]!;
    const $card = Cypress.$(el).closest(CARD_SEL);
    expect($card.length, 'container do card').to.be.greaterThan(0);

    cy.wrap($card, { log: false }).as('cardDisp');
    cy.wrap(idx, { log: false }).as('idxCard');

    const txt = $card.text();
    const placa = (txt.toUpperCase().match(RE_PLACA) || [])[0]?.replace(/\s|-/g, '');
    const titulo = (txt.split('\n')[0] || '').trim();
    const chave = placa || titulo || `CARD_IDX_${idx}`;
    cy.wrap(chave, { log: false }).as('chaveCard');
  });
};

const clickInside = (containerAlias: string, labelRe: RegExp) => {
  cy.get(containerAlias).within(() => {
    cy.contains('button, [role=button], a', labelRe, { timeout: 10000 })
      .then(($btn) => {
        if (!$btn.is(':visible')) cy.wrap($btn).scrollIntoView();
      })
      .should('be.visible')
      .click({ force: true });
  });
};

const abrirFluxoPagamento = () => {
  firstDisponivel_getCard_saveKeyAndIndex();

  // "Alugar" no próprio card
  clickInside('@cardDisp', /^alugar$/i);

  // Confirmar Aluguel (se existir globalmente)
  cy.get('body').then(($b) => {
    if (/confirmar aluguel/i.test($b.text())) {
      cy.contains('button, [role=button], a', /confirmar aluguel/i, { timeout: 10000 })
        .then(($btn) => { if (!$btn.is(':visible')) cy.wrap($btn).scrollIntoView(); })
        .should('be.visible')
        .click({ force: true });
    }
  });
};

const cancelarPagamento = () => {
  // 1) tente cancelar dentro de um contexto de pagamento reconhecido
  cy.document().then((doc) => {
    const nodes = Array.from(doc.querySelectorAll(PAG_CONTEXT));
    const ctx = nodes.find((n) => /pagamento/i.test(n.textContent || '')) || nodes[0];

    if (ctx) {
      cy.wrap(ctx).as('pagCtx');
      clickInside('@pagCtx', /cancelar/i);
      return;
    }

    // 2) fallback: container que contém "Pagamento"
    const byText = Array.from(doc.querySelectorAll('body *'))
      .find((n) => /pagamento/i.test(n.textContent || ''));
    if (byText) {
      cy.wrap(byText).as('pagCtx2');
      clickInside('@pagCtx2', /cancelar/i);
      return;
    }

    // 3) último recurso: 1º "Cancelar" visível global
    cy.contains('button, [role=button], a', /cancelar/i, { timeout: 10000 })
      .then(($btn) => { if (!$btn.is(':visible')) cy.wrap($btn).scrollIntoView(); })
      .should('be.visible')
      .click({ force: true });
  });

  // Espera um refresh da lista (ou pelo menos que a grade esteja visível novamente)
  cy.wait(200); // micro tempo para a ação disparar request
  cy.get(GRID_ITEMS, { timeout: 8000 }).filter(':visible').should('have.length.greaterThan', 0);
};

const validarQueMesmoCardPermaneceDisponivel = () => {
  cy.get<string>('@chaveCard').then((chave) => {
    const placaLike = chave?.toUpperCase().match(RE_PLACA)?.[0]?.replace(/\s|-/g, '');

    if (placaLike) {
      // 1) preferir encontrar pelo texto/placa
      cy.contains(GRID_ITEMS, new RegExp(placaLike, 'i'), { timeout: 8000 })
        .filter(':visible')
        .first()
        .then(($hit) => {
          const $card = $hit.closest(CARD_SEL);
          expect($card.length, 'container do card (by placa)').to.be.greaterThan(0);
          const texto = ($card.text() || '').toLowerCase();
          expect(texto.includes('alugado'), 'card NÃO pode ficar "Alugado" sem pagar').to.be.false;
          expect(texto.includes('disponível'), 'card deve continuar "Disponível" enquanto não pagar').to.be.true;
        });
    } else {
      // 2) fallback por índice original
      cy.get<number>('@idxCard').then((idx) => {
        cy.get(GRID_ITEMS).filter(':visible').eq(idx).then(($el) => {
          const $card = ($el as JQuery).closest(CARD_SEL);
          expect($card.length, 'container do card (by index)').to.be.greaterThan(0);
          const texto = ($card.text() || '').toLowerCase();
          expect(texto.includes('alugado'), 'card NÃO pode ficar "Alugado" sem pagar').to.be.false;
          expect(texto.includes('disponível'), 'card deve continuar "Disponível" enquanto não pagar').to.be.true;
        });
      });
    }
  });
};

// ----------------- Suíte -----------------
describe('Bugs de Pagamento & Cupom — Regressão (determinístico)', () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((w) => w.sessionStorage.clear());

    cy.intercept('GET', '**/api/vehicles*').as('vehicles');

    cy.visit('/login');
    cy.login('admin@teste.com', '123456');

    cy.wait('@vehicles');
    waitDashboardReady();
  });

  it('BUG-PAY-001: NÃO deveria marcar "Alugado" sem pagar (Confirmar Aluguel → Cancelar)', () => {
    abrirFluxoPagamento();
    cancelarPagamento();
    validarQueMesmoCardPermaneceDisponivel(); // <- aqui deve REPROVAR se o sistema marcar "Alugado"
  });

  it('BUG-PAY-002: Cancelar pagamento deve manter veículo "Disponível"', () => {
    abrirFluxoPagamento();
    cancelarPagamento();

    // Verifica pelo mesmo card (chave/índice)
    validarQueMesmoCardPermaneceDisponivel();
  });

  it('BUG-PAY-003: Confirmar pagamento deveria exibir recibo/ID de transação', () => {
    abrirFluxoPagamento();

    // Se houver método, escolhe e tenta confirmar (genérico)
    cy.get('body').then(($b) => {
      if (/pix|cart[aã]o de cr[eé]dito/i.test($b.text())) {
        cy.contains('button, [role=button], a', /pix|cart[aã]o de cr[eé]dito/i, { timeout: 8000 })
          .then(($btn) => { if (!$btn.is(':visible')) cy.wrap($btn).scrollIntoView(); })
          .click({ force: true });
      }
    });

    cy.contains('button, [role=button], a', /confirmar pagamento/i, { timeout: 8000 })
      .then(($btn) => { if (!$btn.is(':visible')) cy.wrap($btn).scrollIntoView(); })
      .click({ force: true });

    // Oráculo: deveria aparecer comprovante/ID (se não houver, falha)
    cy.contains(/recibo|comprovante|id da transa(ç|c)[aã]o|id do pagamento/i, { timeout: 4000 })
      .should('be.visible');
  });

  it('BUG-DEVOLUCAO-001: Deveria existir ação para "Devolver" ou "Cancelar Aluguel"', () => {
    cy.contains(GRID_ITEMS, /alugado/i, { timeout: 10000 })
      .filter(':visible')
      .first()
      .then(($hit) => {
        const $card = $hit.closest(CARD_SEL);
        expect($card.length, 'container do card').to.be.greaterThan(0);
        cy.wrap($card).contains(/devolver|cancelar aluguel/i).should('be.visible');
      });
  });
});
