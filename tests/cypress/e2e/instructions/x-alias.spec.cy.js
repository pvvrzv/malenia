describe('x-alias instruction spec', () => {
  it('must connect to the closest ancestor controller', () => {
    const markup = /*html*/ `
      <div x-controller="controller">
        <div x-target x-controller="controller">
          <div x-controller="controller" x-alias="controller::target"></div>
        </div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, provide, effect } = relic;

      const tmp = {
        root: null,
        target: null,
      };

      const Controller = ({ root }) => {
        const signal = provide('target');

        effect(() => {
          tmp.root = root;
          tmp.target = signal.get();
        });
      };

      register('controller', Controller);

      observe(root);

      cy.get('[x-alias]').invoke('get', 0).should('equal', tmp.target);
      cy.get('[x-target]').invoke('get', 0).should('equal', tmp.root);
    });
  });

  it('should connect only once when instruction value is repeated', () => {
    const markup = /*html*/ `
      <div x-controller="controller">
        <div x-alias="controller::target controller::target"></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, effect } = relic;

      const spy = cy.spy(() => {});
      const Controller = cy.spy(() => {
        const target = provide('target');

        effect(() => (target.get(), spy()));
      });

      register('controller', Controller);
      observe(root);

      expect(Controller).to.be.calledOnce;
      expect(spy).to.be.calledTwice;
    });
  });

  it("don't throw an error on an empty instruction value", () => {
    const markup = /*html*/ `
      <div x-controller="controller">
        <div x-alias="  "></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { start } = relic;

      expect(() => start()).not.to.throw;
    });
  });

  it('should disconnect when instruction is removed', () => {
    const markup = /*html*/ `
      <div x-controller="controller">
        <div x-target x-alias="controller::target"></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, effect } = relic;

      let tmp = undefined;
      const spy = cy.spy(() => {});

      const Controller = cy.spy(() => {
        const target = provide('target');

        effect(() => ((tmp = target.get()), spy()));
      });

      register('controller', Controller);
      observe(root);

      expect(spy).to.be.calledTwice;

      cy.get('[x-target]').invoke('get', 0).should('equal', tmp);

      cy.get('[x-target]').invoke('removeAttr', 'x-alias');

      cy.wait(1);

      cy.get('[x-target]').then(() => {
        expect(spy).to.be.calledThrice;
        expect(tmp).to.equal(undefined);
      });
    });
  });

  it('should update on instruction mutation', () => {
    const markup = /*html*/ `
    <div x-controller="foo baz">
      <div x-alias="foo::target"></div>
    </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, effect } = relic;

      const tmp = {
        foo: undefined,
        baz: undefined,
      };

      const Foo = ({ root }) => {
        const target = provide('target');
        effect(() => (tmp.foo = target.get()));
      };

      const Baz = ({ root }) => {
        const target = provide('target');
        effect(() => (tmp.baz = target.get()));
      };

      register('foo', Foo);
      register('baz', Baz);

      observe(root);

      expect(tmp.baz).to.be.equal(undefined);

      cy.get('[x-alias]').invoke('get', 0).should('equal', tmp.foo);

      cy.get('[x-alias]').invoke('attr', 'x-alias', 'baz::target');

      cy.wait(1);

      cy.get('[x-alias]').then(() => {
        expect(tmp.foo).to.be.equal(undefined);
        cy.get('[x-alias]').invoke('get', 0).should('equal', tmp.baz);
      });
    });
  });

  it('should disconnect when controller unmounts', () => {
    const markup = /*html*/ `
    <div x-target x-controller="controller">
      <div x-alias="controller::target"></div>
    </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, effect } = relic;

      let tmp = undefined;

      const Controller = () => {
        const target = provide('target');

        effect(() => (tmp = target.get()));
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-alias]').invoke('get', 0).should('equal', tmp);

      cy.get('[x-controller]').invoke('removeAttr', 'x-controller');

      cy.wait(1);

      cy.get('[x-target]').then(() => {
        expect(tmp).to.be.equal(undefined);
      });
    });
  });

  it('should not be affected by unrelated mutations', () => {
    const markup = /*html*/ `
    <div x-controller="controller">
      <div x-alias="controller::foo">
        <div x-alias="controller::baz"></div>
      </div>
    </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, effect } = relic;

      let tmp = {
        foo: undefined,
        baz: undefined,
      };

      const Controller = () => {
        const foo = provide('foo');
        const baz = provide('baz');

        effect(() => (tmp.foo = foo.get()));
        effect(() => (tmp.baz = baz.get()));
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-alias$="foo"]').invoke('get', 0).should('equal', tmp.foo);
      cy.get('[x-alias$="baz"]').invoke('get', 0).should('equal', tmp.baz);

      cy.get('[x-alias$="baz"]').invoke('removeAttr', 'x-alias');

      cy.wait(1);

      cy.get('[x-alias$="foo"]')
        .then(() => {
          expect(tmp.baz).to.be.equal(undefined);
        })
        .invoke('get', 0)
        .should('equal', tmp.foo);
    });
  });

  it('should connect only the first element if non array signal is used', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, observe } = relic;

      let tmp;

      const Foo = () => {
        tmp = provide('baz');
      };

      register('foo', Foo);

      observe(root);

      cy.get('[x-alias="foo::baz"]').then(($el) => {
        expect(tmp.get()).to.be.equal($el.get(0));
      });
    });
  });

  it('should trigger an effect only for the first alias', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, observe, effect } = relic;

      let tmp;

      const spy = cy.spy(() => tmp.get());

      const Foo = () => {
        tmp = provide('baz');

        effect(spy);
      };

      register('foo', Foo);

      observe(root);

      expect(spy).to.be.calledTwice;

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 3)
        .then(($el) => {
          $el.get(2).remove();
        });

      cy.wait(1);

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 2)
        .then(($el) => {
          expect(tmp.get()).to.be.equal($el.get(0));
          expect(spy).to.be.calledTwice;
        });
    });
  });

  it('should disconnect an element only if it is currently connected', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, observe } = relic;

      let tmp;

      const Foo = () => {
        tmp = provide('baz');
      };

      register('foo', Foo);

      observe(root);

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 3)
        .then(($el) => {
          expect(tmp.get()).to.be.equal($el.get(0));
          $el.get(0).remove();
        });

      cy.wait(1);

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 2)
        .then(($el) => {
          expect(tmp.get()).to.be.equal($el.get(0));
          $el.get(0).remove();
        });

      cy.wait(1);

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 1)
        .then(($el) => {
          expect(tmp.get()).to.be.equal($el.get(0));
        });
    });
  });

  it('should connect the next element in the queue only if it is still valid', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, observe } = relic;

      let tmp;

      const Foo = () => {
        tmp = provide('baz');
      };

      register('foo', Foo);

      observe(root);

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 3)
        .then(($el) => {
          expect(tmp.get()).to.be.equal($el.get(0));
          $el.get(1).removeAttribute('x-alias');
          $el.get(0).remove();
        });

      cy.wait(1);

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 1)
        .then(($el) => {
          expect(tmp.get()).to.be.equal($el.get(0));
        });
    });
  });

  it('should connect all elements if signal value is an array', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, effect, observe } = relic;

      let tmp;

      const spy = cy.spy(() => tmp.get());

      const Foo = () => {
        tmp = provide('baz', []);

        effect(spy);
      };

      register('foo', Foo);

      observe(root);

      expect(spy).to.be.calledTwice;

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 3)
        .then(($el) => {
          expect(tmp.get()).to.be.deep.equal([
            $el.get(0),
            $el.get(1),
            $el.get(2),
          ]);

          $el.get(1).remove();
        });

      cy.wait(1);

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 2)
        .then(($el) => {
          expect(tmp.get()).to.be.deep.equal([$el.get(0), $el.get(1)]);
          expect(spy).to.be.calledThrice;
        });
    });
  });

  it('should not raplace an array if it was passet to a signal', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, observe } = relic;

      const raw = [];
      let tmp;

      const Foo = () => {
        tmp = provide('baz', raw);
      };

      register('foo', Foo);

      observe(root);

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 3)
        .then(($el) => {
          expect(tmp.get()).to.be.equal(raw);

          $el.get(1).remove();
        });

      cy.wait(1);

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 2)
        .then(($el) => {
          expect(tmp.get()).to.be.equal(raw);
        });
    });
  });

  it('if proxy is used it should be triggered only once', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
        <div x-alias="foo::baz"></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, proxy, effect, observe } = relic;

      let tmp;

      const spy = cy.spy(() => tmp.get()[2]);

      const Foo = () => {
        tmp = provide('baz', proxy([]));

        effect(spy);
      };

      register('foo', Foo);

      observe(root);

      expect(spy).to.be.calledTwice;

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 3)
        .then(($el) => {
          $el.get(1).remove();
        });

      cy.wait(1);

      cy.get('[x-alias="foo::baz"]')
        .should('have.length', 2)
        .then(($el) => {
          expect(spy).to.be.calledThrice;
        });
    });
  });
});
