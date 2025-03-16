describe('x-html instruction specification', () => {
  it('should set initial value', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-html="controller::html"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, provide } = relic;

      const Controller = cy.spy(() => {
        provide('html', '<div id="target"></div>');
      });

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').find('#target').should('exist');
    });
  });

  it('should update html on signal mutation', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-html="controller::html"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp;

      const Controller = cy.spy(() => {
        tmp = provide('html');
      });

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').find('#html').should('not.exist');

      cy.get('[x-controller]')
        .should('have.html', 'undefined')
        .then(() => {
          tmp.set('<div id="html"></div>');
        })
        .find('#html')
        .should('exist');
    });
  });

  it('should not set html after instruction was removed', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-html="controller::html"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp;

      const Controller = cy.spy(() => {
        tmp = provide('html');
      });

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').invoke('removeAttr', 'x-html');

      cy.wait(1);

      cy.get('[x-controller]')
        .then(() => {
          tmp.set('<div id="html"></div>');
        })
        .find('#html')
        .should('not.exist');
    });
  });

  it('should not set html when instruction value is mutated', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-html="controller::html"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp;

      const Controller = cy.spy(() => {
        tmp = provide('html');
      });

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').invoke('removeAttr', 'x-html');

      cy.wait(1);

      cy.get('[x-controller]')
        .then(() => {
          tmp.set('<div id="html"></div>');
        })
        .find('#html')
        .should('not.exist');
    });
  });

  it('should use another signal after instrucation was mutated', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-html="controller::html"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const tmp = {
        html: undefined,
        html2: undefined,
      };

      const Controller = cy.spy(() => {
        tmp.html = provide('html');
        tmp.html2 = provide('html2');
      });

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]')
        .invoke('attr', 'x-html', 'controller::html2')
        .then(() => {
          tmp.html2.set('<div id="html"></div>');
          tmp.html.set('');
        })
        .find('#html')
        .should('exist');
    });
  });
});
