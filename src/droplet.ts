import { type Record } from "./registry";

export type Droplet = {
  root: Element;
  record: Record;
  mounted: boolean;
  mount: Set<{ callback: Function; once: boolean }>;
  unmount: Set<{ callback: Function; once: boolean }>;
};

export function create(record: Record, root: Element): Droplet {
  return {
    root,
    record,
    mounted: false,
    mount: new Set(),
    unmount: new Set(),
  };
}
