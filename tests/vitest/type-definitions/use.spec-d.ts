import { use } from '@lib';

test('use hook type test', () => {
  expectTypeOf(use).toBeCallableWith('', 2);
  expectTypeOf(use).toBeCallableWith('', {});
  expectTypeOf(use).toBeCallableWith('', new Map());
  expectTypeOf(use).toBeCallableWith('', '');
  expectTypeOf(use).toBeCallableWith('', undefined);
  expectTypeOf(use('', 2)).toBeNumber();
  expectTypeOf(use('', '')).toBeString();
  expectTypeOf(use('', { a: '' })).toEqualTypeOf<{ a: string }>();
});
