describe("mount hook specification", () => {
  it("should be called every time controller mounts", () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe, mount } = malenia;

      const spy = cy.spy(() => {});

      const Controller = () => {
        mount(spy);
      };

      register("controller", Controller);
      observe(root);

      expect(spy).to.be.calledOnce;

      cy.get("[x-target]").invoke("removeAttr", "x-controller");

      cy.wait(1);

      cy.get("[x-target]").invoke("attr", "x-controller", "controller");

      cy.wait(1);

      cy.get("[x-target]").then(() => {
        expect(spy).to.be.calledTwice;
      });
    });
  });

  it("should be possible to call multiple times", () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe, mount } = malenia;

      const spies = [cy.spy(() => {}), cy.spy(() => {})];

      const Controller = () => {
        mount(spies[0]);
        mount(spies[1]);
      };

      register("controller", Controller);
      observe(root);

      expect(spies[0]).to.be.calledOnce;
      expect(spies[1]).to.be.calledOnce;

      cy.get("[x-target]").invoke("removeAttr", "x-controller");

      cy.wait(1);

      cy.get("[x-target]").invoke("attr", "x-controller", "controller");

      cy.wait(1);

      cy.get("[x-target]").then(() => {
        expect(spies[0]).to.be.calledTwice;
        expect(spies[1]).to.be.calledTwice;
      });
    });
  });

  it("should call returned function only once", () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe, mount } = malenia;

      const unmountSpies = [cy.spy(() => {}), cy.spy(() => {})];

      const Controller = () => {
        let index = 0;

        mount(() => {
          return unmountSpies[index++];
        });
      };

      register("controller", Controller);
      observe(root);

      expect(unmountSpies[0]).to.not.be.called;
      expect(unmountSpies[1]).to.not.be.called;

      cy.get("[x-target]").invoke("removeAttr", "x-controller");

      cy.wait(1);

      cy.get("[x-target]").then(() => {
        expect(unmountSpies[0]).to.be.calledOnce;
        expect(unmountSpies[1]).to.not.be.called;
      });

      cy.get("[x-target]").invoke("attr", "x-controller", "controller");

      cy.wait(1);

      cy.get("[x-target]").invoke("removeAttr", "x-controller");

      cy.wait(1);

      cy.get("[x-target]").then(() => {
        expect(unmountSpies[0]).to.be.calledOnce;
        expect(unmountSpies[1]).to.be.calledOnce;
      });
    });
  });

  it("should be called once if `once` option was set to true", () => {
    const markup = /*html*/ `<div x-target x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe, mount } = malenia;

      const spy = cy.spy(() => {});

      const Controller = () => {
        mount(spy, { once: true });
      };

      register("controller", Controller);
      observe(root);

      expect(spy).to.be.calledOnce;

      cy.get("[x-target]").invoke("removeAttr", "x-controller");

      cy.wait(1);

      cy.get("[x-target]").invoke("attr", "x-controller", "controller");

      cy.wait(1);

      cy.get("[x-target]").then(() => {
        expect(spy).to.be.calledOnce;
      });
    });
  });

  it("should be possible to use other lifecycle hooks from inside mount", () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe, mount, unmount } = malenia;

      const spy = cy.spy(() => {});

      const Controller = () => {
        mount(() => {
          unmount(spy);
        });
      };

      register("controller", Controller);

      observe(root);
      expect(spy).to.not.be.called;

      cy.get("[x-controller]")
        .invoke("remove")
        .wait(1)
        .then(() => {
          expect(spy).to.be.calledOnce;
        });
    });
  });

  it("should run synchronously", () => {
    const markup = /*html*/ `<div x-controller="controller"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe, mount, effect, signal, proxy, group } = malenia;

      const Controller = () => {
        mount(() => {
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

      register("controller", Controller);
      observe(root);
    });
  });

  it("should not mount if an element was removed in the same iteration and is still connected", () => {
    const markup = /*html*/ `
      <div x-controller="foo"></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe, mount } = malenia;

      const fooSpy = cy.spy(() => {});

      const Foo = () => {
        mount(fooSpy);
      };

      register("foo", Foo);

      observe(root);

      expect(fooSpy).to.be.calledOnce;

      cy.get('[x-controller="foo"]')
        .invoke("get")
        .then((foo) => {
          const element = foo[0];
          const parent = element.parentElement;
          element.remove();
          parent.append(element);
        });

      cy.wait(1).then(() => {
        expect(fooSpy).to.be.calledOnce;
      });
    });
  });

  it("should not mount if an element was removed in the same iteration and is not connected", () => {
    const markup = /*html*/ `<div x-target></div>`;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe, mount } = malenia;

      const fooSpy = cy.spy(() => {});

      const Foo = () => {
        mount(fooSpy);
      };

      register("foo", Foo);

      observe(root);

      expect(fooSpy).not.to.be.called;

      cy.get("[x-target]")
        .invoke("get")
        .then((foo) => {
          const target = foo[0];
          const element = document.createElement("div");
          element.setAttribute("x-controller", "foo");
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
});
