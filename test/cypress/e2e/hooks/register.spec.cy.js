describe('register hook specification', () => {
  it('should update when called after observe hook', () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { observe, register } = malenia;

      const Controller = cy.spy(() => {});

      observe(root);

      expect(Controller).to.not.be.called;
      register('controller', Controller);
      expect(Controller).to.be.calledOnce;
    });
  });
});
