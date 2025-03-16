import { observer } from './observer';

export type Configuration = {
  prefix: string;
};

export const configuration: Configuration = {
  prefix: 'x-',
};

export function configure(configuration: Configuration) {
  if (
    !configuration ||
    typeof configuration !== 'object' ||
    configuration === null
  ) {
    throw new Error('Configuration must be an object');
  }

  if (!observer.idle) {
    throw new Error('Not Idle');
  }

  if ('prefix' in configuration && typeof configuration.prefix === 'string') {
    configuration.prefix = configuration.prefix;
  } else {
    throw new Error('Configuration Error');
  }
}
