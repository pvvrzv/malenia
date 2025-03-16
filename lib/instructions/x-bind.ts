import { type Signal, effect, stop } from '@pvvrzv/nyx';
import { type Worker, register } from '@core/instruction';
import { clx, slx } from '@shared/attribute';
import { ReferenceError } from '@core/errors';
import {
  type Schema,
  type Modifiers,
  parse as parseModifiers,
} from '@core/modifiers';

type Setter = (
  root: Element,
  name: string,
  base: string | null,
  value: any
) => any;

type Descriptor = {
  signal: Signal;
  stop: () => void;
};

type Group = Map<string, Descriptor>;

declare global {
  interface Element {
    ['__x-bind']?: undefined | Group;
  }
}

const modifiersSchema: Schema = {
  camel: { numeric: false },
  preserve: { numeric: false },
};

const evaluate = (base: null | string, value: any): any => {
  if (base && value) return base + ' ' + value;
  else if (value) return value;
  else return base;
};

const set = (root: Element, name: string, value: any) => {
  if (value || value !== null) root.setAttribute(name, value);
  else root.removeAttribute(name);
};

const setters: {
  [key: string]: Setter;
  default: Setter;
} = {
  default: (root: Element, name: string, base: null | string, value: any) => {
    set(root, name, evaluate(base, value));
  },

  class: (root: Element, _: string, base: null | string, value: any) => {
    set(root, 'class', evaluate(base, clx(value)));
  },

  style: (root: Element, _: string, base: null | string, value: any) => {
    set(root, 'style', evaluate(base, slx(value)));
  },
};

const transform = (attribute: string, modifiers: Modifiers): string => {
  if (modifiers.has('camel')) {
    return attribute.replace(/-(\w)/g, (_, char) => char.toUpperCase());
  }

  return attribute;
};

const mount: Worker['mount'] = (_, instruction, scope) => {
  const { root } = scope;
  const value = instruction.attr.value.trim();

  const attribute = instruction.argument;

  if (!attribute) {
    throw new Error('Instruction Parsing Error');
  }

  const [c, s] = value.split('::', 2);

  if (!c || !s) {
    throw new Error('Instruction Parameters Parsing Error');
  }

  const controller = scope.controllers[c];

  const descriptors = (root['__x-bind'] ??= new Map<string, Descriptor>());

  const descriptor = descriptors.get(instruction.attr.name);

  if (descriptor && !controller) {
    descriptor.stop();
    descriptors.delete(instruction.attr.name);
    return;
  }

  const setter = setters[attribute] || setters.default;

  if (!controller) return;

  const signal = controller.signals[s];

  if (!signal) {
    throw new ReferenceError(s, c);
  }

  if (descriptor && controller) {
    if (descriptor.signal === signal) return;

    descriptor.stop();
  }

  const modifiers = parseModifiers(instruction.modifiers, modifiersSchema);

  const name = transform(attribute, modifiers);

  const base = modifiers.has('preserve') ? root.getAttribute(name) : null;

  const e = effect(() => setter(root, name, base, signal.get()));

  descriptors.set(instruction.attr.name, {
    signal,
    stop: () => {
      set(root, attribute, base);
      stop(e);
    },
  });
};

const unmount: Worker['unmount'] = (instruction, scope) => {
  const { root } = scope;
  const descriptors = root['__x-bind'] || new Map<string, Descriptor>();
  const descriptor = descriptors.get(instruction.attr.name);

  if (!descriptor) return;

  descriptor.stop();
  descriptors.delete(instruction.attr.name);
};

register({
  name: 'bind',
  priority: 7,
  mount,
  unmount,
});
