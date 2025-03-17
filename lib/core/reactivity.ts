import { state } from './state';
import { type Signal, signal } from '@pvvrzv/nyx';

export function provide<V>(name: string): Signal<V | undefined>;
export function provide<V = undefined>(name: string, value: V): Signal<V>;
export function provide<V>(name: string, value?: Signal<V> | V): Signal<V> {
  const { controller } = state;

  if (!controller) {
    throw new Error('out of bounds hook call');
  }

  if (controller.signals[name]) {
    throw new Error('signal is already registered');
  }

  const s = signal<V>(value as any);

  return (controller.signals[name] = s as Signal<any>);
}

export function inject<T>(name: string): Signal<T> | undefined {
  const { controller } = state;

  if (!controller) {
    throw new Error('out of bounds hook call');
  }

  return controller.signals[name];
}
