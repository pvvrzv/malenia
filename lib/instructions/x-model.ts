import { type Worker, register } from '@core/instruction';
import { type Signal } from '@pvvrzv/nyx';
import { type Schema, parse as parseModifiers } from '@core/modifiers';

declare global {
  interface Element {
    ['__x-model']?: undefined | { stop: () => void; token: string };
  }
}

type ModelelableElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLOptionElement;

const modifiersSchema: Schema = {
  once: { numeric: false },
  number: { numeric: false },
};

const setters = {
  // default textarea color email password search tel text url radio

  default: (root: HTMLInputElement | HTMLTextAreaElement, signals: Signal<any>[], numeric: boolean) => {
    for (const signal of signals) {
      if (numeric) signal.set(parseFloat(root.value));
      else signal.set(root.value);
    }
  },

  radio: (root: HTMLInputElement, signals: Signal<any>[], numeric: boolean) => {
    if (!root.checked) return;

    for (const signal of signals) {
      if (numeric) signal.set(parseFloat(root.value));
      else signal.set(root.value);
    }
  },

  checkbox: (root: HTMLInputElement, signals: Signal<any>[], numeric: boolean) => {
    const checked = root.checked;
    const value = numeric ? parseFloat(root.value) : root.value;

    for (const signal of signals) {
      const current = signal.get();

      if (Array.isArray(current)) {
        const includes = current.includes(value);

        if (checked && !includes) {
          current.push(value);
          signal.set(current);
        } else if (!checked && includes) {
          signal.set(current.filter((v) => v !== value));
        }

        return;
      }

      if (checked && current === undefined) {
        signal.set(value);
      } else if (!checked && current === value) {
        signal.set(undefined);
      }
    }
  },

  select: (root: HTMLSelectElement, signals: Signal<any>[], numeric: boolean) => {
    for (const signal of signals) {
      const current = signal.get();

      if (Array.isArray(signal)) {
        let options = Array.from(root.selectedOptions).map((o) => (numeric ? parseFloat(o.value) : o.value));

        signal.set(current.splice(0, current.length, ...options));
        return;
      }

      signal.set(numeric ? parseFloat(root.value) : root.value);
    }
  },

  file: (root: HTMLInputElement, signals: Signal<any>[]) => {
    for (const signal of signals) {
      const current = signal.get();

      if (Array.isArray(current)) {
        if (!root.files) {
          current.length = 0;
          signal.set(current);
          return;
        }

        current.length = root.files.length;

        for (let i = 0; i < root.files.length; i++) {
          if (current[i] == root.files[i]) continue;

          current[i] = root.files[i];
        }

        signal.set(current);
        return;
      }

      if (!root.files) return signal.set(undefined);

      signal.set(root.files[0]);
    }
  },

  date: (root: HTMLInputElement, signals: Signal<any>[], numeric: boolean) => {
    for (const signal of signals) {
      const value = numeric ? root.valueAsNumber : root.valueAsDate || root.value;

      signal.set(value);
    }
  },
};

const mount: Worker['mount'] = (_, instruction, scope) => {
  const root = scope.root as ModelelableElement;

  const value = instruction.attr.value.trim();
  const tokens = value.split(/\s+/);

  const tag = root.tagName;

  if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && tag !== 'OPTION') {
    throw new Error('Unable to use x-mode on ...');
  }

  const type = 'type' in root ? root.type : 'option';
  const signals: Signal[] = [];

  const descriptor = root['__x-model'];

  if (descriptor) {
    if (descriptor.token === instruction.attr.name + value) return;

    descriptor.stop();
  }

  for (const token of tokens) {
    const [c, s] = token.split('::', 2);

    if (!c || !s) {
      throw new Error('Instruction Parameters Parsing Error');
    }

    const controller = scope.controllers[c];

    if (!controller) continue;

    const signal = controller.signals[s];

    if (!signal) {
      throw new Error('No registered signal for x-model ...');
    }

    signals.push(signal);
  }

  const modifiers = parseModifiers(instruction.modifiers, modifiersSchema);

  const numeric = modifiers.has('number');

  const set = () => {
    switch (type) {
      case 'file':
        return setters.file(root as HTMLInputElement, signals);
      case 'checkbox':
        return setters.checkbox(root as HTMLInputElement, signals, numeric);
      case 'select-one':
      case 'select-multiple':
        return setters.select(root as HTMLSelectElement, signals, numeric);
      case 'date':
        return setters.date(root as HTMLInputElement, signals, numeric);
      case 'range':
      case 'number':
        return setters.default(root as HTMLInputElement, signals, true);
      case 'radio':
        return setters.radio(root as HTMLInputElement, signals, numeric);
      default:
        return setters.default(root as HTMLInputElement, signals, numeric);
    }
  };

  set();

  let event =
    tag === 'OPTION' || tag === 'SELECT' || type === 'checkbox' || type === 'radio' || type === 'color'
      ? 'change'
      : 'input';

  root.addEventListener(event, set, {
    once: modifiers.has('once'),
  });

  root['__x-model'] = {
    stop() {
      root.removeEventListener(event, set);
    },
    token: instruction.attr.name + value,
  };
};

const unmount: Worker['unmount'] = (_, scope) => {
  scope.root['__x-model']?.stop();
};

register({
  name: 'model',
  priority: 8,
  mount,
  unmount,
});
