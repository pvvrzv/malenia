Cypress.Commands.add('mount', (markup) => {
  cy.visit('/tests/cypress/static/index.html', { log: false });
  cy.window({ log: false })
    .its('Relic', { log: false })
    .as('relic', { log: false });

  return cy
    .get('body', { log: false })
    .invoke({ log: false }, 'html', markup)
    .then(() => {
      return cy.get('@relic', { log: false }).then((relic) => {
        return { root: Cypress.$('html').get(0), relic };
      });
    });
});
