import { type Record as RR } from './registry';
import { type Signal } from '@pvvrzv/nyx';

export interface Droplet {
  root: Element;
  record: RR;
  mounted: boolean;
  signals: Record<string, Signal<any>>;
  setup: Set<() => any>;
  mount: Set<{ callback: (...args: any[]) => any; once: boolean }>;
  unmount: Set<{ callback: (...args: any[]) => any; once: boolean }>;
}

export function create(record: RR, root: Element): Droplet {
  return {
    root,
    record,
    mounted: false,
    signals: {},
    setup: new Set(),
    mount: new Set(),
    unmount: new Set(),
  };
}
