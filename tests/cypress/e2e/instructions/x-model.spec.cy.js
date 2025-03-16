describe('x-model instruction specification', () => {
  it('should set initial value of an input', () => {
    const markup = /*html*/ `
    <input
     value="initial"
     x-controller="controller"
     x-model="controller::foo" />`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp;

      const Controller = () => {
        tmp = provide('foo');
      };

      register('controller', Controller);
      observe(root);

      expect(tmp.get()).to.be.equal('initial');
    });
  });

  it('should not update after instruction was removed', () => {
    const markup = /*html*/ `
    <input
     value="initial"
     x-controller="controller"
     x-model="controller::foo" />`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp;

      const Controller = () => {
        tmp = provide('foo');
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').invoke('removeAttr', 'x-model');
      cy.get('[x-controller]')
        .type('update')
        .then(() => {
          expect(tmp.get()).to.be.equal('initial');
        });
    });
  });

  it('should update listener after instruction was mutated', () => {
    const markup = /*html*/ `
    <input
     value="initial"
     x-controller="controller"
     x-model="controller::foo controller::baz" />`;

    cy.mount(markup).then(({ root, relic }) => {
      const { observe, register, provide } = relic;

      let tmp = {
        foo: undefined,
        baz: undefined,
      };

      const Controller = () => {
        tmp.foo = provide('foo');
        tmp.baz = provide('baz');
      };

      register('controller', Controller);
      observe(root);

      cy.get('[x-controller]').invoke('attr', 'x-model', 'controller::foo');
      cy.get('[x-controller]')
        .type('_update')
        .then(() => {
          expect(tmp.foo.get()).to.be.equal('initial_update');
          expect(tmp.baz.get()).to.be.equal('initial');
        });
    });
  });

  describe('should update values for different input types', () => {
    it('should update for text', () => {
      const markup = /*html*/ `
      <input
        type="text"
        x-controller="controller"
        x-model="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-model]')
          .type('updated')
          .then(() => {
            expect(tmp.get()).to.be.equal('updated');
          });
      });
    });

    it('should update for email', () => {
      const markup = /*html*/ `
      <input
        type="email"
        x-controller="controller"
        x-model="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-model]')
          .type('test@example.com')
          .then(() => {
            expect(tmp.get()).to.be.equal('test@example.com');
          });
      });
    });

    it('should update for password', () => {
      const markup = /*html*/ `
      <input
        type="password"
        x-controller="controller"
        x-model="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-model]')
          .type('secret')
          .then(() => {
            expect(tmp.get()).to.be.equal('secret');
          });
      });
    });

    it('should update for color', () => {
      const markup = /*html*/ `
      <input
        type="color"
        x-controller="controller"
        x-model="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-model]').invoke('val', '#f1f2f3').trigger('change');

        cy.get('[x-model]').then(() => {
          expect(tmp.get()).to.be.equal('#f1f2f3');
        });
      });
    });

    describe('should update for checkbox', () => {
      it('with multiple inputs with an array target', () => {
        const markup = /*html*/ `
        <div x-controller="controller">
          <input value="first" type="checkbox" x-model="controller::foo" />
          <input value="second" type="checkbox" x-model="controller::foo" />
          <input value="third" type="checkbox" x-model="controller::foo" />
        </div>
        `;

        cy.mount(markup).then(({ root, relic }) => {
          const { observe, register, provide } = relic;

          let tmp;

          const Controller = () => {
            tmp = provide('foo', []);
          };

          register('controller', Controller);
          observe(root);

          cy.get('[value="first"]')
            .click()
            .then(() => {
              assert.deepEqual(tmp.get(), ['first']);
            });

          cy.get('[value="third"]')
            .click()
            .then(() => {
              assert.deepEqual(tmp.get(), ['first', 'third']);
            });

          cy.get('[value="first"]')
            .click()
            .then(() => {
              assert.deepEqual(tmp.get(), ['third']);
            });

          cy.get('[value="second"]')
            .click()
            .then(() => {
              assert.deepEqual(tmp.get(), ['third', 'second']);
            });
        });
      });

      it('with multiple inputs', () => {
        const markup = /*html*/ `
        <div x-controller="controller">
          <input value="first" type="checkbox" x-model="controller::foo" />
          <input value="second" type="checkbox" x-model="controller::foo" />
          <input value="third" type="checkbox" x-model="controller::foo" />
        </div>
        `;

        cy.mount(markup).then(({ root, relic }) => {
          const { observe, register, provide } = relic;

          let tmp;

          const Controller = () => {
            tmp = provide('foo');
          };

          register('controller', Controller);
          observe(root);

          cy.get('[value="first"]')
            .click()
            .then(() => {
              console.log(tmp);
              expect(tmp.get()).to.be.equal('first');
            });

          cy.get('[value="third"]')
            .click()
            .then(() => {
              expect(tmp.get()).to.be.equal('first');
            });

          cy.get('[value="first"]').then((el) => {
            // Has to be synchronous, because cypress
            // will update the page and the third is still selected
            // so `third` will be the value
            el.get(0).click();
            expect(tmp.get()).to.be.equal(undefined);
          });
        });
      });
    });

    it('should update for date', () => {
      const markup = /*html*/ `
      <input
        type="date"
        x-controller="controller"
        x-model="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-model]')
          .type('2022-06-14')
          .then(() => {
            assert.deepEqual(tmp.get(), new Date('2022-06-14'));
          });
      });
    });

    it('should update for month', () => {
      const markup = /*html*/ `
      <input
        type="month"
        x-controller="controller"
        x-model="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-model]')
          .type('2022-06')
          .then(() => {
            expect(tmp.get()).to.be.equal('2022-06');
          });
      });
    });

    it('should update for number', () => {
      const markup = /*html*/ `
      <input
        type="number"
        x-controller="controller"
        x-model="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-model]')
          .type('2')
          .then(() => {
            expect(tmp.get()).to.be.equal(2);
          });
      });
    });

    it('should update for radio', () => {
      const markup = /*html*/ `
        <div x-controller="controller">
          <input 
          name="s" value="first" type="radio" x-model="controller::foo" />
          <input 
          name="s" value="second" type="radio" x-model="controller::foo" />
          <input 
          name="s" value="third" type="radio" x-model="controller::foo" />
        </div>`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[value="first"]')
          .click()
          .then(() => {
            expect(tmp.get()).to.be.equal('first');
          });

        cy.get('[value="third"]')
          .click()
          .then(() => {
            expect(tmp.get()).to.be.equal('third');
          });

        cy.get('[value="first"]')
          .click()
          .then(() => {
            expect(tmp.get()).to.be.equal('first');
          });

        cy.get('[value="second"]')
          .click()
          .then(() => {
            expect(tmp.get()).to.be.equal('second');
          });
      });
    });

    it('should update for range', () => {
      const markup = /*html*/ `
      <input
        type="range"
        min="0"
        max="100"
        x-controller="controller"
        x-model="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-model]').invoke('val', 30).trigger('input');

        cy.get('[x-model]').then(() => {
          expect(tmp.get()).to.be.equal(30);
        });
      });
    });

    it('should update for file', () => {
      const markup = /*html*/ `
      <input
        type="file"
        x-controller="controller"
        x-model="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        cy.get('[x-model]').selectFile('cypress/fixtures/example.json');

        cy.get('[x-model]').then(() => {
          expect(tmp.get().name).to.be.equal('example.json');
          tmp.set([]);
        });

        cy.get('[x-model]').selectFile('cypress/fixtures/example.json');

        cy.get('[x-model]').then(() => {
          expect(tmp.get()[0].name).to.be.equal('example.json');
        });
      });
    });
  });

  describe('modifiers', () => {
    it('.number', () => {
      const markup = /*html*/ `
      <input
       value="12"
       x-controller="controller"
       x-model.number="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        expect(tmp.get()).to.be.equal(12);
      });
    });

    it('.once', () => {
      const markup = /*html*/ `
      <input
       x-controller="controller"
       x-model.once="controller::foo" />`;

      cy.mount(markup).then(({ root, relic }) => {
        const { observe, register, provide } = relic;

        let tmp;

        const Controller = () => {
          tmp = provide('foo');
        };

        register('controller', Controller);
        observe(root);

        expect(tmp.get()).to.be.equal('');

        cy.get('[x-controller]')
          .type('a')
          .then(() => {
            expect(tmp.get()).to.be.equal('a');
          });

        cy.get('[x-controller]')
          .type('b')
          .then(() => {
            expect(tmp.get()).to.be.equal('a');
          });
      });
    });
  });
});
