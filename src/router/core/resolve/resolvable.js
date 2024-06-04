import { identity } from "../../../shared/utils";
import { services } from "../common/coreservices";
import { trace } from "../common/trace";
import { stringify } from "../common/strings";
import { isFunction, isObject } from "../common/predicates";
import { isNullOrUndefined } from "../common/predicates";
// TODO: explicitly make this user configurable
export let defaultResolvePolicy = {
  when: "LAZY",
  async: "WAIT",
};
/**
 * The basic building block for the resolve system.
 *
 * Resolvables encapsulate a state's resolve's resolveFn, the resolveFn's declared dependencies, the wrapped (.promise),
 * and the unwrapped-when-complete (.data) result of the resolveFn.
 *
 * Resolvable.get() either retrieves the Resolvable's existing promise, or else invokes resolve() (which invokes the
 * resolveFn) and returns the resulting promise.
 *
 * Resolvable.get() and Resolvable.resolve() both execute within a context path, which is passed as the first
 * parameter to those fns.
 */
export class Resolvable {
  constructor(arg1, resolveFn, deps, policy, data) {
    this.resolved = false;
    this.promise = undefined;
    if (arg1 instanceof Resolvable) {
      Object.assign(this, arg1);
    } else if (isFunction(resolveFn)) {
      if (isNullOrUndefined(arg1))
        throw new Error("new Resolvable(): token argument is required");
      if (!isFunction(resolveFn))
        throw new Error(
          "new Resolvable(): resolveFn argument must be a function",
        );
      this.token = arg1;
      this.policy = policy;
      this.resolveFn = resolveFn;
      this.deps = deps || [];
      this.data = data;
      this.resolved = data !== undefined;
      this.promise = this.resolved ? services.$q.when(this.data) : undefined;
    } else if (
      isObject(arg1) &&
      arg1.token &&
      (arg1.hasOwnProperty("resolveFn") || arg1.hasOwnProperty("data"))
    ) {
      const literal = arg1;
      return new Resolvable(
        literal.token,
        literal.resolveFn,
        literal.deps,
        literal.policy,
        literal.data,
      );
    }
  }
  getPolicy(state) {
    const thisPolicy = this.policy || {};
    const statePolicy = (state && state.resolvePolicy) || {};
    return {
      when: thisPolicy.when || statePolicy.when || defaultResolvePolicy.when,
      async:
        thisPolicy.async || statePolicy.async || defaultResolvePolicy.async,
    };
  }
  /**
   * Asynchronously resolve this Resolvable's data
   *
   * Given a ResolveContext that this Resolvable is found in:
   * Wait for this Resolvable's dependencies, then invoke this Resolvable's function
   * and update the Resolvable's state
   */
  resolve(resolveContext, trans) {
    const $q = services.$q;
    // Gets all dependencies from ResolveContext and wait for them to be resolved
    const getResolvableDependencies = () =>
      $q.all(
        resolveContext
          .getDependencies(this)
          .map((resolvable) => resolvable.get(resolveContext, trans)),
      );
    // Invokes the resolve function passing the resolved dependencies as arguments
    const invokeResolveFn = (resolvedDeps) =>
      this.resolveFn.apply(null, resolvedDeps);
    const node = resolveContext.findNode(this);
    const state = node && node.state;
    const asyncPolicy = this.getPolicy(state).async;
    const customAsyncPolicy = isFunction(asyncPolicy) ? asyncPolicy : identity;
    // After the final value has been resolved, update the state of the Resolvable
    const applyResolvedValue = (resolvedValue) => {
      this.data = resolvedValue;
      this.resolved = true;
      this.resolveFn = null;
      trace.traceResolvableResolved(this, trans);
      return this.data;
    };
    // Sets the promise property first, then getsResolvableDependencies in the context of the promise chain. Always waits one tick.
    return (this.promise = $q
      .when()
      .then(getResolvableDependencies)
      .then(invokeResolveFn)
      .then(customAsyncPolicy)
      .then(applyResolvedValue));
  }
  /**
   * Gets a promise for this Resolvable's data.
   *
   * Fetches the data and returns a promise.
   * Returns the existing promise if it has already been fetched once.
   */
  get(resolveContext, trans) {
    return this.promise || this.resolve(resolveContext, trans);
  }
  toString() {
    return `Resolvable(token: ${stringify(this.token)}, requires: [${this.deps.map(stringify)}])`;
  }
  clone() {
    return new Resolvable(this);
  }
}
Resolvable.fromData = (token, data) =>
  new Resolvable(token, () => data, null, null, data);
