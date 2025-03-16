import { type Droplet, create } from "./droplet";
import { registry } from "./registry";
import { scheduler } from "./scheduler";
import { state } from "./state";

export type Controller<Root extends Element = Element> = {
  (props: { root: Root }): void;
};

declare global {
  interface Element {
    "__x-controller"?: undefined | Map<string, Droplet>;
  }
}

export function scheduleMount(droplet: Droplet) {
  droplet.mounted = true;

  scheduler.queue.add(() => {
    state.droplet = droplet;

    for (const descriptor of droplet.mount) {
      const { callback, once } = descriptor;
      const unmount = callback();

      if (once) droplet.mount.delete(descriptor);
      if (typeof unmount !== "function") continue;

      droplet.unmount.add({ callback: unmount, once: true });
    }

    state.droplet = undefined;
  });
}

export function scheduleUnmount(droplet: Droplet) {
  droplet.mounted = false;

  scheduler.queue.add(() => {
    state.droplet = droplet;

    for (const descriptor of droplet.unmount) {
      const { callback, once } = descriptor;
      callback();
      if (once) droplet.unmount.delete(descriptor);
    }

    state.droplet = undefined;
  });
}

export function mount(root: Element) {
  const tokens = root.attributes.getNamedItem("x-controller")?.value.trim().split(/\s+/);

  if (!tokens) return;

  const descriptors = (root["__x-controller"] ??= new Map<string, Droplet>());

  for (const [token, controller] of descriptors) {
    if (tokens.includes(token)) continue;

    scheduleUnmount(controller);
  }

  for (const token of tokens) {
    if (descriptors.has(token)) {
      const droplet = descriptors.get(token)!;

      if (!droplet.mounted) scheduleMount(droplet);
    } else {
      const record = registry.get(token);

      if (!record) continue;

      const { controller, name } = record;
      const droplet = create(record, root);

      state.droplet = droplet;
      controller({ root });
      state.droplet = undefined;

      descriptors.set(name, droplet);

      scheduleMount(droplet);
    }
  }
}

export function unmount(root: Element) {
  const descriptors = root["__x-controller"];

  if (!descriptors) return;

  for (const [_, controller] of descriptors) {
    scheduleUnmount(controller);
  }
}
