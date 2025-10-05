// cypress/pages/HeaderPage.ts
export class HeaderPage {
  // como o botão "Sair" já aparece no topo, não precisamos de menu
  sair() {
    return cy
      .contains('button, a, [role="button"]', /^sair$/i)
      .filter(':visible')
      .first()
      .click({ force: true });
  }
}
