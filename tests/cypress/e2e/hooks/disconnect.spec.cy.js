describe('disconnect hook specification', () => {
  it('should be possible to disconnect an element', () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, disconnect, register, mount, unmount } = relic;

      const mountSpy = cy.spy(() => {});
      const unmountSpy = cy.spy(() => {});

      const Controller = () => {
        mount(mountSpy);
        unmount(unmountSpy);
      };

      register('controller', Controller);

      cy.get('[x-controller]').then((el) => {
        observe(el.get(0));
        expect(unmountSpy).to.not.be.called;
        expect(mountSpy).to.be.calledOnce;
      });

      cy.get('[x-controller]').then((el) => {
        disconnect(el.get(0));
        expect(unmountSpy).to.be.calledOnce;
        expect(mountSpy).to.be.calledOnce;
      });
    });
  });

  it('should not be possible to non-observed element', () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { disconnect } = relic;

      cy.get('[x-controller]').then((el) => {
        expect(() => disconnect(el.get(0))).to.throw;
      });
    });
  });

  it('should not be possible to disconnect in active state', () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { disconnect, observe, register } = relic;

      const Controller = ({ root }) => {
        expect(() => disconnect(root)).to.throw;
      };

      register('controller', Controller);
      observe(root);
    });
  });

  it('should not be possible to disconnect non Element', () => {
    const markup = /*html*/ ``;

    cy.mount(markup).then(({ root, relic }) => {
      const { disconnect } = relic;

      expect(() => disconnect(null)).to.throw;
      expect(() => disconnect(false)).to.throw;
      expect(() => disconnect()).to.throw;
      expect(() => disconnect({})).to.throw;
      expect(() => disconnect(() => {})).to.throw;
    });
  });

  it('should process mutation before disconnecting', () => {
    const markup = /*html*/ `
      <div x-controller="controller">
        <div x-target></div>
     </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { disconnect, provide, observe, register, effect } = relic;

      let tmp = [];

      const Controller = ({ root }) => {
        const foo = provide('foo');

        effect(() => tmp.push(foo.get()));
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-target]').then(($el) => {
        $el.attr('x-alias', 'controller::foo');

        assert.deepEqual(tmp, [undefined]);
        disconnect(root);
        assert.deepEqual(tmp,[undefined, $el.get(0), undefined]);
      });
    });
  });
});
