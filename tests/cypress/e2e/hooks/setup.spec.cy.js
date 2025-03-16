describe('setup hook specification', () => {
  it('should be called after all instructions were parsed', () => {
    const markup = /*html*/ `
      <div x-controller="controller">
        <div x-alias="controller::foo"></div>
        <input x-model="controller::baz" value="initial"/>
        <div x-html="controller::dir"></div>
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, observe, setup } = relic;

      const Controller = () => {
        const foo = provide('foo');
        const baz = provide('baz');
        const dir = provide('dir', 'dir');

        setup(() => {
          cy.get('[x-alias]')
            .invoke('get', 0)
            .then((el) => {
              expect(foo.get()).to.be.equal(el);
            });

          expect(baz.get()).to.be.equal('initial');

          cy.get('[x-html]').then(($el) => {
            expect($el.html()).to.be.equal('dir');
          });
        });
      };

      register('controller', Controller);
      observe(root);
    });
  });

  it('should not invoke setup if an element was removed in the same iteration and is not connected', () => {
    const markup = /*html*/ `<div x-target></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, setup } = relic;

      const fooSpy = cy.spy(() => {});

      const Foo = () => {
        setup(fooSpy);
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

  it('should not run on another mutation if an error was thrown', () => {
    const markup = /*html*/ `<div x-controller="foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, setup } = relic;

      const fooSpy = cy.spy(() => {
        throw new Error('');
      });

      const Foo = () => {
        setup(fooSpy);
      };

      register('foo', Foo);
      expect(() => observe(root)).to.throw();

      expect(fooSpy).to.be.calledOnce;

      cy.get('[x-controller="foo"]').invoke('attr', 'x-alias', 'baz::dir');

      cy.wait(1).then(() => {
        expect(fooSpy).to.be.calledOnce;
      });
    });
  });

  it('should be possible to register multiple callbacks', () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, observe, setup } = relic;

      const spies = [cy.spy(() => {}), cy.spy(() => {})];

      const Controller = () => {
        for (const spy of spies) {
          setup(spy);
        }
      };

      register('controller', Controller);
      observe(root);

      for (const spy of spies) {
        expect(spy).to.be.calledOnce;
      }
    });
  });

  it('should not call callback after initialization phase', () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, provide, observe, setup, mount } = relic;

      const setupSpy = cy.spy(() => {});
      const mountSpy = cy.spy(() => {});

      const Controller = () => {
        setup(setupSpy);
        mount(mountSpy);
      };

      register('controller', Controller);
      observe(root);

      expect(setupSpy).to.be.calledOnce;
      expect(mountSpy).to.be.calledOnce;

      cy.get('[x-target]').invoke('removeAttr', 'x-controller');

      cy.wait(1);

      cy.get('[x-target]').invoke('attr', 'x-controller', 'controller');

      cy.wait(1);

      cy.get('[x-target]').then(() => {
        expect(setupSpy).to.be.calledOnce;
        expect(mountSpy).to.be.calledTwice;
      });
    });
  });

  it('should be possible to use other lifecycle hooks from inside setup', () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, setup, mount, unmount } = relic;

      const mountSpy = cy.spy(() => {});
      const unmountSpy = cy.spy(() => {});

      const Controller = () => {
        setup(() => {
          mount(mountSpy);
          unmount(unmountSpy);
        });
      };

      register('controller', Controller);

      observe(root);
      expect(mountSpy).to.be.calledOnce;
      expect(unmountSpy).to.not.be.called;

      cy.get('[x-target]')
        .invoke('removeAttr', 'x-controller')
        .wait(1)
        .then(() => {
          expect(mountSpy).to.be.calledOnce;
          expect(unmountSpy).to.be.calledOnce;
        });
    });
  });

  it('should run synchronously', () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, setup, effect, signal, proxy, group } = relic;

      const Controller = () => {
        setup(() => {
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
    });
  });
});
