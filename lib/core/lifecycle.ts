import { state } from './state';

export function setup(callback: () => void) {
  if (!state.controller) {
    throw new Error('Out Of Bounds Hook Call');
  }

  if (typeof callback !== 'function') {
    throw new Error('setup callback argument must be of a type function');
  }

  state.controller.setup.add(callback);
}

export function mount(
  callback: () => void | (() => any),
  options?: { once?: boolean }
) {
  if (!state.controller) {
    throw new Error('Out Of Bounds Hook Call');
  }

  if (typeof callback !== 'function') {
    throw new Error('mount callback argument must be of a type function');
  }

  state.controller.mount.add({ callback, once: options?.once || false });
}

export function unmount(
  callback: () => void | (() => any),
  options?: { once?: boolean }
) {
  if (!state.controller) {
    throw new Error('Out Of Bounds Hook Call');
  }

  if (typeof callback !== 'function') {
    throw new Error('unmount callback argument must be of a type function');
  }

  state.controller.unmount.add({ callback, once: options?.once || false });
}
