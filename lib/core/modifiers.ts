export type Modifiers = Map<string, boolean | number>;

export type Schema = Record<string, { numeric: boolean }>;

const map: Modifiers = new Map();

export const parse = (
  modifiers: string[] | undefined,
  schema: Schema,
  start: number = 0
) => {
  map.clear();

  if (!modifiers) return map;

  for (let i = start; i < modifiers.length; i++) {
    const m = modifiers[i]!;
    const descriptor = schema[m];

    if (!descriptor) throw new Error('unrecognized modifer');

    if (descriptor.numeric) {
      const next = modifiers[i + 1];

      if (!next) continue;

      const n = parseInt(next);

      if (Number.isNaN(n) || n.toString() !== next) {
        continue;
      }

      i++;
      map.set(m, n);
    } else {
      map.set(m, true);
    }
  }

  return map;
};
