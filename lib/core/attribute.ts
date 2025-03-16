import { type Instruction } from './instruction';

export type Attribute<V extends string | null = string | null> = {
  name: string;
  value: V;
};

export function parse(attributes: Attribute[]): Instruction[] {
  return attributes.map((attribute) => {
    const [main, ...modifiers] = attribute.name.split('.');
    const [name, argument] = main!.split(':', 2);

    return {
      name: name!,
      argument,
      modifiers,
      attr: attribute,
    };
  });
}

export function filter(attributes: Attribute[]): Attribute[] {
  return attributes.filter((attr) => attr.name.startsWith('x-'));
}

export function test(name: string): boolean {
  return name.startsWith('x-');
}
