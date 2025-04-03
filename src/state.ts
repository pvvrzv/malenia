import type { Droplet } from './droplet';

type State = {
  droplet: Droplet | undefined;
};

export const state: State = {
  droplet: undefined,
};
