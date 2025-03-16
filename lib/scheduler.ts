class Scheduler {
  public queue: Set<() => unknown>;

  constructor() {
    this.queue = new Set();
  }

  public yeild() {
    for (const f of this.queue) {
      f();
    }

    this.clear();
  }

  public clear() {
    this.queue.clear();
  }
}

export const scheduler = new Scheduler();
