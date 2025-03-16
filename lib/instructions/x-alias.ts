import type { Scope } from '@core/scope';
import { type Worker, register } from '@core/instruction';
import { Signal } from '@pvvrzv/nyx';
import { Droplet } from '@core/droplet';
import { ReferenceError } from '@core/errors';

type Descriptor = {
  controller: Droplet;
  signal: Signal<Element | Element[] | undefined>;
  queue?: undefined | Element[];
};

type Group = Map<string, Descriptor>;

declare global {
  interface Element {
    '__x-alias'?: undefined | Group;
  }
}

const disconnect = (descriptor: Descriptor, root: Element, token: string) => {
  const signal = descriptor.signal;
  const target = signal.value!;

  if (Array.isArray(target)) {
    const index = target.indexOf(root);

    if (index === -1) return;

    target.splice(index, 1);
    signal.update((target) => target);
  } else if (target === root) {
    const queue = descriptor.queue;

    if (queue) {
      const next = queue.shift()!;

      signal.set(next);

      if (queue.length === 0) {
        descriptor.queue = undefined;
        next['__x-alias']!.get(token)!.queue = undefined;
      }
    } else {
      signal.set(undefined);
    }
  } else {
    const index = descriptor.queue!.indexOf(root);
    // It is important to update it in place so there
    // is no need to search for other elmements with
    // reference to the same array
    target['__x-alias']!.get(token)!.queue!.splice(index, 1);
    descriptor.queue = undefined;
  }
};

const connect = (descriptor: Descriptor, root: Element, token: string) => {
  const signal = descriptor.signal;
  const target = signal.value;

  if (Array.isArray(target)) {
    signal.update((target) => {
      (target as Element[]).push(root);
      return target;
    });
  } else if (target === undefined) {
    signal.set(root);
  } else {
    const queue = (target['__x-alias']!.get(token)!.queue ??= []);
    queue.push(root);
    descriptor.queue = queue;
  }
};

const add = (scope: Scope, token: string) => {
  const { root } = scope;
  const descriptors = (root['__x-alias'] ??= new Map<string, Descriptor>());

  const [c, s] = token.split('::', 2);

  if (!c || !s) {
    throw new Error('Instruction Paring Error');
  }

  const controller = scope.parent?.controllers[c];

  if (!controller) return;

  const signal = controller.signals[s];

  if (!signal) {
    throw new ReferenceError(s, c);
  }

  const descriptor = { signal, controller };

  connect(descriptor, root, token);
  descriptors.set(token, descriptor);
};

const update = (scope: Scope, token: string) => {
  const { root } = scope;
  const descriptors = (root['__x-alias'] ??= new Map<string, Descriptor>());
  const descriptor = descriptors.get(token)!;

  const [c, s] = token.split('::', 2);

  if (!c || !s) {
    throw new Error('Instruction Parsing Error');
  }

  const controller = scope.controllers[c];

  if (controller) {
    if (descriptor.controller === null) {
      disconnect(descriptor, root, token);
      descriptors.delete(token);
    } else {
      if (descriptor.controller === controller) return;

      disconnect(descriptor, root, token);

      const signal = controller.signals[s];

      if (!signal) return;

      const _descriptor = { signal, controller };

      connect(_descriptor, root, token);
      descriptors.set(token, _descriptor);
    }
  } else {
    if (descriptor.controller !== null) {
      disconnect(descriptor, root, token);
      descriptors.delete(token);
    }
  }
};

const unmount: Worker['unmount'] = (_, scope) => {
  const { root } = scope;
  const descriptors = (root['__x-alias'] ??= new Map<string, Descriptor>());

  for (const [token, descriptor] of descriptors) {
    disconnect(descriptor, root, token);
    descriptors.delete(token);
  }

  descriptors.clear();

  return;
};

const mount: Worker['mount'] = (_, instruction, scope, skip) => {
  const { root } = scope;
  const descriptors = (root['__x-alias'] ??= new Map<string, Descriptor>());
  const value = instruction.attr.value.trim();

  if (value === '') return unmount(instruction, scope, skip);

  const tokens = value.split(/\s+/);

  for (const [token, descriptor] of descriptors) {
    if (tokens.includes(token)) continue;

    disconnect(descriptor, scope.root, token);
    descriptors.delete(token);
  }

  for (const token of tokens) {
    if (descriptors.has(token)) update(scope, token);
    else add(scope, token);
  }
};

register({
  name: 'alias',
  priority: 2,
  mount,
  unmount,
});
