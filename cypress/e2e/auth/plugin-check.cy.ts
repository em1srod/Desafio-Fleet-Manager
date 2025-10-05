describe('Plugin Check', () => {
  it('should visit example page and assert title', () => {
    cy.visit('https://example.cypress.io');
    cy.title().should('include', 'Kitchen Sink');
  });
});