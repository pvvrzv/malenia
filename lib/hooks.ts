import { state } from "./state";

export function mount(callback: () => unknown, options?: { once?: boolean }) {
  if (!state.droplet) throw new Error("Out Of Bounds Hook Call");

  if (typeof callback !== "function") {
    throw new Error("mount callback argument must be of a type function");
  }

  state.droplet.mount.add({ callback, once: options?.once || false });
}

export function unmount(callback: () => unknown, options?: { once?: boolean }) {
  if (!state.droplet) throw new Error("Out Of Bounds Hook Call");

  if (typeof callback !== "function") {
    throw new Error("unmount callback argument must be of a type function");
  }

  state.droplet.unmount.add({ callback, once: options?.once || false });
}

export function select<E extends Element>(alias: string, modifier: "*"): NodeListOf<E>;
export function select<E extends Element>(alias: string, modifier?: never): E | null;
export function select<E extends Element>(alias: string, modifier?: "*") {
  if (!state.droplet) throw new Error("Out Of Bounds Hook Call");

  const name = state.droplet.record.name;
  const selector = `:not([x-controller="${name}"]) [x-alias~="${name}::${alias}"]`;

  return modifier === "*"
    ? state.droplet.root.querySelectorAll<E>(selector)
    : state.droplet.root.querySelector<E>(selector);
}

export function clx(value: any): string {
  let intermediate = "";
  let tmp = "";

  switch (typeof value) {
    case "string":
      return value;
    case "number":
      return value.toString();
    case "object": {
      if (value === null) return "";

      if (Array.isArray(value)) {
        for (const entry of value) {
          if ((tmp = clx(entry))) {
            intermediate && (intermediate += " ");
            intermediate += tmp;
          }
        }
      } else {
        for (const entry in value) {
          if (!value[entry]) continue;
          intermediate && (intermediate += " ");
          intermediate += entry;
        }
      }
    }
  }

  return intermediate;
}

export const slx = ((): ((value: string | { [k: string]: string }) => string) => {
  const declaration = document.createElement("div").style;

  return (value: string | { [k: string]: string }): string => {
    declaration.cssText = "";

    if (typeof value === "string") {
      declaration.cssText = value;
    } else if (typeof value === "object" && value !== null) {
      for (let [k, v] of Object.entries(value)) {
        if (!k.startsWith("--")) k = k.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

        declaration.setProperty(k, v);
      }
    }

    return declaration.cssText;
  };
})();

export const debounce = (f: Function, delay: number) => {
  let timer = -1;

  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => f(...args), delay);
  };
};

export const throttle = (f: Function, delay: number) => {
  let timer: number | null = null;

  return (...args: any[]) => {
    if (timer) return;
    f(...args);
    timer = setTimeout(() => (timer = null), delay);
  };
};
