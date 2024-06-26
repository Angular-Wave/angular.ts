import { StateMatcher } from "./state-matcher";
import { StateBuilder } from "./state-builder";
import { StateQueueManager } from "./state-queue-manager";
import { removeFrom } from "../../shared/common";
import { propEq } from "../../shared/hof";
/**
 * A registry for all of the application's [[StateDeclaration]]s
 *
 * This API is found at `router.stateRegistry` ([[UIRouter.stateRegistry]])
 */
export class StateRegistry {
  constructor(router, urlMatcherFactory, urlServiceRules) {
    this.router = router;
    this.states = {};

    this.listeners = [];
    this.matcher = new StateMatcher(this.states);
    this.builder = new StateBuilder(this.matcher, urlMatcherFactory);
    this.stateQueue = new StateQueueManager(
      router,
      urlServiceRules,
      this.states,
      this.builder,
      this.listeners,
    );
    this._registerRoot();
  }

  _registerRoot() {
    const rootStateDef = {
      name: "",
      url: "^",
      views: null,
      params: {
        "#": { value: null, type: "hash", dynamic: true },
      },
      abstract: true,
    };
    const _root = (this._root = this.stateQueue.register(rootStateDef));
    _root.navigable = null;
  }

  /**
   * Listen for a State Registry events
   *
   * Adds a callback that is invoked when states are registered or deregistered with the StateRegistry.
   *
   * #### Example:
   * ```js
   * let allStates = registry.get();
   *
   * // Later, invoke deregisterFn() to remove the listener
   * let deregisterFn = registry.onStatesChanged((event, states) => {
   *   switch(event) {
   *     case: 'registered':
   *       states.forEach(state => allStates.push(state));
   *       break;
   *     case: 'deregistered':
   *       states.forEach(state => {
   *         let idx = allStates.indexOf(state);
   *         if (idx !== -1) allStates.splice(idx, 1);
   *       });
   *       break;
   *   }
   * });
   * ```
   *
   * @param listener a callback function invoked when the registered states changes.
   *        The function receives two parameters, `event` and `state`.
   *        See [[StateRegistryListener]]
   * @return a function that deregisters the listener
   */
  onStatesChanged(listener) {
    this.listeners.push(listener);
    return function deregisterListener() {
      removeFrom(this.listeners)(listener);
    }.bind(this);
  }
  /**
   * Gets the implicit root state
   *
   * Gets the root of the state tree.
   * The root state is implicitly created by UI-Router.
   * Note: this returns the internal [[StateObject]] representation, not a [[StateDeclaration]]
   *
   * @return the root [[StateObject]]
   */
  root() {
    return this._root;
  }
  /**
   * Adds a state to the registry
   *
   * Registers a [[StateDeclaration]] or queues it for registration.
   *
   * Note: a state will be queued if the state's parent isn't yet registered.
   *
   * @param stateDefinition the definition of the state to register.
   * @returns the internal [[StateObject]] object.
   *          If the state was successfully registered, then the object is fully built (See: [[StateBuilder]]).
   *          If the state was only queued, then the object is not fully built.
   */
  register(stateDefinition) {
    return this.stateQueue.register(stateDefinition);
  }

  _deregisterTree(state) {
    const all = this.get().map((s) => s.$$state());
    const getChildren = (states) => {
      const _children = all.filter((s) => states.indexOf(s.parent) !== -1);
      return _children.length === 0
        ? _children
        : _children.concat(getChildren(_children));
    };
    const children = getChildren([state]);
    const deregistered = [state].concat(children).reverse();
    deregistered.forEach((_state) => {
      const rulesApi = this.router.urlService.rules;
      // Remove URL rule
      rulesApi
        .rules()
        .filter(propEq("state", _state))
        .forEach((rule) => rulesApi.removeRule(rule));
      // Remove state from registry
      delete this.states[_state.name];
    });
    return deregistered;
  }
  /**
   * Removes a state from the registry
   *
   * This removes a state from the registry.
   * If the state has children, they are are also removed from the registry.
   *
   * @param stateOrName the state's name or object representation
   * @returns {StateObject[]} a list of removed states
   */
  deregister(stateOrName) {
    const _state = this.get(stateOrName);
    if (!_state)
      throw new Error("Can't deregister state; not found: " + stateOrName);
    const deregisteredStates = this._deregisterTree(_state.$$state());
    this.listeners.forEach((listener) =>
      listener(
        "deregistered",
        deregisteredStates.map((s) => s.self),
      ),
    );
    return deregisteredStates;
  }
  get(stateOrName, base) {
    if (arguments.length === 0)
      return Object.keys(this.states).map((name) => this.states[name].self);
    const found = this.matcher.find(stateOrName, base);
    return (found && found.self) || null;
  }
  /**
   * Registers a [[BuilderFunction]] for a specific [[StateObject]] property (e.g., `parent`, `url`, or `path`).
   * More than one BuilderFunction can be registered for a given property.
   *
   * The BuilderFunction(s) will be used to define the property on any subsequently built [[StateObject]] objects.
   *
   * @param property The name of the State property being registered for.
   * @param builderFunction The BuilderFunction which will be used to build the State property
   * @returns a function which deregisters the BuilderFunction
   */
  decorator(property, builderFunction) {
    return this.builder.builder(property, builderFunction);
  }
}
