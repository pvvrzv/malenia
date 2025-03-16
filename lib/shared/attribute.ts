export const clx = (value: any): string => {
  let intermediate = '';
  let tmp = '';

  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
      return value.toString();
    case 'object': {
      if (value === null) return '';

      if (Array.isArray(value)) {
        for (const entry of value) {
          if ((tmp = clx(entry))) {
            intermediate && (intermediate += ' ');
            intermediate += tmp;
          }
        }
      } else {
        for (const entry in value) {
          if (!value[entry]) continue;
          intermediate && (intermediate += ' ');
          intermediate += entry;
        }
      }
    }
  }

  return intermediate;
};

export const slx = ((): ((value: any) => string) => {
  const declaration = document.createElement('div').style;

  return (value: any): string => {
    if (typeof value !== 'object' || value === null) {
      declaration.cssText = value.toString();
      return declaration.cssText;
    }

    if (Array.isArray(value)) {
      return value.map((sub) => slx(sub)).join(' ');
    }

    declaration.cssText = '';

    for (let [k, v] of Object.entries(value)) {
      if (!k.startsWith('--')) {
        k = k.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      }

      declaration.setProperty(k, v as any);
    }

    return declaration.cssText;
  };
})();
