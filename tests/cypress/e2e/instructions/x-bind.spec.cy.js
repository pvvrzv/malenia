describe('x-bind instruction specification', () => {
  it('should set initial value', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-bind:data-foo="controller::foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const Controller = () => {
        provide('foo', 12);
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').should('have.attr', 'data-foo', '12');
    });
  });

  it('should set initial value', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-bind:data-foo="controller::foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const Controller = () => {
        provide('foo', 'initial');
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').should('have.attr', 'data-foo', 'initial');
    });
  });

  describe('should not set or remove attribute with falsy value', () => {
    it('value equals false', () => {
      const markup = /*html*/ `
        <div x-controller="controller" x-bind:data-foo="controller::foo">
        </div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        const Controller = () => {
          provide('foo', false);
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-controller]').should('not.have.attr', 'data-foo');
      });
    });

    it('value equals undefined', () => {
      const markup = /*html*/ `
        <div x-controller="controller" x-bind:data-foo="controller::foo">
        </div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        const Controller = () => {
          provide('foo', undefined);
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-controller]').should('not.have.attr', 'data-foo');
      });
    });

    it('value equals an empty string', () => {
      const markup = /*html*/ `
        <div x-controller="controller" x-bind:data-foo="controller::foo">
        </div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        const Controller = () => {
          provide('foo', '');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-controller]').should('not.have.attr', 'data-foo');
      });
    });
  });

  it('shold use new signal when instruction value was updated', () => {
    const markup = /*html*/ `
        <div x-controller="controller" x-bind:data-dir="controller::foo">
        </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const Controller = () => {
        provide('foo', 'foo');
        provide('baz', 'baz');
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]')
        .should('have.attr', 'data-dir', 'foo')
        .invoke('attr', 'x-bind:data-dir', 'controller::baz');

      cy.wait(1);

      cy.get('[x-controller]').should('have.attr', 'data-dir', 'baz');
    });
  });

  it('should allow for multiple instructions on the same element', () => {
    const markup = /*html*/ `
      <div  x-controller="controller"
            x-bind:data-foo="controller::foo"
            x-bind:data-baz="controller::baz">
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const Controller = () => {
        provide('foo', 12);
        provide('baz', 15);
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]')
        .should('have.attr', 'data-foo', '12')
        .should('have.attr', 'data-baz', '15');
    });
  });

  it('should be able to update value', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-bind:data-foo="controller::foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp;

      const Controller = () => {
        tmp = provide('foo', 12);
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]')
        .should('have.attr', 'data-foo', '12')
        .then(() => {
          tmp.set('updated value');
        })
        .should('have.attr', 'data-foo', 'updated value');
    });
  });

  it('should be able to update value for multiple instructions on the same element', () => {
    const markup = /*html*/ `
      <div  x-controller="controller"
            x-bind:data-foo="controller::foo"
            x-bind:data-baz="controller::baz">
      </div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const tmp = {
        foo: undefined,
        baz: undefined,
      };

      const Controller = () => {
        tmp.foo = provide('foo', 12);
        tmp.baz = provide('baz', 15);
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]')
        .should('have.attr', 'data-foo', '12')
        .should('have.attr', 'data-baz', '15')
        .then(() => {
          tmp.foo.set('updated foo');
          tmp.baz.set('updated baz');
        })
        .should('have.attr', 'data-foo', 'updated foo')
        .should('have.attr', 'data-baz', 'updated baz');
    });
  });

  it('should handle class attribute', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-bind:class="controller::foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, clx } = relic;

      const template = [{ baz: true, bar: Symbol() }, 'foo'];

      const Controller = () => {
        provide('foo', template);
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').should('have.attr', 'class', clx(template));
    });
  });

  it('should react to deep mutations when proxy is used for class attribute', () => {
    const markup = /*html*/ `
    <div x-controller="controller" x-bind:class="controller::foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, clx, proxy } = relic;

      const template = proxy([{ baz: true, bar: Symbol() }, 'foo']);

      const Controller = () => {
        provide('foo', template);
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]')
        .should('have.attr', 'class', clx(template))
        .then(() => {
          template[2] = 'dir';

          cy.get('[x-controller]').should('have.attr', 'class', clx(template));
        });
    });
  });

  it('should handle style attribute', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-bind:style="controller::foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, slx } = relic;

      const template = [
        { '--variableCamel': 12, fontSize: '12px' },
        'line-height: 1em',
      ];

      const Controller = () => {
        provide('foo', template);
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').should('have.attr', 'style', slx(template));
    });
  });

  it('should react to deep mutations when proxy is used for style attribute', () => {
    const markup = /*html*/ `
    <div x-controller="controller" x-bind:style="controller::foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide, slx, proxy } = relic;

      const template = proxy([
        { '--variableCamel': 12, fontSize: '12px' },
        'line-height: 1em',
      ]);

      const Controller = () => {
        provide('foo', template);
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]')
        .should('have.attr', 'style', slx(template))
        .then(() => {
          template[2] = 'background: transparent';

          cy.get('[x-controller]').should('have.attr', 'style', slx(template));
        });
    });
  });

  it('should react to instruction value mutation', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-bind:data-foo="controller::foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const tmp = {
        foo: undefined,
        baz: undefined,
      };

      const Controller = () => {
        tmp.foo = provide('foo', 'foo');
        tmp.baz = provide('baz', 'baz');
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]')
        .should('have.attr', 'data-foo', 'foo')
        .invoke('attr', 'x-bind:data-foo', 'controller::baz')
        .should('have.attr', 'data-foo', 'baz');
    });
  });

  it('should remove attribute when instruction removed', () => {
    const markup = /*html*/ `
      <div x-controller="controller" x-bind:data-foo="controller::foo"></div>`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      const Controller = () => {
        provide('foo', 12);
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]')
        .should('have.attr', 'data-foo', '12')
        .invoke('removeAttr', 'x-bind:data-foo');

      cy.wait(1);

      cy.get('[x-controller]').should('not.have.attr', 'data-foo');
    });
  });

  describe('modifiers', () => {
    it('.camel', () => {
      const markup = /*html*/ `
      <svg 
          x-controller="controller" 
          x-bind:view-box.camel="controller::foo">
      </svg>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        const Controller = () => {
          provide('foo', '1 1 1 1');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-controller]').should('have.attr', 'viewBox', '1 1 1 1');
      });
    });

    describe('.preserve', () => {
      it('should preserve initial value', () => {
        const markup = /*html*/ `
          <div 
            data-foo="initial"
            x-controller="controller"
            x-bind:data-foo.preserve="controller::foo">
          </div>`;

        cy.mount(markup).then(({ root, relic }) => {
          const { observe, register, provide } = relic;

          let tmp;

          const Controller = () => {
            tmp = provide('foo', 'foo');
          };

          register('controller', Controller);
          observe(root);

          cy.get('[x-controller]')
            .should('have.attr', 'data-foo', 'initial foo')
            .then(() => {
              tmp.set('baz');
            })
            .should('have.attr', 'data-foo', 'initial baz')
            .then(() => {
              tmp.set('');
            })
            .should('have.attr', 'data-foo', 'initial');
        });
      });

      it('should preserve an empty string', () => {
        const markup = /*html*/ `
          <div 
            data-foo
            x-controller="controller"
            x-bind:data-foo.preserve="controller::foo">
          </div>`;

        cy.mount(markup).then(({ root, relic }) => {
          const { observe, register, provide } = relic;

          let tmp;

          const Controller = () => {
            tmp = provide('foo', 'foo');
          };

          register('controller', Controller);
          observe(root);

          cy.get('[x-controller]')
            .should('have.attr', 'data-foo', 'foo')
            .then(() => {
              tmp.set(false);
            })
            .should('have.attr', 'data-foo', '');
        });
      });

      it('should reset attribute when instruction removed', () => {
        const markup = /*html*/ `
        <div 
          data-foo="initial"
          x-controller="controller"
          x-bind:data-foo.preserve="controller::foo">
        </div>`;

        cy.mount(markup).then(({ root, relic }) => {
          const { observe, register, provide } = relic;

          const Controller = () => {
            provide('foo', 'foo');
          };

          register('controller', Controller);
          observe(root);

          cy.get('[x-controller]').should(
            'have.attr',
            'data-foo',
            'initial foo'
          );

          cy.get('[x-controller]').invoke(
            'removeAttr',
            'x-bind:data-foo.preserve'
          );

          cy.wait(1);

          cy.get('[x-controller]').should('have.attr', 'data-foo', 'initial');
        });
      });

      it('shold use new signal when instruction value was updated', () => {
        const markup = /*html*/ `
            <div 
              data-dir="initial"
              x-controller="controller"
              x-bind:data-dir.preserve="controller::foo">
            </div>`;

        cy.mount(markup).then(({ root, relic }) => {
          const { observe, register, provide } = relic;

          const Controller = () => {
            provide('foo', 'foo');
            provide('baz', 'baz');
          };

          register('controller', Controller);
          observe(root);

          cy.get('[x-controller]')
            .should('have.attr', 'data-dir', 'initial foo')
            .invoke('attr', 'x-bind:data-dir.preserve', 'controller::baz');

          cy.wait(1);

          cy.get('[x-controller]').should(
            'have.attr',
            'data-dir',
            'initial baz'
          );
        });
      });

      it('shold keep attribute is initial value was an empty string', () => {
        const markup = /*html*/ `
            <div 
              data-foo
              x-controller="controller"
              x-bind:data-foo.preserve="controller::foo">
            </div>`;

        cy.mount(markup).then(({ root, relic }) => {
          const { observe, register, provide } = relic;

          const Controller = () => {
            provide('foo', 'foo');
          };

          register('controller', Controller);
          observe(root);

          cy.get('[x-controller]')
            .should('have.attr', 'data-foo', 'foo')
            .invoke('removeAttr', 'x-bind:data-foo.preserve');

          cy.wait(1);

          cy.get('[x-controller]').should('have.attr', 'data-foo', '');
        });
      });
    });
  });
});
