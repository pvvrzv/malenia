import { mount } from '@lib';

test('mount hook type test', () => {
  expectTypeOf(mount).toBeCallableWith(() => {}, { once: true });
  expectTypeOf(mount).toBeCallableWith(() => {}, { once: false });
  expectTypeOf(mount).toBeCallableWith(() => {}, {});
  expectTypeOf(mount).toBeCallableWith(() => {});
  expectTypeOf(mount).toBeCallableWith(() => () => {});
  expectTypeOf(mount).parameter(0).toBeFunction();
});
