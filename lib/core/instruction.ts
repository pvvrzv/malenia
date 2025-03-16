import { OPCODES } from './visitor';
import type { Attribute } from './attribute';
import type { Scope } from './scope';

export type Instruction<V extends string | null = string | null> = {
  name: string;
  argument: string | undefined;
  modifiers: string[] | undefined;
  attr: Attribute<V>;
};

export type Worker = {
  name: string;
  priority: number;
  mount: (
    opcode: OPCODES,
    instruction: Instruction<string>,
    scope: Scope,
    skip: () => void
  ) => void;
  unmount: (instruction: Instruction, scope: Scope, skip: () => void) => void;
};

export const store: Record<string, Worker> = {};

export function sort(instructions: Instruction[]): Instruction[] {
  return instructions.sort(
    (a, b) => (store[a.name]?.priority || 0) - (store[b.name]?.priority || 0)
  );
}

export const register = (worker: Worker) => {
  store[`x-${worker.name}`] = worker;
};
