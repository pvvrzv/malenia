describe("select hook specification", () => {
  it("should select only in closest scope", () => {
    const markup = /*html*/ `
      <div x-outer x-controller="controller">
        <div x-outer-alias x-alias="controller::alias"></div>
        <div x-inner x-controller="controller">
          <div x-inner-alias x-alias="controller::alias"></div>
        </div>
      </div>
      `;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe, select } = malenia;

      const temp = {
        outer: [],
        inner: [],
      };

      const Controller = ({ root }) => {
        if (root.hasAttribute("x-outer")) temp.outer.push(select("alias"));
        if (root.hasAttribute("x-inner")) temp.inner.push(select("alias"));
      };

      register("controller", Controller);

      observe(root);

      expect(temp.outer.length).to.equal(1);
      expect(temp.inner.length).to.equal(1);

      cy.get("[x-outer-alias]").then(($outer) => {
        cy.get("[x-inner-alias]").then(($inner) => {
          expect(temp.outer.at(0)).to.equal($outer.get().at(0));
          expect(temp.inner.at(0)).to.equal($inner.get().at(0));
        });
      });
    });
  });

  it("should select all aliases", () => {
    const markup = /*html*/ `
      <div x-outer x-controller="controller">
        <div x-alias="controller::alias"></div>
        <div x-alias="controller::alias"></div>
      </div>
      `;

    cy.mount(markup).then(({ root, malenia }) => {
      const { register, observe, select } = malenia;

      const Controller = () => {
        expect(select("alias", "*").length).to.equal(2);
      };

      register("controller", Controller);

      observe(root);
    });
  });
});
