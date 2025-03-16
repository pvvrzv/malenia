describe('glogal hook specification', () => {
  it('should not be possible to use active state hooks in idle state', () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe } = relic;

      expect(() => observe()).to.throw();
      expect(() => mount(() => {})).to.throw();
      expect(() => unmount(() => {})).to.throw();
      expect(() => setup(() => {})).to.throw();
    });
  });
});
