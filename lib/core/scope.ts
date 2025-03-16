import type { Droplet } from './droplet';

export interface Scope {
  root: Element;
  parent: Scope | null;
  controllers: Record<string, Droplet>;
  ignore: boolean;
}

// Parent is a getter to make scope chain weak
// To not prevent garbage collection of root elements
// And scopes themselves.

export function create(root: Element): Scope {
  return {
    root,
    get parent() {
      const parent = this.root.parentElement;
      return parent && closest(parent);
    },
    controllers: {},
    ignore: false,
  };
}

export function extend(root: Element, parent: Scope): Scope {
  return {
    root,
    get parent() {
      const parent = this.root.parentElement;
      return parent && closest(parent);
    },
    controllers: Object.create(parent.controllers),
    ignore: false,
  };
}

export function closest(element: Element): Scope | null {
  if (element['__x-scope']) return element['__x-scope'];
  const parent = element.parentElement;
  return parent && closest(parent);
}
