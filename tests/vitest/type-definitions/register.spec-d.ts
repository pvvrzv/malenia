import { type Controller, register} from '@lib';

test('register hook type test', () => {
  const Foo: Controller<HTMLButtonElement> = ({ root }) => {
    expectTypeOf(root).toEqualTypeOf<HTMLButtonElement>();
  };
  const Alt: Controller<SVGElement> = ({ root }) => {
    expectTypeOf(root).toEqualTypeOf<SVGElement>();
  };
  const Baz: Controller<Element> = ({ root }) => {
    expectTypeOf(root).toEqualTypeOf<Element>();
  };

  expectTypeOf(register).toBeCallableWith('foo', Foo);
  expectTypeOf(register).toBeCallableWith('alt', Alt);
  expectTypeOf(register).toBeCallableWith('baz', Baz);
});
