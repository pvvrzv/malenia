describe('unmount hook specification', () => {
  it('should be called every time controller unmounts', () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, unmount } = relic;

      const spy = cy.spy(() => {});

      const Controller = () => {
        unmount(spy);
      };

      register('controller', Controller);
      observe(root);

      expect(spy).to.not.be.called;

      cy.get('[x-target]').invoke('removeAttr', 'x-controller');

      cy.wait(1);

      cy.get('[x-target]').then(() => {
        expect(spy).to.be.calledOnce;
      });

      cy.get('[x-target]').invoke('attr', 'x-controller', 'controller');

      cy.wait(1);

      cy.get('[x-target]').invoke('removeAttr', 'x-controller');

      cy.wait(1);

      cy.get('[x-target]').then(() => {
        expect(spy).to.be.calledTwice;
      });
    });
  });

  it('should be possible to call multiple times', () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, unmount } = relic;

      const spies = [cy.spy(() => {}), cy.spy(() => {})];

      const Controller = () => {
        unmount(spies[0]);
        unmount(spies[1]);
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-target]').invoke('removeAttr', 'x-controller');

      cy.wait(1);

      cy.get('[x-target]').then(() => {
        expect(spies[0]).to.be.calledOnce;
        expect(spies[1]).to.be.calledOnce;
      });

      cy.get('[x-target]').invoke('attr', 'x-controller', 'controller');

      cy.wait(1);

      cy.get('[x-target]').invoke('removeAttr', 'x-controller');

      cy.wait(1);

      cy.get('[x-target]').then(() => {
        expect(spies[0]).to.be.calledTwice;
        expect(spies[1]).to.be.calledTwice;
      });
    });
  });

  it('should be called once if opion.once was set to true', () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, unmount } = relic;

      const spy = cy.spy(() => {});

      const Controller = () => {
        unmount(spy, { once: true });
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-target]').invoke('removeAttr', 'x-controller');

      cy.wait(1);

      cy.get('[x-target]').then(() => {
        expect(spy).to.be.calledOnce;
      });

      cy.get('[x-target]').invoke('attr', 'x-controller', 'controller');

      cy.wait(1);

      cy.get('[x-target]').invoke('removeAttr', 'x-controller');

      cy.wait(1);

      cy.get('[x-target]').then(() => {
        expect(spy).to.be.calledOnce;
      });
    });
  });

  it('should not unmount already unmounted element', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-controller="baz">
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, unmount } = relic;

      const fooSpy = cy.spy(() => {});
      const bazSpy = cy.spy(() => {});

      const Foo = () => {
        unmount(fooSpy);
      };

      const Baz = () => {
        unmount(bazSpy);
      };

      register('foo', Foo);
      register('baz', Baz);

      observe(root);

      expect(bazSpy).to.not.be.called;
      expect(fooSpy).to.not.be.called;

      cy.get('[x-controller="foo"]').then(($foo) => {
        cy.get('[x-controller="baz"]').then(($baz) => {
          $foo.remove();
          $baz.remove();
        });
      });

      cy.wait(1).then(() => {
        expect(bazSpy).to.be.calledOnce;
        expect(fooSpy).to.be.calledOnce;
      });
    });
  });

  it('should not unmount if an element is still connected', () => {
    const markup = /*html*/ `
      <div x-controller="foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, unmount } = relic;

      const fooSpy = cy.spy(() => {});

      const Foo = () => {
        unmount(fooSpy);
      };

      register('foo', Foo);

      observe(root);

      expect(fooSpy).to.not.be.called;

      cy.get('[x-controller="foo"]')
        .invoke('get')
        .then((foo) => {
          const element = foo[0];
          const parent = element.parentElement;
          element.remove();
          parent.append(element);
        });

      cy.wait(1).then(() => {
        expect(fooSpy).to.not.be.called;
      });
    });
  });

  it('should be possible to use other lifecycle hooks from inside unmount', () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, mount, unmount } = relic;

      const spy = cy.spy(() => {});

      const Controller = () => {
        unmount(() => {
          mount(spy);
        });
      };

      register('controller', Controller);

      observe(root);
      expect(spy).to.not.be.called;

      cy.get('[x-target]').invoke('removeAttr', 'x-controller').wait(1);

      cy.get('[x-target]')
        .invoke('attr', 'x-controller', 'controller')
        .wait(1)
        .then(() => {
          expect(spy).to.be.calledOnce;
        });
    });
  });

  it('should run synchronously', () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, unmount, effect, signal, proxy, group } =
        relic;

      const Controller = () => {
        unmount(() => {
          const foo = signal(1);
          const baz = proxy({});

          let tmp_a, tmp_b;

          effect(() => (tmp_a = foo.get()));
          effect(() => (tmp_b = baz.dir));

          expect(tmp_a).to.be.equal(1);
          expect(tmp_b).to.be.equal(undefined);

          foo.set(2);
          baz.dir = 3;

          expect(tmp_a).to.be.equal(2);
          expect(tmp_b).to.be.equal(3);

          group(() => {
            foo.set(4);
            baz.dir = 4;

            expect(tmp_a).to.be.equal(2);
            expect(tmp_b).to.be.equal(3);
          });

          expect(tmp_a).to.be.equal(4);
          expect(tmp_b).to.be.equal(4);
        });
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').invoke('remove');
    });
  });

  it('should not run on another mutation if an error was thrown', () => {
    const markup = /*html*/ `<div x-target x-controller="foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, unmount, force } = relic;

      const fooSpy = cy.spy(() => {
        throw new Error('');
      });

      const Foo = () => {
        unmount(fooSpy);
      };

      register('foo', Foo);
      observe(root);

      expect(fooSpy).to.not.be.called;

      cy.get('[x-target]')
        .invoke('get', 0)
        .then((el) => {
          el.removeAttribute('x-controller');
          expect(() => force()).to.throw();
          expect(fooSpy).to.be.calledOnce;
        });

      cy.get('[x-target]').invoke('attr', 'x-alias', 'baz::dir');

      cy.wait(1).then(() => {
        expect(fooSpy).to.be.calledOnce;
      });
    });
  });

  it('should not unmount if an element was added in the same iteration and is not connected', () => {
    const markup = /*html*/ `<div x-target></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, unmount } = relic;

      const fooSpy = cy.spy(() => {});

      const Foo = () => {
        unmount(fooSpy);
      };

      register('foo', Foo);

      observe(root);

      expect(fooSpy).not.to.be.called;

      cy.get('[x-target]')
        .invoke('get')
        .then((foo) => {
          const target = foo[0];
          const element = document.createElement('div');
          element.setAttribute('x-controller', 'foo');
          target.append(element);
          element.remove();
          target.append(element);
          element.remove();
          target.append(element);
          element.remove();
        });

      cy.wait(1).then(() => {
        expect(fooSpy).to.not.be.called;
      });
    });
  });

  it('should be called only after all elements with an alias have been disconnected', () => {
    const markup = /*html*/ `
      <div x-controller="foo">
        <div x-alias="foo::a1"></div>
        <div x-alias="foo::a1"></div>
        <div>
          <div x-alias="foo::a2"></div>
        </div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, unmount, provide, disconnect } = relic;

      const Foo = () => {
        const a1 = provide('a1', []);
        const a2 = provide('a2');

        unmount(() => {
          expect(a1.get().length).to.equal(0);
          expect(a2.get()).to.equal(undefined);
        });
      };

      register('foo', Foo);

      observe(root);

      disconnect(root);
    });
  });
});
