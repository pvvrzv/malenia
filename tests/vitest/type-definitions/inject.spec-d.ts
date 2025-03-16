import { inject } from '@lib';
import { type Signal } from '@pvvrzv/nyx';

test('inject hook type test', () => {
  expectTypeOf(inject).toBeCallableWith('foo');

  expectTypeOf(inject<string>('')).toEqualTypeOf<Signal<string> | undefined>;
  expectTypeOf(inject<number>('')).toEqualTypeOf<Signal<number> | undefined>;
  expectTypeOf(inject<{ a: string; b: number }>('')).toEqualTypeOf<
    Signal<{ a: string; b: number }> | undefined
  >;
});
