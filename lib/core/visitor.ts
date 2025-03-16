import { observer } from './observer';
import { filter, parse } from './attribute';
import { type Instruction, sort, store } from './instruction';
import { type Scope, extend, create } from './scope';

declare global {
  interface Element {
    ['__x-scope']?: Scope;
  }
}

export enum OPCODES {
  mount,
  unmount,
  mutate,
}

let _skip = false;

const skip = () => (_skip = true);

export function traverse(
  opcode: OPCODES,
  element: Element,
  scope: Scope | null
) {
  _skip = false;

  const _scope = visit(opcode, element, scope);

  if (_skip) return;

  for (const child of element.children) {
    traverse(opcode, child, _scope);
  }
}

export function visit(
  opcode: OPCODES,
  element: Element,
  scope: Scope | null
): Scope | null {
  const instructions = parse(filter(Array.from(element.attributes)));
  const mutations = observer.mutations.get(element);

  if (mutations) {
    instructions.push(...parse(mutations));
    observer.mutations.delete(element);
  }

  if (instructions.length === 0) return scope;

  const _scope = (element['__x-scope'] ??= scope
    ? extend(element, scope)
    : create(element));

  for (const instruction of sort(instructions)) {
    if (_skip) break;

    const worker = store[instruction.name];

    if (!worker) continue;

    if (opcode !== OPCODES.unmount && instruction.attr.value !== null) {
      worker.mount(opcode, instruction as Instruction<string>, _scope, skip);
    } else {
      worker.unmount(instruction, _scope, skip);
    }
  }

  return _scope;
}
