export class ReferenceError extends Error {
  constructor(signal: string, controller: string) {
    super(`Reference Error: ${signal} is not provided by ${controller}`);
  }
}

export class SyntaxError extends Error {
  constructor(message: string) {
    super(`Syntax Error: ${message}`);
  }
}

export class StateError extends Error {
  constructor(message: string) {
    super(`State Error: ${message}`);
  }
}
