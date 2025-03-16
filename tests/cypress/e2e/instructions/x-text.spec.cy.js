describe('x-text instruction specification', () => {
  it('should set initial value', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-text="controller::text"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, provide } = relic;

      const Controller = cy.spy(() => {
        provide('text', 'text');
      });

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').should('have.text', 'text');
    });
  });

  it('should update text on signal mutation', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-text="controller::text"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp;

      const Controller = cy.spy(() => {
        tmp = provide('text');
      });

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]')
        .should('have.text', '')
        .then(() => {
          tmp.set('tex2');
        })
        .should('have.text', 'tex2');
    });
  });

  it('should not set html after instruction was removed', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-text="controller::text"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, immediate } = relic;

      let tmp;

      const Controller = cy.spy(() => {
        tmp = provide('text', '');
      });

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').invoke('removeAttr', 'x-text');

      cy.wait(1);

      cy.get('[x-controller]')
        .then(() => {
          tmp.set('tttt');
        })
        .should('have.text', '');
    });
  });

  it('should use another signal after instrucation was mutated', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-text="controller::text"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const tmp = {
        text: undefined,
        text2: undefined,
      };

      const Controller = cy.spy(() => {
        tmp.text = provide('text');
        tmp.text2 = provide('text2');
      });

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').invoke('attr', 'x-text', 'controller::text2');

      cy.wait(1);

      cy.get('[x-controller]')
        .then(() => {
          tmp.text2.set('text2');
          tmp.text.set('text');
        })
        .should('have.text', 'text2');
    });
  });
});
