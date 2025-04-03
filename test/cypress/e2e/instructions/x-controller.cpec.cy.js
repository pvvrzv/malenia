describe('x-controller instruction specification', () => {
  it('should initialize controller and pass it props', () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { observe, register } = malenia;

      const Controller = cy.spy(() => {});

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').then((element) => {
        expect(Controller).to.be.calledWith({ root: element[0] });
        expect(Controller).to.be.calledOnce;
      });
    });
  });

  it('should initialize controller only once', () => {
    const markup = /*html*/ `<div x-controller="controller controller"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { observe, register } = malenia;

      const Controller = cy.spy(() => {});

      register('controller', Controller);
      observe(root);

      expect(Controller).to.be.calledOnce;
    });
  });

  it('should not throw when instruction arguments is an empty string', () => {
    const markup = /*html*/ `<div x-controller=""></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe } = malenia;

      const Controller = cy.spy(() => {});

      register('controller', Controller);
      expect(() => observe(root)).not.to.throw;
    });
  });

  it('should not throw when instruction was not passed any arguments', () => {
    const markup = /*html*/ `<div x-controller></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe } = malenia;

      const Controller = cy.spy(() => {});

      register('controller', Controller);
      expect(() => observe(root)).not.to.throw;
    });
  });

  it('should initialize controller only once for the same element', () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { observe, register, mount } = malenia;

      const spy = cy.spy(() => {});

      const Controller = cy.spy(() => {
        mount(spy);
      });

      register('controller', Controller);
      observe(root);

      expect(Controller).to.be.calledOnce;
      expect(spy).to.be.calledOnce;

      cy.get('[x-target]').invoke('removeAttr', 'x-controller');

      cy.wait(1);

      cy.get('[x-target]').invoke('attr', 'x-controller', 'controller');

      cy.wait(1);

      cy.get('[x-target]').then((e) => {
        expect(Controller).to.be.calledOnce;
        expect(spy).to.be.calledTwice;
      });
    });
  });

  it('should update when instuction arguments change', () => {
    const markup = /*html*/ `<div x-controller=""></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { observe, register } = malenia;

      const Controller = cy.spy(() => {});

      register('controller', Controller);
      observe(root);

      expect(Controller).to.not.be.calledOnce;

      cy.get('[x-controller]').invoke('attr', 'x-controller', 'controller');

      cy.wait(1);

      cy.get('[x-controller]').then((element) => {
        expect(Controller).to.be.calledOnce;
      });
    });
  });
});
