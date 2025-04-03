import { contains} from '@lib';

test('contains hook type test', () => {
  expectTypeOf(contains).toBeCallableWith('');
  expectTypeOf(contains).returns.toBeBoolean();
});
