describe('x-on instruction specification', () => {
  it('should add event listener', () => {
    const markup = /*html*/ `
    <div x-controller="controller" x-on:click="controller::click"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, provide } = relic;

      const spy = cy.spy(() => {});

      const Controller = () => {
        provide('click', spy);
      };

      register('controller', Controller);
      observe(root);

      expect(spy).to.not.be.called;

      cy.get('[x-controller]')
        .click({ force: true })
        .then(() => {
          expect(spy).to.be.calledOnce;
        });
    });
  });

  it('should update event listener', () => {
    const markup = /*html*/ `
    <div x-controller="controller" x-on:click="controller::click"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, provide } = relic;

      const spy = cy.spy(() => {});

      let tmp;

      const Controller = () => {
        tmp = provide('click', () => {});
      };

      register('controller', Controller);
      observe(root);

      expect(spy).to.not.be.called;

      cy.get('[x-controller]')
        .then(() => {
          tmp.set(spy);
        })
        .click({ force: true })
        .then(() => {
          expect(spy).to.be.calledOnce;
        });
    });
  });

  it('should remove event listener when instruction was remove', () => {
    const markup = /*html*/ `
    <div x-controller="controller" x-on:click="controller::click"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { register, observe, provide } = relic;

      const spy = cy.spy(() => {});

      const Controller = () => {
        provide('click', spy);
      };

      register('controller', Controller);
      observe(root);

      expect(spy).to.not.be.called;

      cy.get('[x-controller]')
        .click({ force: true })
        .then(() => {
          expect(spy).to.be.calledOnce;
        })
        .invoke('removeAttr', 'x-on:click');

      cy.wait(1);

      cy.get('[x-controller]')
        .click({ force: true })
        .then(() => {
          expect(spy).to.be.calledOnce;
        });
    });
  });

  describe('modifiers', () => {
    it('.prevent', () => {
      const markup = /*html*/ `
        <input 
          type="checkbox" 
          x-controller="foo" 
          x-on:click.prevent="foo::click"/>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        const spy = cy.spy(() => {});

        const Foo = () => {
          provide('click', spy);
        };

        register('foo', Foo);

        observe(root);

        expect(spy).to.not.be.called;

        cy.get('[x-controller]')
          .click()
          .then(($el) => {
            expect(spy).to.be.calledOnce;
            expect($el.get(0).checked).to.be.equal(false);
          });
      });
    });

    it('.stop', () => {
      const markup = /*html*/ `
        <div  x-controller="foo" x-on:click="foo::click">
          <div x-controller="baz" x-on:click.stop="baz::click"></div>
        </div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        const fooSpy = cy.spy(() => {});
        const bazSpy = cy.spy(() => {});

        const Foo = () => {
          provide('click', fooSpy);
        };

        const Baz = () => {
          provide('click', bazSpy);
        };

        register('foo', Foo);
        register('baz', Baz);

        observe(root);

        expect(fooSpy).to.not.be.called;
        expect(bazSpy).to.not.be.called;

        cy.get('[x-controller="baz"]')
          .click({ force: true })
          .then(($el) => {
            expect(fooSpy).to.not.be.called;
            expect(bazSpy).to.be.calledOnce;
          });
      });
    });

    it('.once', () => {
      const markup = /*html*/ `
        <div x-controller="foo" x-on:click.once="foo::click"></div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        const spy = cy.spy(() => {});

        const Foo = () => {
          provide('click', spy);
        };

        register('foo', Foo);

        observe(root);

        expect(spy).to.not.be.called;

        cy.get('[x-controller]')
          .click({ force: true })
          .click({ force: true })
          .then(() => {
            expect(spy).to.be.calledOnce;
          });
      });
    });

    it('.passive', () => {
      const markup = /*html*/ `
        <input 
          type="checkbox" 
          x-controller="foo" 
          x-on:click.passive="foo::click"/>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        const spy = cy.spy((e) => {
          e.preventDefault();
        });

        const Foo = () => {
          provide('click', spy);
        };

        register('foo', Foo);

        observe(root);

        expect(spy).to.not.be.called;

        cy.get('[x-controller]')
          .click()
          .then(($el) => {
            expect(spy).to.be.calledOnce;
            expect($el.get(0).checked).to.be.equal(true);
          });
      });
    });

    it('.capture', () => {
      const markup = /*html*/ `
        <div  x-controller="foo" x-on:click.capture="foo::click">
          <div x-controller="baz" x-on:click="baz::click"></div>
        </div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        const tmp = [];

        const Foo = () => {
          provide('click', () => {
            tmp.push('foo');
          });
        };

        const Baz = () => {
          provide('click', () => {
            tmp.push('baz');
          });
        };

        register('foo', Foo);
        register('baz', Baz);

        observe(root);

        cy.get('[x-controller="baz"]')
          .click({ force: true })
          .then(() => {
            expect(tmp).to.be.deep.equal(['foo', 'baz']);
          });
      });
    });

    it('.window', () => {
      const markup = /*html*/ `
        <div  x-controller="foo" x-on:custom-event.window="foo::window"></div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        let tmp = false;

        const Foo = () => {
          provide('window', () => {
            tmp = true;
          });
        };

        register('foo', Foo);
        observe(root);

        cy.window().then((window) => {
          expect(tmp).to.be.equal(false);
          window.dispatchEvent(new Event('custom-event'));
          expect(tmp).to.be.equal(true);
        });
      });
    });

    it('.document', () => {
      const markup = /*html*/ `
        <div  x-controller="foo" x-on:custom-event.document="foo::doc"></div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        let tmp = false;

        const Foo = () => {
          provide('doc', () => {
            tmp = true;
          });
        };

        register('foo', Foo);
        observe(root);

        cy.document().then((document) => {
          expect(tmp).to.be.equal(false);
          document.dispatchEvent(new Event('custom-event'));
          expect(tmp).to.be.equal(true);
        });
      });
    });

    it('.debounce', () => {
      const markup = /*html*/ `
        <div x-controller="foo" x-on:click.debounce.500="foo::click"></div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        const spy = cy.spy(() => {});

        const Foo = () => {
          provide('click', spy);
        };

        register('foo', Foo);

        observe(root);

        expect(spy).to.not.be.called;

        cy.get('[x-controller]')
          .click({ force: true })
          .then(() => {
            expect(spy).to.not.be.called;
          });

        cy.wait(100);

        cy.get('[x-controller]')
          .click({ force: true })
          .then(() => {
            expect(spy).to.not.be.called;
          });

        cy.wait(300).then(() => {
          expect(spy).to.not.be.called;
        });

        cy.wait(150).then(() => {
          expect(spy).to.be.calledOnce;
        });
      });
    });

    it('.throttle', () => {
      const markup = /*html*/ `
        <div x-controller="foo" x-on:click.throttle.100="foo::click"></div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        const spy = cy.spy(() => {});

        const Foo = () => {
          provide('click', spy);
        };

        register('foo', Foo);

        observe(root);

        expect(spy).to.not.be.called;

        cy.get('[x-controller]')
          .invoke('get', 0)
          .then((el) => {
            el.click();
            expect(spy).to.be.calledOnce;
            el.click();
            el.click();
            expect(spy).to.be.calledOnce;
          });

        cy.wait(150);

        cy.get('[x-controller]')
          .invoke('get', 0)
          .then((el) => {
            el.click();
            expect(spy).to.be.calledTwice;
            el.click();
            el.click();
            expect(spy).to.be.calledTwice;
          });
      });
    });

    it('.self', () => {
      const markup = /*html*/ `
        <div x-controller="foo" x-on:click.self="foo::click">
          <div x-nested></div>
        </div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        const spy = cy.spy(() => {});

        const Foo = () => {
          provide('click', spy);
        };

        register('foo', Foo);

        observe(root);

        expect(spy).to.not.be.called;

        cy.get('[x-nested]')
          .click({ force: true })
          .then(() => {
            expect(spy).to.not.be.called;
          });

        cy.get('[x-controller]')
          .click({ force: true })
          .then(() => {
            expect(spy).to.be.calledOnce;
          });
      });
    });

    it('.camel', () => {
      const markup = /*html*/ `
        <div x-controller="foo" x-on:custom-camel.camel="foo::custom"></div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { register, provide, observe } = relic;

        const spy = cy.spy(() => {});

        const Foo = () => {
          provide('custom', spy);
        };

        register('foo', Foo);

        observe(root);

        expect(spy).to.not.be.called;

        cy.get('[x-controller]')
          .invoke('get', 0)
          .then((el) => {
            el.dispatchEvent(new Event('customCamel'));
            expect(spy).to.be.calledOnce;
          });
      });
    });
  });
});
