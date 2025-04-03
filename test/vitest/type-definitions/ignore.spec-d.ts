import { ignore } from "@src";

const html = {} as HTMLElement;
const element = {} as Element;
const svg = {} as SVGElement;

test("ignore hook type test", () => {
  expectTypeOf(ignore).toBeCallableWith(html);
  expectTypeOf(ignore).toBeCallableWith(element);
  expectTypeOf(ignore).toBeCallableWith(svg);
});
