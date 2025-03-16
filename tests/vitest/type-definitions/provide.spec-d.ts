import { provide } from '@lib';
import { type Signal, signal } from '@pvvrzv/nyx';

test('provide hook type test', () => {
  expectTypeOf(provide).toBeCallableWith('foo', 2);
  expectTypeOf(provide).toBeCallableWith('foo', '');
  expectTypeOf(provide).toBeCallableWith('foo', () => {});
  expectTypeOf(provide).toBeCallableWith('foo', {});
  expectTypeOf(provide).toBeCallableWith('foo', new Map());
  expectTypeOf(provide).toBeCallableWith('foo', new Set());
  expectTypeOf(provide).toBeCallableWith('foo', signal(''));

  expectTypeOf(provide('', signal(''))).toEqualTypeOf<Signal<string>>;
  expectTypeOf(provide('', signal(2))).toEqualTypeOf<Signal<number>>;
  expectTypeOf(provide('', signal(new Map()))).toEqualTypeOf<
    Signal<Map<any, any>>
  >;
  expectTypeOf(provide('', signal({ a: '', b: 2 }))).toEqualTypeOf<
    Signal<{ a: string; b: number }>
  >;
});
