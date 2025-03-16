import { registry } from "./registry";
import { scheduler } from "./scheduler";
import { state } from "./state";
import { mount, unmount } from "./controller";

declare global {
  interface Element {
    ["__x-root"]?: true;
  }
}

export class DescendantObservationAttemptError extends Error {
  constructor() {
    super("Current element is already a part of an observed subtree");
  }
}

export class RepeatedObservationAttemptError extends Error {
  constructor() {
    super("Current element is already observed");
  }
}

export class AscendantObservationAttemptError extends Error {
  constructor() {
    super("Current element includes nested observed elements");
  }
}

export class UnknownObservedTargetTypeError extends Error {
  constructor() {
    super("Only able to observe Elements");
  }
}

function iterate(root: Element, callback: (element: Element) => unknown, selector = "[x-controller]") {
  const elements = root.querySelectorAll(selector);

  if (root.matches(selector)) callback(root);

  for (const element of elements) {
    callback(element);
  }
}

function closest(element: Element): Element | null {
  if (element["__x-root"]) return element;

  return element.parentElement ? closest(element.parentElement) : null;
}

const OPTIONS = {
  subtree: true,
  childList: true,
  attributes: true,
  attributeOldValue: true,
};

class Observer {
  private delegate: MutationObserver;
  private roots: Set<Element> = new Set();

  constructor() {
    this.delegate = new MutationObserver(this.process.bind(this));

    registry.listen(({ name }) => {
      for (const root of this.roots) {
        iterate(root, mount, `[x-controller~="${name}"]`);
      }
    });
  }

  public observe(root: Element) {
    if (!(root instanceof Element)) throw new UnknownObservedTargetTypeError();
    if (root["__x-root"]) throw new RepeatedObservationAttemptError();
    if (closest(root)) throw new DescendantObservationAttemptError();

    for (const observed of this.roots) {
      if (root.contains(observed)) throw new AscendantObservationAttemptError();
    }

    root["__x-root"] = true;

    this.roots.add(root);
    this.delegate.observe(root, OPTIONS);

    iterate(root, mount);

    scheduler.yeild();
  }

  public ignore(root: Element) {
    if (!(root instanceof Element)) throw new Error("Only able to disconnect Elements");
    if (!root["__x-root"]) return;

    try {
      iterate(root, unmount);

      scheduler.yeild();
    } finally {
      state.droplet = undefined;
      scheduler.clear();
    }

    this.delegate.disconnect();
    this.roots.delete(root);

    for (const root of this.roots) {
      this.delegate.observe(root, OPTIONS);
    }

    delete root["__x-root"];

    return true;
  }

  private process(records: MutationRecord[]) {
    try {
      for (const record of records) {
        if (
          record.type === "attributes" &&
          record.target instanceof Element &&
          record.attributeName === "x-controller"
        ) {
          if (record.target.hasAttribute("x-controller")) mount(record.target);
          else unmount(record.target);
        }

        for (const node of record.removedNodes) {
          if (node instanceof Element && !node.isConnected) iterate(node, unmount);
        }

        for (const node of record.addedNodes) {
          if (node instanceof Element) iterate(node, mount);
        }
      }

      scheduler.yeild();
    } finally {
      state.droplet = undefined;
      scheduler.clear();
    }
  }
}

export const observer = new Observer();

export const observe = observer.observe.bind(observer);
export const ignore = observer.ignore.bind(observer);
