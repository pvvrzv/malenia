describe('observe hook specification', () => {
  it('should not be possible to observe nested elements', () => {
    const markup = /*html*/ `<div x-outer><div x-inner></div></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe } = relic;

      cy.get('[x-outer]').then((el) => {
        expect(() => observe(el.get(0))).not.to.throw;
      });

      cy.get('[x-inner]').then((el) => {
        expect(() => observe(el.get(0))).to.throw;
      });
    });
  });

  it('should not be possible to observe observe non Element', () => {
    const markup = /*html*/ ``;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe } = relic;

      expect(() => observe(null)).to.throw;
      expect(() => observe(false)).to.throw;
      expect(() => observe()).to.throw;
      expect(() => observe({})).to.throw;
      expect(() => observe(() => {})).to.throw;
    });
  });

  it('should be possible to observe multiple elements', () => {
    const markup = /*html*/ `
      <div x-controller="foo"></div>
      <div x-controller="baz"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register } = relic;

      const Foo = cy.spy(() => {});
      const Baz = cy.spy(() => {});

      register('foo', Foo);
      register('baz', Baz);

      cy.get('[x-controller="foo"]').then((el) => {
        expect(() => observe(el.get(0))).not.to.throw;
      });

      cy.get('[x-controller="baz"]').then((el) => {
        expect(() => observe(el.get(0))).not.to.throw;
      });
    });
  });

  it('should not be possible to call in active state', () => {
    const markup = /*html*/ `
      <div x-controller="controller"></div>
      <div x-alias="other::alias"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register } = relic;

      const Controller = () => {
        expect(() => observe(root.querySelector('[x-alias]'))).to.throw;
      };

      register('controller', Controller);
      observe(root.querySelector('[x-controller]'));
    });
  });

  it('should not be possible to call with ancester of an observed root', () => {
    const markup = /*html*/ `
      <div x-controller="outer"><div x-controller="inner"></div></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register } = relic;

      const Controller = () => {};

      register('controller', Controller);

      const inner = root.querySelector('[x-controller="inner"]');
      const outer = root.querySelector('[x-controller="outer"]');

      observe(inner);
      expect(() => observe(outer)).to.be.throw;
    });
  });

  it('should process mutation before observing', () => {
    const markup = /*html*/ `
      <div x-controller="controller"><div x-target></div></div>
      <div x-controller="baz"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { disconnect, provide, observe, register, effect } = relic;

      let tmp;

      const Controller = ({ root }) => {
        tmp = provide('foo');
      };

      register('controller', Controller);
      observe(root.querySelector('[x-controller="controller"]'));

      cy.get('[x-target]').then(($el) => {
        $el.attr('x-alias', 'controller::foo');

        expect(tmp.get()).to.be.equal(undefined);
        observe(root.querySelector('[x-controller="baz"]'));
        expect(tmp.get()).to.be.equal($el.get(0));
      });
    });
  });
});
