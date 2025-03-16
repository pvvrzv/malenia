import { clx, slx } from "@lib";

describe("shared/attribute", () => {
  describe("clx", () => {
    test("empty input", () => {
      expect(clx(), "");
    });

    test("strings", () => {
      expect(clx(""), "");
      expect(clx("foo")).to.equal("foo");
    });

    test("numbers", () => {
      expect(clx(1), "1");
      expect(clx("1.1")).to.equal("1.1");
      expect(clx(NaN), "");
      expect(clx(0), "");
      expect(clx(Infinity)).to.equal("Infinity");
      expect(clx(-Infinity)).to.equal("-Infinity");
      expect(clx(+Infinity)).to.equal("Infinity");
    });

    test("objects", () => {
      expect(clx({})).to.equal("");
      expect(clx({ foo: true })).to.equal("foo");
      expect(clx({ foo: false })).to.equal("");
      expect(clx({ foo: "non empty string", bar: 1 })).to.equal("foo bar");
      expect(clx({ foo: 1, bar: 0 })).to.equal("foo");
      expect(clx({ foo: {} })).to.equal("foo");
    });

    test("arrays", () => {
      expect(clx([])).to.equal("");
      expect(clx(["foo"])).to.equal("foo");
      expect(clx(["foo", "bar"])).to.equal("foo bar");
      expect(clx(["foo", ["bar", "baz"]])).to.equal("foo bar baz");
      expect(clx(["foo", ["bar", { baz: true }]])).to.equal("foo bar baz");
      expect(clx(["foo", ["bar", { baz: false }]])).to.equal("foo bar");
      expect(clx(["foo", ["bar", { baz: 1 }]])).to.equal("foo bar baz");
      expect(clx(["foo", ["bar", { baz: 0 }]])).to.equal("foo bar");
      expect(clx(["foo", ["bar", { baz: "non empty" }]])).to.equal("foo bar baz");
    });

    test("functions", () => {
      const spy = vi.fn(() => {});

      expect(clx(spy)).to.equal("");
      expect(clx({ foo: spy })).to.equal("foo");
      expect(clx(["foo", spy])).to.equal("foo");

      expect(spy).toBeCalledTimes(0);
    });

    test("symbols", () => {
      expect(clx(Symbol())).to.equal("");
      expect(clx(["foo", Symbol()])).to.equal("foo");
      expect(clx({ foo: Symbol() })).to.equal("foo");
    });

    test("symbols", () => {
      expect(clx(Symbol())).to.equal("");
      expect(clx(["foo", Symbol()])).to.equal("foo");
      expect(clx({ foo: Symbol() })).to.equal("foo");
    });

    test("booleans", () => {
      expect(clx(false)).to.equal("");
      expect(clx(["foo", true])).to.equal("foo");
      expect(clx({ foo: true })).to.equal("foo");
      expect(clx({ foo: false })).to.equal("");
    });

    test("bigint", () => {
      expect(clx(1n)).to.equal("");
      expect(clx(["foo", 1n])).to.equal("foo");
      expect(clx({ foo: 1n })).to.equal("foo");
      expect(clx({ foo: 0n })).to.equal("");
    });
  });

  describe("slx", () => {
    test("string", () => {
      expect(slx("")).to.equal("");
      expect(slx("foo")).to.equal("");
      expect(slx("foo: 12px;")).to.equal("");
      expect(slx("font-size: 12px;")).to.equal("font-size: 12px;");
      expect(slx("font-size: 12px")).to.equal("font-size: 12px;");
      expect(slx("font-size: 12px line-height: 1em")).to.equal("");
    });

    test("object", () => {
      expect(slx({})).to.equal("");
      expect(slx({ "font-size": "12px" })).to.equal("font-size: 12px;");
      expect(slx({ fontSize: "12px" })).to.equal("font-size: 12px;");
      expect(slx({ foo: "12px" })).to.equal("");
      expect(slx({ "--foo": "12px" })).to.equal("--foo: 12px;");
      expect(slx({ fontSize: 12 })).to.equal("");
      expect(slx({ fontSize: Symbol() })).to.equal("");
    });

    test("symbol", () => {
      expect(slx(Symbol())).to.equal("");
    });

    test("number", () => {
      expect(slx(12)).to.equal("");
      expect(slx(NaN)).to.equal("");
      expect(slx(Infinity)).to.equal("");
      expect(slx(-Infinity)).to.equal("");
    });

    test("bigint", () => {
      expect(slx(12n)).to.equal("");
    });

    test("array", () => {
      expect(slx([])).to.equal("");
      expect(slx(["font-size: 12px;"])).to.equal("font-size: 12px;");
      expect(slx(["font-size: 12px;", ["line-height: 1em;"]])).to.equal("font-size: 12px; line-height: 1em;");
      expect(slx(["font-size: 12px;", { fontFamily: "sans-serif" }, ["line-height: 1em;"]])).to.equal(
        "font-size: 12px; font-family: sans-serif; line-height: 1em;"
      );
    });
  });
});
