import { disconnect } from '@lib';

const html = {} as HTMLElement;
const element = {} as Element;
const svg = {} as SVGElement;
test('disconnect hook type test', () => {
  expectTypeOf(disconnect).toBeCallableWith(html);
  expectTypeOf(disconnect).toBeCallableWith(element);
  expectTypeOf(disconnect).toBeCallableWith(svg);
});
