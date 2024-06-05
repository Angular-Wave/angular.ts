const noImpl = (fnname) => () => {
  throw new Error(
    `No implementation for ${fnname}. The framework specific code did not implement this method.`,
  );
};
export const makeStub = (service, methods) =>
  methods.reduce(
    (acc, key) => ((acc[key] = noImpl(`${service}.${key}()`)), acc),
    {},
  );
const services = {
  $q: undefined,
  $injector: undefined,
};
export { services };
