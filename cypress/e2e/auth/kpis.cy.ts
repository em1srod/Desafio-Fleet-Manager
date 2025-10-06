// cypress/e2e/dashboard/kpis.cy.ts
import { DashboardPage } from '../../pages/DashboardPage';

const dash = new DashboardPage();

const parseMoney = (s: string) =>
  Number(String(s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));

// extrai o inteiro exibido dentro do card (ignora rótulos/ícones)
const readIntFromCard = (el: JQuery<HTMLElement>) => {
  const onlyDigits = el.text().replace(/[^\d]/g, '');
  return onlyDigits ? parseInt(onlyDigits, 10) : NaN;
};

// helpers de KPI via DashboardPage
const KPI = {
  total:    () => dash.kpiTotal(),
  alugados: () => dash.kpiAlugados(),
  receita:  () => dash.kpiReceita(),
};

describe('Dashboard - KPIs', () => {
  // valores iniciais informados
  const EXPECT = { total: 8, alugados: 1, receita: 1850 };

  beforeEach(() => {
    // intercepta a primeira carga de veículos para sincronizar a renderização dos cards/KPIs
    cy.intercept('GET', '**/api/vehicles*').as('vehicles');

    // garantir contexto de login
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then(w => w.sessionStorage.clear());

    cy.visit('/login');
    cy.login('admin@teste.com', '123456');
    cy.location('pathname', { timeout: 10000 }).should('include', '/dashboard');

    // espera a primeira listagem chegar (ajuda os KPIs a já estarem preenchidos)
    cy.wait('@vehicles');
  });

  it('CT-001: KPIs são exibidos (Total / Alugados / Receita)', () => {
    KPI.total().should('be.visible');
    KPI.alugados().should('be.visible');
    KPI.receita().should('be.visible');
  });

  it('CT-001A: "Total de veículos" inicia em 8', () => {
    KPI.total().should(($el) => {
      const v = readIntFromCard($el);
      // o callback do should() é reexecutado até passar dentro do timeout padrão
      expect(v, 'valor do KPI Total').to.eq(EXPECT.total);
    });
  });

  it('CT-001B: "Veículos Alugados" inicia em 1', () => {
    KPI.alugados().should(($el) => {
      const v = readIntFromCard($el);
      expect(v, 'valor do KPI Alugados').to.eq(EXPECT.alugados);
    });
  });

  it('CT-001C: "Receita Total" inicia em R$ 1.850', () => {
    KPI.receita().should(($el) => {
      const v = parseMoney($el.text());
      expect(v, 'valor do KPI Receita').to.eq(EXPECT.receita);
    });
  });

  // ---------- abaixo continuam iguais (mantidos) ----------
  const clickPrimeiroAlugar = () =>
    cy.contains('button, [role=button], a', /^alugar$/i).filter(':visible').first().click({ force: true });

  const confirmarAlugarNoModal = () =>
    cy.contains(/alugar veículo/i, { timeout: 8000 })
      .parents('[role=dialog], .modal, .v-overlay, .v-dialog')
      .first()
      .within(() => cy.contains(/confirmar aluguel/i).click({ force: true }));

  const modalPagamento = () =>
    cy.contains(/^pagamento$/i, { timeout: 8000 })
      .parents('[role=dialog], .modal, .v-overlay, .v-dialog')
      .first();

  const confirmarPagamento = () =>
    modalPagamento().within(() => {
      cy.contains(/cartão de crédito|pix/i).first().click({ force: true });
      cy.contains(/confirmar pagamento/i).click({ force: true });
    });

  it('CT-008: "Total de veículos" não altera ao alugar um veículo', () => {
    let before: number;
    KPI.total().should(($el) => { before = readIntFromCard($el); });

    clickPrimeiroAlugar();
    confirmarAlugarNoModal();
    confirmarPagamento();

    cy.contains(/sucesso|confirmado|processado/i, { timeout: 10000 }).should('be.visible');

    KPI.total().should(($el) => {
      const after = readIntFromCard($el);
      expect(after).to.eq(before);
    });
  });
  
  // CT-009 descontinuado: Dashboard não mostra dias de aluguel por veículo.
  // Teste não permite validação confiável da Receita Total.
/*
  it('CT-009: Receita Total soma preços/dia dos veículos Alugados', () => {
    cy.get('.vehicle-card, [data-cy=card-veiculo], [class*=vehicle][class*=card]')
      .filter(':visible')
      .then($cards => {
        let soma = 0;
        [...$cards].forEach(el => {
          const txt = (el as HTMLElement).innerText;
          if (/alugado/i.test(txt)) {
            const m = txt.match(/R\$\s*[\d\.\,]+/);
            if (m) soma += parseMoney(m[0]);
          }
        });

        KPI.receita().should(($el) => {
          const kpi = parseMoney($el.text());
          expect(kpi, 'Receita total deve refletir soma de diárias dos alugados')
            .to.be.closeTo(soma, 0.01);
        });
      });
  });
*/
  // @rf-v-010 @bug BUG-CT-011
  //https://github.com/em1srod/Desafio-Fleet-Manager/issues/5
  it('CT-011: KPI "Veículos Alugados" deve incrementar após novo aluguel', () => {
    let before = 0;
    KPI.alugados().should(($el) => {
      before = readIntFromCard($el);
    });

    // Clica no primeiro botão "Alugar" visível
    clickPrimeiroAlugar();

    // Espera o modal "Alugar Veículo" ser exibido antes de prosseguir
    cy.contains('h2, h3, div', /alugar veículo/i, { timeout: 8000 })
      .should('be.visible')
      .parents('[role=dialog], .modal, .v-overlay')
      .first()
      .within(() => {
        cy.contains('button', /confirmar aluguel/i, { timeout: 5000 })
          .should('be.visible')
          .click();
      });

    // Confirmação de pagamento (mantém sua função custom, se existir)
    confirmarPagamento();

    // Verifica se mensagem de sucesso foi exibida
    cy.contains(/sucesso|confirmado|processado/i, { timeout: 10000 }).should('be.visible');

    // Valida incremento do KPI "Veículos Alugados"
    KPI.alugados().should(($el) => {
      const after = readIntFromCard($el);
      expect(after, 'KPI "Veículos Alugados" deveria subir +1').to.eq(before + 1);
    });
  });
});