Cypress.Commands.add('mount', (markup) => {
  cy.visit('/tests/cypress/static/index.html', { log: false });
  cy.window({ log: false })
    .its('malenia', { log: false })
    .as('malenia', { log: false });

  return cy
    .get('body', { log: false })
    .invoke({ log: false }, 'html', markup)
    .then(() => {
      return cy.get('@malenia', { log: false }).then((malenia) => {
        return { root: Cypress.$('html').get(0), malenia };
      });
    });
});
