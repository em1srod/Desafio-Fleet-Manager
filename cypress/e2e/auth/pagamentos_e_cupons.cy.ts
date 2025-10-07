// @ts-nocheck
export {}
/// <reference types="cypress" />

// v2025-10-06 — suíte completa usando o fluxo estável por modal.
// Seletores sem role=button; sempre faz scrollIntoView antes de clicar.

// ---------- Seletores base ----------
const GRID_ITEMS =
  '.md\\:grid-cols-2 > * , .md\\:grid-cols-3 > * , [data-cy=lista-veiculos] > *'
const CARD_SEL =
  '[data-cy=card-veiculo], .vehicle-card, .rounded-lg.border.bg-card.text-card-foreground.shadow-sm.vehicle-card, .rounded-lg.border.bg-card.text-card-foreground.shadow-sm.dashboard-card'
const DIALOG = '[role=dialog], .modal, .v-dialog, .ant-modal, .mantine-Modal-root'
const BTN_ANY = 'button, a, [type=button], [class*=btn], [class*=button]'

// ---------- Dinheiro ----------
const parseMoney = (s: unknown) => {
  const raw = String(s ?? '').trim()
  if (!raw) return 0
  const cleaned = raw.replace(/[^\d,.\-]/g, '')
  return /,/.test(cleaned) ? Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0 : Number(cleaned) || 0
}
const takeFirstMoney = (text: string) => {
  const m = text.match(/-?\s*(?:R\$\s*)?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/)
  return parseMoney(m ? m[0] : 0)
}

// ---------- Utilidades ----------
const clickLabel = (label: RegExp, $scope?: JQuery, timeout = 10000) => {
  cy.then(() => {
    if ($scope && $scope.length) {
      const $hit = Cypress.$($scope)
        .find(BTN_ANY)
        .filter(':visible')
        .filter((_i, el) => label.test((el.textContent || el.innerText || '').trim()))
        .first()
      if ($hit.length) {
        if (!$hit.is(':visible')) cy.wrap($hit).scrollIntoView({ block: 'center' })
        return cy.wrap($hit).click({ force: true })
      }
    }
    return cy.contains(BTN_ANY, label, { timeout })
      .then(($b) => { if (!$b.is(':visible')) cy.wrap($b).scrollIntoView({ block: 'center' }) })
      .click({ force: true })
  })
}

const abrirPagamentoBarato = () => {
  // escolhe Scooter ou Bicicleta (prints) — são os mais baratos
  cy.contains(GRID_ITEMS, /scooter el[eé]trica|bicicleta motorizada/i, { timeout: 10000 })
    .filter(':visible')
    .first()
    .then(($hit) => {
      const $card = (() => {
        const $c = Cypress.$($hit).closest(CARD_SEL)
        return $c.length ? $c : $hit
      })()
      clickLabel(/^\s*alugar\s*$/i, $card, 10000)
    })

  // “Alugar Veículo” → Confirmar Aluguel
  cy.contains(/^\s*alugar veículo\s*$/i, { timeout: 12000 })
    .parents(DIALOG).first().as('modalAlugar')

  clickLabel(/confirmar aluguel/i, undefined, 12000)

  // modal “Pagamento”
  cy.contains(/^\s*pagamento\s*$/i, { timeout: 12000 })
    .parents(DIALOG).first().as('pag')
}

const getValorFinal = () =>
  cy.get('@pag')
    .contains(/valor\s*final/i, { timeout: 8000 })
    .parentsUntil('@pag')
    .last()
    .parent()
    .invoke('text')
    .then((t) => takeFirstMoney(String(t)))

const aplicarCupom = (codigo = 'DESCONTO50') => {
  cy.get('@pag').within(() => {
    cy.get('input[placeholder*="EX" i][placeholder*="DESCONTO" i], input[placeholder*="cupom" i]')
      .first()
      .should('be.visible')
      .then(($inp) => {
        if (!$inp.is(':visible')) cy.wrap($inp).scrollIntoView({ block: 'center' })
      })
      .clear({ force: true })
      .type(codigo, { force: true })

    clickLabel(/^\s*aplicar\s*$/i, undefined, 8000)
  })

  // aguarda mudança do valor (sem números mágicos)
  cy.get('@pag', { timeout: 8000 }).should(($p) => {
    // apenas força uma reavaliação do DOM; o assert real é feito no teste
    expect($p.length).to.be.greaterThan(0)
  })
}

const confirmarPagamento = () => {
  clickLabel(/cart[aã]o de cr[eé]dito|pix/i, undefined, 8000)
  clickLabel(/confirmar pagamento/i, undefined, 8000)
}

// ---------- Suíte ----------
describe('Pagamento e Cupom — completo (estável por modal)', () => {
  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.clearCookies(); cy.clearLocalStorage(); cy.window().then(w=>w.sessionStorage.clear())
    cy.intercept('GET', '**/api/vehicles*').as('vehicles')

    cy.visit('/login')
    cy.login('admin@teste.com', '123456')

    cy.wait('@vehicles')
    cy.get(GRID_ITEMS).filter(':visible').should('have.length.greaterThan', 0)
  })

  it('CT-018: Aplicar DESCONTO50 deve subtrair R$ 50 do Valor Final', () => {
    // Oráculo: diferença tem que ser exatamente 50 (mínimo zero) — esperado REPROVAR pelo bug atual
    abrirPagamentoBarato()

    getValorFinal().then((antes) => {
      aplicarCupom('DESCONTO50')
      getValorFinal().then((depois) => {
        const esperado = Math.max(antes - 50, 0)
        expect(depois, 'Valor Final após DESCONTO50').to.eq(esperado)
      })
    })
  })

  it('CT-019: Se Valor Final inicial < R$ 50, após DESCONTO50 deve ficar R$ 0', () => {
    // Esperado: PASSAR
    abrirPagamentoBarato()

    getValorFinal().then((antes) => {
      expect(antes, 'Pré-condição: Valor Final inicial < 50').to.be.lessThan(50)
      aplicarCupom('DESCONTO50')

      // valida 0 exatamente dentro do modal
      cy.get('@pag', { timeout: 8000 }).should(($p) => {
        const txt = $p.text()
        const val = takeFirstMoney(txt.split(/valor\s*final/i).pop() || txt)
        expect(val, 'Valor Final com DESCONTO50 (inicial < 50)').to.eq(0)
      })
    })
  })

  it('CT-020: Confirmar pagamento deveria exibir recibo/ID de transação', () => {
    // Oráculo: deve exibir recibo/ID — esperado REPROVAR
    abrirPagamentoBarato()
    confirmarPagamento()

    cy.contains(
      /recibo|comprovante|id da transa(ç|c)[aã]o|id do pagamento/i,
      { timeout: 4000 }
    ).should('be.visible')
  })
})
