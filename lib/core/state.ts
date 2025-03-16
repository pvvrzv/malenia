import type { Droplet } from './droplet';

type State = {
  controller: Droplet | undefined;
};

export const state: State = {
  controller: undefined,
};
