describe('force hook specification', () => {
  it('should be possible to force an update', () => {
    const markup = /*html*/ `
      <div x-controller="controller"><div x-target></div></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, force } = relic;

      let tmp;

      const Controller = () => {
        tmp = provide('foo');
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-target]').then(($el) => {
        $el.attr('x-alias', 'controller::foo');
        expect(tmp.get()).to.be.equal(undefined);
        force();
        expect(tmp.get()).to.be.equal($el.get(0));
      });
    });
  });

  it('should not be possible to force in active state', () => {
    const markup = /*html*/ `
      <div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, force } = relic;

      const Controller = ({ root }) => {
        expect(() => force()).to.throw;
      };

      register('controller', Controller);

      observe(root);
    });
  });
});
