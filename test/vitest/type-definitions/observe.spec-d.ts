import { observe } from '@lib';

const html = {} as HTMLElement;
const element = {} as Element;
const svg = {} as SVGElement;

test('observe hook type test', () => {
  expectTypeOf(observe).toBeCallableWith(html);
  expectTypeOf(observe).toBeCallableWith(element);
  expectTypeOf(observe).toBeCallableWith(svg);
});
