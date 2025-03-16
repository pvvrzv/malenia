import {
  observe,
  register,
  provide,
  type Controller,
  effect,
  mount,
} from '@lib';

const Foo = () => {
  mount(() => {
    throw new Error('')
  });
};

register('foo', Foo);

observe(document.documentElement);
