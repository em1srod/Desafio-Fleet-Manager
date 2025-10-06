// cypress/e2e/dashboard/busca.cy.ts
describe('Dashboard - Busca', () => {
  const CARD = '.vehicle-card';
  const SEARCH = 'input[placeholder*="Buscar"]';

  beforeEach(() => {
    // Intercept genérico para a carga inicial do dashboard
    cy.intercept('GET', '**/api/vehicles*').as('vehicles');

    // Login
    cy.visit('/login');
    cy.login('admin@teste.com', '123456');
    cy.assertOnDashboard();

    // Espera a primeira listagem aparecer
    cy.wait('@vehicles');
    cy.get(CARD, { timeout: 10000 }).should('exist'); // há cards inicialmente
  });

  it('CT-002: Buscar por modelo', () => {
    const termo = 'Fiat Uno';

    // Intercept específico para a busca com o termo
    cy.intercept({ method: 'GET', url: '**/api/vehicles*', query: { search: termo } })
      .as('vehiclesSearch');

    // Digita no campo de busca e aguarda a request de busca
    cy.get(SEARCH).clear().type(termo);
    cy.wait('@vehiclesSearch');

    // Valida APENAS os cards visíveis (sem depender do grid/alias)
    cy.get(`${CARD}:visible`)
      .should('have.length.at.least', 1)
      .each(($card) => {
        cy.wrap($card)
          .invoke('text')
          .should('match', new RegExp(termo, 'i'));
      });

    // (opcional) garante que nenhum card visível foge do filtro
    cy.get(`${CARD}:visible`).then(($cards) => {
      const nonMatching = [...$cards].filter(el => !new RegExp(termo, 'i').test(el.innerText));
      expect(nonMatching.length, 'cards não-matching visíveis').to.eq(0);
    });
  });

  it('CT-003: Buscar por placa', () => {
    const placa = 'ABC1234'; // ajuste para uma placa existente

    cy.intercept({ method: 'GET', url: '**/api/vehicles*', query: { search: placa } })
      .as('vehiclesSearch');

    cy.get(SEARCH).clear().type(placa);
    cy.wait('@vehiclesSearch');

    // Deve restar somente 1 card visível e conter a placa
    cy.get(`${CARD}:visible`).should('have.length', 1);
    cy.contains(CARD, placa).should('be.visible');
  });
  //@rf-v-014  @bug BUG-CT-004
  //https://github.com/em1srod/Desafio-Fleet-Manager/issues/4
  it('CT-004: Busca sem resultados deve exibir mensagem de vazio', () => {
    const termoInexistente = 'ZZZ9999';

    // 0) Confirma que havia itens antes (evita falso positivo)
    cy.get(`${CARD}:visible`).then(($cards) => {
      expect($cards.length, 'grade inicial com itens').to.be.greaterThan(0);
    });

    // 1) Intercepta a busca e dispara com termo inexistente
    cy.intercept({ method: 'GET', url: '**/api/vehicles*', query: { search: termoInexistente } })
      .as('vehiclesSearch');

    cy.get(SEARCH).clear().type(termoInexistente);
    cy.wait('@vehiclesSearch');

    // 2) A grid fica vazia
    cy.get(`${CARD}:visible`).should('have.length', 0);

    // 3) Deve aparecer uma mensagem clara de "sem resultados"
    //    (se não aparecer, o teste falha – este é o bug)
    const emptyMsgPattern = /(não há|nenhum|sem resultados|no results|nenhum veículo)/i;

    cy.get('body', { timeout: 2000 }).then(($body) => {
      const found = emptyMsgPattern.test($body.text());
      expect(
        found,
        'Esperado exibir mensagem de vazio (ex.: "Não há resultados"), mas nada foi mostrado.'
      ).to.be.true;
    });
  });
});
