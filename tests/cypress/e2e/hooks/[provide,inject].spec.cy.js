describe('[provide, inject] hook cpecification', () => {
  it('should throw an error if a signal with a given name was already provided', () => {
    const markup = /*html*/ `<div x-controller="foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, observe } = relic;

      const Foo = cy.spy(() => {
        provide('baz');

        expect(() => provide('baz')).to.throw;
      });

      register('foo', Foo);

      observe(root);

      expect(Foo).to.be.calledOnce;
    });
  });

  it('should set false as initial value', () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp;

      const Controller = () => {
        tmp = provide('foo', false);
      };

      register('controller', Controller);
      observe(root);

      expect(tmp.get()).to.equal(false);
    });
  });

  it('should return signal if it was previously provided', () => {
    const markup = /*html*/ `<div x-controller="foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, inject, observe } = relic;

      const Foo = cy.spy(() => {
        const s = provide('baz');

        expect(inject('baz')).to.be.equal(s);
      });

      register('foo', Foo);

      observe(root);

      expect(Foo).to.be.calledOnce;
    });
  });

  it('should return undefined if no signal was previously provided', () => {
    const markup = /*html*/ `<div x-controller="foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, inject, observe } = relic;

      const Foo = cy.spy(() => {
        expect(inject('baz')).to.be.equal(undefined);
      });

      register('foo', Foo);

      observe(root);

      expect(Foo).to.be.calledOnce;
    });
  });
});
