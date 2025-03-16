import { state } from './state';
import { type Signal, signal } from '@pvvrzv/nyx';

export function provide<T extends any>(
  name: string,
  value?: Signal<T> | T
): Signal<T> {
  const { controller } = state;

  if (!controller) {
    throw new Error('out of bounds hook call');
  }

  if (controller.signals[name]) {
    throw new Error('signal is already registered');
  }

  const s = signal<T>(value as any);

  return (controller.signals[name] = s as Signal<any>);
}

export function inject<T>(name: string): Signal<T> | undefined {
  const { controller } = state;

  if (!controller) {
    throw new Error('out of bounds hook call');
  }

  return controller.signals[name];
}
