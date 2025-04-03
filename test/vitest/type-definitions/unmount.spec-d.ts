import { unmount } from '@src';

test('unmount hook type test', () => {
  expectTypeOf(unmount).toBeCallableWith(() => {}, { once: true });
  expectTypeOf(unmount).toBeCallableWith(() => {}, { once: false });
  expectTypeOf(unmount).toBeCallableWith(() => {}, {});
  expectTypeOf(unmount).toBeCallableWith(() => {});
  expectTypeOf(unmount).toBeCallableWith(() => () => {});
  expectTypeOf(unmount).parameter(0).toBeFunction();
});
