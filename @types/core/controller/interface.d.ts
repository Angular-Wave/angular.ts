export type ControllerService = (
  expression: string | Function | any[],
  locals?: Record<string, any>,
  later?: boolean,
  ident?: string,
) => object | (() => object);
