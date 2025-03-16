describe('`immediate` hook specification', () => {
  it('must run only AFTER observe hook was called', () => {
    const markup = /*html*/ `<div></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, force, immediate } = relic;

      let tmp = false;

      immediate(() => (tmp = true));
      expect(tmp).to.equal(false);
      observe(root);
      expect(tmp).to.equal(true);
    });
  });

  it('should not run on another mutation if an error was thrown', () => {
    const markup = /*html*/ `<div x-target x-controller="foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, immediate, force } = relic;

      const spy = cy.spy(() => {
        throw new Error();
      });

      const Foo = () => {
        throw new Error('');
      };

      register('foo', Foo);
      expect(() => observe(root)).to.throw();
      expect(spy).to.not.be.called;

      cy.get('[x-target]')
        .invoke('get', 0)
        .then((el) => {
          el.removeAttribute('x-controller');
          immediate(spy)
          expect(() => force()).to.throw();
          expect(spy).to.be.calledOnce;
        });

      cy.get('[x-target]').invoke('attr', 'x-alias', 'baz::dir');

      cy.wait(1).then(() => {
        expect(spy).to.be.calledOnce;
      });
    });
  });
});
