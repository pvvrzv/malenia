import { setup } from '@lib';

test('setup hook type test', () => {
  expectTypeOf(setup).toBeCallableWith(() => {});
  expectTypeOf(setup).parameter(0).toBeFunction();
});
