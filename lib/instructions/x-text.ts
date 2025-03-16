import type { Droplet } from '@core/droplet';
import { Worker } from '@core/instruction';
import { register } from '@core/instruction';
import { type Signal, effect, stop } from '@pvvrzv/nyx';
import { ReferenceError } from '@core/errors';

type Desciptor = {
  controller: Droplet;
  signal: Signal;
  stop: () => void;
};

declare global {
  interface Element {
    '__x-text'?: undefined | Desciptor;
  }
}

const unmount: Worker['unmount'] = (_, scope) => {
  scope.root['__x-text']?.stop();
  scope.root['__x-text'] = undefined;
};

const mount: Worker['mount'] = (_, instrunction, scope, skip) => {
  const { root } = scope;
  const value = instrunction.attr.value.trim();

  if (value === '') {
    return unmount(instrunction, scope, skip);
  }

  const [c, s] = value.split('::', 2);

  if (!c || !s) {
    throw new Error('Instruction Parameters Parsing Error');
  }

  const controller = scope.controllers[c];
  const descriptor = root['__x-text'];

  if (descriptor && !controller) {
    descriptor.stop();
    root['__x-text'] = undefined;
    return;
  }

  if (!controller) return;

  const signal = controller.signals[s];

  if (!signal) {
    throw new ReferenceError(s, c);
  }

  if (descriptor && controller) {
    if (descriptor.signal === signal) return;

    descriptor.stop();
  }

  const e = effect(() => (root.textContent = signal.get()));

  root['__x-text'] = {
    controller,
    signal,
    stop: () => stop(e),
  };
};

register({
  name: 'text',
  priority: 5,
  mount,
  unmount,
});
