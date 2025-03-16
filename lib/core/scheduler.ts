interface Queue {
  controller: Set<() => any>;
  immediate: Set<() => any>;
}

class Scheduler {
  public queue: Queue;

  constructor() {
    this.queue = {
      controller: new Set(),
      immediate: new Set(),
    };
  }

  public immediate(callback: () => any) {
    this.queue.immediate.add(callback);
  }

  public tick() {
    this.queue.controller.forEach((f) => f());
    this.queue.immediate.forEach((f) => f());

    this.clear();
  }

  public clear() {
    this.queue.controller.clear();
    this.queue.immediate.clear();
  }
}

export const scheduler = new Scheduler();

export const immediate = scheduler.immediate.bind(scheduler);
