export type Controller<Root extends Element = Element> = {
  (props: { root: Root }): void;
};
