import type { Scope } from '@core/scope';
import { type Droplet, create } from '@core/droplet';
import { type Worker, register } from '@core/instruction';
import { registry } from '@core/registry';
import { scheduler } from '@core/scheduler';
import { state } from '@core/state';
import { sync } from '@pvvrzv/nyx';

declare global {
  interface Element {
    '__x-controller'?: undefined | Map<string, Droplet>;
  }
}

export function addToMountQueue(controller: Droplet) {
  controller.mounted = true;

  scheduler.queue.controller.add(() => {
    state.controller = controller;

    for (const descriptor of controller.mount) {
      const { callback, once } = descriptor;

      const unmount = sync(callback) as unknown;

      if (once) controller.mount.delete(descriptor);

      if (typeof unmount !== 'function') {
        continue;
      }

      controller.unmount.add({
        callback: unmount as (...args: any[]) => any,
        once: true,
      });
    }

    state.controller = undefined;
  });
}

export function addToUnmountQueue(controller: Droplet) {
  controller.mounted = false;

  scheduler.queue.controller.add(() => {
    state.controller = controller;

    for (const descriptor of controller.unmount) {
      const { callback, once } = descriptor;
      callback();
      if (once) controller.unmount.delete(descriptor);
    }

    state.controller = undefined;
  });
}

const mutate = (scope: Scope, descriptor: string) => {
  const { root } = scope;
  const descriptors = (root['__x-controller'] ??= new Map<string, Droplet>());

  const controller = descriptors.get(descriptor)!;

  if (!controller.mounted) {
    addToMountQueue(controller);
    scope.controllers[controller.record.name] = controller;
  } 
};

const initialize = (scope: Scope, descriptor: string, root: Element) => {
  const record = registry.get(descriptor);

  if (!record) return;

  const { controller, name } = record;

  const descriptors = (root['__x-controller'] ??= new Map<string, Droplet>());

  const droplet = create(record, root);

  state.controller = droplet;
  sync(() => controller({ root }));
  state.controller = undefined;

  scope.controllers[name] = droplet;
  descriptors.set(name, droplet);

  scheduler.queue.controller.add(() => {
    state.controller = droplet;

    for (const callback of droplet.setup) {
      sync(callback);
    }

    state.controller = undefined;
  });

  addToMountQueue(droplet);
};

const mount: Worker['mount'] = (_, instrunction, scope) => {
  const { root } = scope;
  const tokens = instrunction.attr.value.trim().split(/\s+/);

  if (!tokens) return;

  const descriptors = (root['__x-controller'] ??= new Map<string, Droplet>());

  for (const [token, controller] of descriptors) {
    if (tokens.includes(token)) continue;

    addToUnmountQueue(controller);

    delete scope.controllers[token];
  }

  for (const token of tokens) {
    if (descriptors.has(token)) {
      mutate(scope, token);
    } else {
      initialize(scope, token, root);
    }
  }
};

const unmount: Worker['unmount'] = (_, scope) => {
  const { root } = scope;
  const descriptors = (root['__x-controller'] ??= new Map<string, Droplet>());

  for (const [identifier, controller] of descriptors) {
    addToUnmountQueue(controller);

    delete scope.controllers[identifier];
  }
};

register({
  name: 'controller',
  priority: 3,
  mount,
  unmount,
});
