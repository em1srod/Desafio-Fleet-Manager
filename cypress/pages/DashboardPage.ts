// cypress/pages/DashboardPage.ts
export class DashboardPage {
  // Em Tailwind, ":" precisa ser escapado (\\:)
  private readonly GRID_TW = '.md\\:grid-cols-2';

  open() {
    cy.visit('/dashboard');
  }

  // ---------------- KPIs (atualizados) ----------------
  // Total de Veículos
  kpiTotal()    { return cy.get('.md\\:grid-cols-3 > :nth-child(1)'); }
  // Veículos Alugados
  kpiAlugados() { return cy.get('.md\\:grid-cols-3 > :nth-child(2)'); }
  // Receita Total
  kpiReceita()  { return cy.get('.md\\:grid-cols-3 > :nth-child(3)'); }

  // ---------------- Busca ----------------
  busca() {
    return cy.get('[data-cy=input-busca], input[placeholder*="Buscar"]');
  }

  emptyState() {
    return cy.get('[data-cy=empty-state]').then($el => {
      if ($el.length) return cy.wrap($el);
      return cy.contains(/Nenhum veículo encontrado/i);
    });
  }

  // ---------------- Grid / Cards ----------------
  private grid() {
    const SEL_DATA = '[data-cy=lista-veiculos]';
    return cy.get(`${SEL_DATA}, ${this.GRID_TW}`).then($el => {
      if ($el.filter(SEL_DATA).length) return cy.get(SEL_DATA);
      return cy.get(this.GRID_TW);
    });
  }

  card(placa: string) {
    return this.grid().then($grid => {
      if ($grid.is('[data-cy=lista-veiculos]')) {
        return cy.contains('[data-cy=lista-veiculos] > *', placa);
      }
      return cy.contains(`${this.GRID_TW} > *`, placa);
    });
  }

  cardModelo(placa: string) {
    return this.card(placa).within(() => {
      return cy.get(
        '[data-cy=card-modelo], [data-testid=card-modelo], [data-modelo], ' +
        'h3, h2, [class*="modelo"], [class*="title"], [class*="heading"]'
      ).first();
    });
  }

  cardPrecoDia(placa: string) {
    return this.card(placa).within(() => {
      return cy.get(
        '[data-cy=card-preco-dia], [data-testid=card-preco-dia], [data-preco], ' +
        '[class*="preco"], [class*="price"], [class*="valor"]'
      ).filter(':contains("R$"), :matches-css(color)').first();
    });
  }

  cardStatus(placa: string) {
    return this.card(placa).within(() => {
      return cy.get(
        '[data-cy=chip-status], [data-testid=chip-status], [data-status], ' +
        '[class*="status"], [class*="chip"], [class*="badge"]'
      ).first();
    });
  }

  cardAlugar(placa: string) {
    return this.card(placa).within(() => {
      return cy.get('[data-cy=btn-alugar]').then($btn => {
        if ($btn.length) return cy.wrap($btn);
        return cy.contains('button, a', /alugar/i);
      });
    });
  }

  // ---------------- Feedbacks / sessão ----------------
  toastSucesso() { return cy.get('[data-cy=toast-sucesso]'); }
  toastErro()    { return cy.get('[data-cy=toast-erro]'); }

  sair() {
    return cy.get('[data-cy=btn-sair]').then($btn => {
      if ($btn.length) return cy.wrap($btn);
      return cy.contains('button, .inline-flex, a', /^sair$/i).then($found => {
        if ($found.length) return cy.wrap($found);
        return cy.get('.container > .inline-flex').contains(/^sair$/i);
      });
    });
  }
}
