import { type Worker, register } from '@core/instruction';
import { type Signal, effect, stop } from '@pvvrzv/nyx';
import { ReferenceError } from '@core/errors';
import {
  type Schema,
  type Modifiers,
  parse as parseModifiers,
} from '@core/modifiers';

type Descriptor = {
  signal: Signal;
  stop: () => void;
};

type Group = Map<string, Descriptor>;

type Store = Map<string, Group>;

type Target = Element | Window | Document;

declare global {
  interface Element {
    '__x-on'?: undefined | Store;
  }
}

const modifiersSchema: Schema = {
  camel: { numeric: false },
  window: { numeric: false },
  document: { numeric: false },
  throttle: { numeric: true },
  debounce: { numeric: true },
  once: { numeric: false },
  capture: { numeric: false },
  passive: { numeric: false },
  self: { numeric: false },
  prevent: { numeric: false },
  stop: { numeric: false },
};

const transform = (type: string, modifiers: Modifiers): string => {
  if (modifiers.has('camel')) {
    return type.replace(/-(\w)/g, (_, char) => char.toUpperCase());
  }

  return type;
};

const target = (root: Element, modifiers: Modifiers): Target => {
  if (modifiers.has('window')) {
    if (modifiers.has('document')) {
      throw new Error("Can't have both window and document modifiers");
    }
    return window;
  }
  if (modifiers.has('document')) return document;
  return root;
};

const configure = (modifiers: Modifiers): AddEventListenerOptions => {
  return {
    once: modifiers.has('once'),
    passive: modifiers.has('passive'),
    capture: modifiers.has('capture'),
  };
};

const wrap = (
  callback: (e: Event) => any,
  modifiers: Modifiers,
  root: Element | Window | Document
): ((event: Event) => any) => {
  type Middleware = (event: Event, callback: (e: Event) => any) => boolean;

  let intermediate = callback.bind(root);

  const wrapper = (c1: Middleware, c2: (e: Event) => any, e: Event): any =>
    c1(e, c2) && c2(e);

  const bind = (middleware: Middleware) => {
    intermediate = wrapper.bind(null, middleware, intermediate);
  };

  if (modifiers.has('debounce')) {
    const n = modifiers.get('debounce')!;
    const timeout = typeof n === 'number' ? n : 250;
    let timer: number | undefined = undefined;

    bind((event, callback) => {
      clearTimeout(timer);

      timer = setTimeout(() => callback(event), timeout);

      return false;
    });
  }

  if (modifiers.has('throttle')) {
    const n = modifiers.get('throttle')!;
    const timeout = typeof n === 'number' ? n : 250;
    let timer: number | undefined = undefined;

    bind(() => {
      if (timer !== undefined) return false;

      timer = setTimeout(() => (timer = undefined), timeout);

      return true;
    });
  }

  if (modifiers.has('self')) {
    if (modifiers.has('window') || modifiers.has('document')) {
      throw new Error("can't have self and windwo or document modifiers");
    }

    bind((event) => event.target === root);
  }

  if (modifiers.has('prevent')) {
    bind((event) => (event.preventDefault(), true));
  }

  if (modifiers.has('stop')) {
    bind((event) => (event.stopPropagation(), true));
  }

  return intermediate;
};

const cleanup = (
  descriptor: Descriptor,
  descriptors: Group,
  store: Store,
  token: string,
  name: string
) => {
  descriptor.stop();
  descriptors.delete(token);
  if (descriptors.size === 0) store.delete(name);
};

const mount: Worker['mount'] = (_, instrunction, scope) => {
  const { root } = scope;
  const { modifiers, attr, argument } = instrunction;

  if (!argument) {
    throw new Error('Instruction Parsing Error');
  }

  let store = root['__x-on'];

  if (!store) {
    store = root['__x-on'] = new Map();
  }

  let descriptors = store.get(instrunction.attr.name);

  if (!descriptors) {
    store.set(attr.name, (descriptors = new Map()));
  }

  const tokens = instrunction.attr.value.trim().split(/\s+/);

  for (const [token, descriptor] of descriptors) {
    if (token.includes(token)) continue;

    cleanup(descriptor, descriptors, store, token, attr.name);
  }

  for (const token of tokens) {
    const [c, s] = token.split('::', 2);

    if (!c || !s) {
      throw new Error('Instruction Parameters Parsing Error');
    }

    const controller = scope.controllers[c];
    const descriptor = descriptors.get(token);

    if (!descriptor && !controller) return;

    if (descriptor && !controller) {
      descriptor.stop();
      descriptors.delete(token);
      if (descriptors.size === 0) store.delete(attr.name);
      return;
    }

    if (!controller) return;

    const signal = controller.signals[s];

    if (!signal) {
      throw new ReferenceError(s, c);
    }

    if (descriptor && controller) {
      if (descriptor.signal === signal) return;
      else cleanup(descriptor, descriptors, store, token, attr.name);
    }

    const parsed = parseModifiers(modifiers, modifiersSchema);

    const element = target(root, parsed);
    const type = transform(argument, parsed);
    const options = configure(parsed);

    let listener: (e: Event) => any;

    const e = effect(() => {
      element.removeEventListener(type, listener, options);

      const callback = signal.get();

      if (typeof callback !== 'function') {
        throw new Error('Unable to add non-function event listener');
      }

      listener = wrap(callback, parsed, element);
      element.addEventListener(type, listener, options);
    });

    descriptors.set(token, {
      signal,
      stop: () => {
        stop(e);
        root.removeEventListener(type, listener, options);
      },
    });
  }
};

const unmount: Worker['unmount'] = (instruction, scope) => {
  const { attr } = instruction;
  const { root } = scope;

  const store = root['__x-on'];

  if (!store) return;

  const descriptors = store.get(attr.name);

  if (descriptors) {
    for (const [token, descriptor] of descriptors) {
      cleanup(descriptor, descriptors, store, token, attr.name);
    }
  }

  root['__x-on'] = undefined;
  return;
};

register({
  name: 'on',
  priority: 4,
  mount,
  unmount,
});
