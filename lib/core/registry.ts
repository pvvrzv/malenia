import type { Controller } from './controller';
import { observer } from './observer';

class MissingControllerError extends Error {
  constructor() {
    super('Called register method with no controller argument.');
  }
}

class WrongIdentifierTypeError extends Error {
  constructor() {
    super(
      'Controller identifier MUST be specified and MUST be of a type "string".'
    );
  }
}

export class Record {
  constructor(public name: string, public controller: Controller) {}
}

class Registry {
  public records: Map<string, Record> = new Map();
  private listeners: Set<(record: Record) => any> = new Set();

  register(identifier: string, controller: Controller<any>): void {
    if (!observer.idle) {
      throw new Error('Not Idle');
    }

    if (!controller) {
      throw new MissingControllerError();
    }

    if (typeof controller !== 'function') {
      throw new Error('Undexpected controller type');
    }

    if (typeof identifier !== 'string') {
      throw new WrongIdentifierTypeError();
    }

    const record = new Record(identifier, controller);

    this.records.set(identifier, record);

    for (const listener of this.listeners) {
      listener(record);
    }
  }

  get(identifier: string): Record | void {
    return this.records.get(identifier);
  }

  listen(listener: (record: Record) => any) {
    this.listeners.add(listener);
  }
}

export const registry = new Registry();

export const register = registry.register.bind(registry);
