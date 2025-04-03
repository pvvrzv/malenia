import type { Controller } from "./controller";

class MissingControllerError extends Error {
  constructor() {
    super("Called register method with no controller argument.");
  }
}

class WrongIdentifierTypeError extends Error {
  constructor() {
    super('Controller identifier MUST be specified and MUST be of a type "string".');
  }
}

class UnexpectedControllerTypeError extends Error {
  constructor() {
    super("Unexpected controller type");
  }
}

export type Record = {
  name: string;
  controller: Controller;
};

class Registry {
  public records: Map<string, Record> = new Map();
  private listeners: Set<(record: Record) => any> = new Set();

  register(name: string, controller: Controller<any>): void {
    if (!controller) {
      throw new MissingControllerError();
    }

    if (typeof controller !== "function") {
      throw new UnexpectedControllerTypeError();
    }

    if (typeof name !== "string") {
      throw new WrongIdentifierTypeError();
    }

    const record = { name, controller };

    this.records.set(name, record);

    for (const listener of this.listeners) {
      listener(record);
    }
  }

  get(name: string): Record | void {
    return this.records.get(name);
  }

  listen(listener: (record: Record) => any) {
    this.listeners.add(listener);
  }
}

export const registry = new Registry();

export const register = registry.register.bind(registry);
