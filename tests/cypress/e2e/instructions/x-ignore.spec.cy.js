describe('x-ignore instruction specification', () => {
  it('should ignore x-controller', () => {
    const markup = /*html*/ `
    <div x-ignore x-controller="foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register } = relic;

      const Foo = cy.spy(() => {});

      register('foo', Foo);
      observe(root);

      expect(Foo).to.not.be.called;
    });
  });

  it('should ignore x-text', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-text="foo::text" x-ignore>initial</div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const Foo = cy.spy(() => {
        provide('text', 'text');
      });

      register('foo', Foo);
      observe(root);

      expect(Foo).to.be.calledOnce;

      cy.get('[x-text]').should('have.text', 'initial');
    });
  });

  it('should ignore x-html', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-html="foo::html" x-ignore>initial</div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const Foo = cy.spy(() => {
        provide('html', '');
      });

      register('foo', Foo);
      observe(root);

      expect(Foo).to.be.calledOnce;

      cy.get('[x-html]').should('have.html', 'initial');
    });
  });

  it('should ignore x-alias', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-alias="foo::target" x-ignore>initial</div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp;

      const Foo = cy.spy(() => {
        tmp = provide('target');
      });

      register('foo', Foo);
      observe(root);

      expect(Foo).to.be.calledOnce;
      expect(tmp.get()).to.be.equal(undefined);
    });
  });

  it('should umount subtree when instruction was added later', () => {
    const markup = /*html*/ `
    <div x-controller="foo" x-text="foo::text">initial</div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp;

      const Foo = cy.spy(() => {
        tmp = provide('text', 'text');
      });

      register('foo', Foo);
      observe(root);

      expect(Foo).to.be.calledOnce;

      cy.get('[x-text]')
        .should('have.text', 'text')
        .invoke('attr', 'x-ignore', '');

      cy.wait(1);

      cy.get('[x-text]')
        .then((text) => {
          tmp.set('should be ignored');
        })
        .should('have.html', 'text');
    });
  });

  it('should not execute instructions when element was appended', () => {
    const markup = /*html*/ `<div x-ignore></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe } = relic;

      const Foo = cy.spy(() => {});

      register('foo', Foo);

      observe(root);

      cy.get('[x-ignore]').invoke('html', '<div x-controller="foo"></div>');

      cy.wait(1).then(() => {
        expect(Foo).to.not.be.called;
      });
    });
  });

  it('should not mount a controller if it was registered after initial mount', () => {
    const markup = /*html*/ `
      <div x-ignore><div x-controller="foo"></div></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe } = relic;

      const Foo = cy.spy(() => {});

      observe(root);

      register('foo', Foo);

      expect(Foo).to.not.be.called;
    });
  });
});
