import type { Worker } from '@core/instruction';
import { register } from '@core/instruction';
import { OPCODES, traverse } from '@core/visitor';

const mount: Worker['mount'] = (opcode, _, scope, skip) => {
  if (opcode === OPCODES.mutate) {
    traverse(OPCODES.unmount, scope.root, scope.parent);
  }

  scope.ignore = true;
  skip();
};

const unmount: Worker['unmount'] = (_, scope) => {
  scope.ignore = false;
};

register({
  name: 'ignore',
  priority: 0,
  mount,
  unmount,
});
