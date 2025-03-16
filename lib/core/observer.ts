import { traverse, OPCODES } from './visitor';
import { closest, create } from './scope';
import { type Attribute, test } from './attribute';
import { registry } from './registry';
import { scheduler } from './scheduler';
import { group } from '@pvvrzv/nyx';
import { StateError } from './errors';
import { state } from './state';

import.meta.glob('../instructions/*', { eager: true });

declare global {
  interface Element {
    ['__x-root']?: true;
    ['__x-nonce']?: number;
  }
}

const closestRoot = (element: Element): boolean => {
  if (element['__x-root']) return true;

  if (!element.parentElement) return false;

  return closestRoot(element.parentElement);
};

const OPTIONS = {
  subtree: true,
  childList: true,
  attributes: true,
  attributeOldValue: true,
};

class Observer {
  private delegate: MutationObserver;
  private roots: Set<Element> = new Set();
  public idle: boolean = true;
  public queue = new Set<{ element: Element; opcode: OPCODES }>();
  public mutations = new Map<Element, Attribute[]>();
  public nonce: number = 0;

  constructor() {
    this.delegate = new MutationObserver(this.process.bind(this));

    registry.listen(({ name }) => {
      for (const root of this.roots) {
        if (root.querySelector(`[x-controller~="${name}"]`)) {
          const parent = root.parentElement;
          const scope = parent ? closest(parent) || create(root) : create(root);

          this.process(this.delegate.takeRecords());

          try {
            this.idle = false;

            group(() => {
              traverse(OPCODES.mount, root, scope);
            });

            scheduler.tick();
          } finally {
            state.controller = undefined;
            this.idle = true;
            scheduler.clear();
          }
        }
      }
    });
  }

  public observe(root: Element) {
    if (!this.idle) {
      throw new StateError('Unable to observe an element');
    }

    if (!(root instanceof Element)) {
      throw new Error('Only able to observe Elements');
    }

    if (root['__x-root']) {
      throw new Error('Current element is already observed');
    }

    if (closestRoot(root)) {
      throw new Error(
        'Current element is already a part of an observed subtree'
      );
    }

    for (const observed of this.roots) {
      if (root.contains(observed)) {
        throw new Error('Current element includes nested observed elements');
      }
    }

    root['__x-root'] = true;

    this.roots.add(root);

    this.process(this.delegate.takeRecords());

    this.delegate.observe(root, OPTIONS);

    try {
      this.idle = false;

      group(() => {
        traverse(OPCODES.mount, root, null);
      });

      scheduler.tick();
    } finally {
      state.controller = undefined;
      this.idle = true;
      scheduler.clear();
    }
  }

  public disconnect(root: Element) {
    if (!this.idle) {
      throw new StateError('Unable to disconnect an element');
    }

    if (!(root instanceof Element)) {
      throw new Error('Only able to disconnect Elements');
    }

    if (!root['__x-root']) {
      if (closestRoot(root)) {
        throw new Error(
          'Element is a part of an observed subtree, use `x-ignore` to inore it'
        );
      }

      throw new Error('Element is not observed');
    }

    const parent = root.parentElement;
    const scope = parent ? closest(parent) || create(root) : create(root);

    this.process(this.delegate.takeRecords());

    try {
      this.idle = false;

      group(() => {
        traverse(OPCODES.unmount, root, scope);
      });

      scheduler.tick();
    } finally {
      state.controller = undefined;
      this.idle = true;
      scheduler.clear();
    }

    this.delegate.disconnect();
    this.roots.delete(root);

    for (const root of this.roots) {
      this.delegate.observe(root, OPTIONS);
    }

    delete root['__x-root'];

    return true;
  }

  force() {
    if (!this.idle) {
      throw new Error('Not Idle');
    }

    this.process(this.delegate.takeRecords());
  }

  private process(records: MutationRecord[]) {
    if (records.length === 0) return;

    this.parse(records);

    try {
      this.idle = false;

      group(() => {
        const visited = new Set<Element>();

        for (const { element, opcode } of this.queue) {
          if (visited.has(element)) continue;
          const parent = element.parentElement;
          const scope = parent ? closest(parent) : null;

          if (scope?.ignore) continue;

          traverse(opcode, element, scope);
          visited.add(element);
        }
      });

      scheduler.tick();
    } finally {
      state.controller = undefined;
      this.idle = true;
      this.mutations.clear();
      this.queue.clear();
      scheduler.clear();
    }
  }

  private parse(records: MutationRecord[]) {
    this.nonce++;

    for (const {
      type,
      target,
      addedNodes,
      removedNodes,
      attributeName,
    } of records) {
      switch (type) {
        case 'attributes':
          if (!test(attributeName!)) break;

          this.queue.add({
            element: target as Element,
            opcode: OPCODES.mutate,
          });

          if (
            (target as Element).attributes.getNamedItem(attributeName!) !== null
          ) {
            break;
          }

          let list = this.mutations.get(target as Element);

          if (!list) {
            this.mutations.set(target as Element, (list = []));
          }

          list.push({ name: attributeName!, value: null });

          break;

        case 'childList':
          for (const node of addedNodes) {
            (node as Element)['__x-nonce'] = this.nonce;
            if (!node.isConnected || node.nodeType !== Node.ELEMENT_NODE) continue;

            this.queue.add({ element: node as Element, opcode: OPCODES.mount });
          }

          for (const node of removedNodes) {
            if (
              (node as Element)['__x-nonce'] === this.nonce ||
              node.isConnected ||
              node.nodeType !== Node.ELEMENT_NODE
            )
              continue;

            this.queue.add({
              element: node as Element,
              opcode: OPCODES.unmount,
            });
          }

          break;
      }
    }
  }
}

export const observer = new Observer();

export const observe = observer.observe.bind(observer);
export const disconnect = observer.disconnect.bind(observer);
export const force = observer.force.bind(observer);
