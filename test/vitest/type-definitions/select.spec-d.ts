import { select } from "@src";

test("select hook type test", () => {
  expectTypeOf(select("alias")).toEqualTypeOf<Element | null>();
  expectTypeOf(select<HTMLElement>("alias")).toEqualTypeOf<HTMLElement | null>();
  expectTypeOf(select<HTMLButtonElement>("alias")).toEqualTypeOf<HTMLButtonElement | null>();
  expectTypeOf(select<SVGElement>("alias")).toEqualTypeOf<SVGElement | null>();

  expectTypeOf(select("alias", "*")).toEqualTypeOf<NodeListOf<Element>>();
  expectTypeOf(select<HTMLElement>("alias", "*")).toEqualTypeOf<NodeListOf<HTMLElement>>();
  expectTypeOf(select<HTMLButtonElement>("alias", "*")).toEqualTypeOf<NodeListOf<HTMLButtonElement>>();
  expectTypeOf(select<SVGElement>("alias", "*")).toEqualTypeOf<NodeListOf<SVGElement>>();
});
