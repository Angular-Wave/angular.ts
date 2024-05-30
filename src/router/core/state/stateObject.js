import { defaults, find, inherit } from "../common/common";
import { propEq } from "../common/hof";
import { Glob } from "../common/glob";
import { isObject, isFunction } from "../common/predicates";
/**
 * Internal representation of a UI-Router state.
 *
 * Instances of this class are created when a [[StateDeclaration]] is registered with the [[StateRegistry]].
 *
 * A registered [[StateDeclaration]] is augmented with a getter ([[StateDeclaration.$$state]]) which returns the corresponding [[StateObject]] object.
 *
 * This class prototypally inherits from the corresponding [[StateDeclaration]].
 * Each of its own properties (i.e., `hasOwnProperty`) are built using builders from the [[StateBuilder]].
 */
export class StateObject {
  /**
   * Create a state object to put the private/internal implementation details onto.
   * The object's prototype chain looks like:
   * (Internal State Object) -> (Copy of State.prototype) -> (State Declaration object) -> (State Declaration's prototype...)
   *
   * @param stateDecl the user-supplied State Declaration
   * @returns {StateObject} an internal State object
   */
  static create(stateDecl) {
    stateDecl = StateObject.isStateClass(stateDecl)
      ? new stateDecl()
      : stateDecl;
    const state = inherit(inherit(stateDecl, StateObject.prototype));
    stateDecl.$$state = () => state;
    state.self = stateDecl;
    state.__stateObjectCache = {
      nameGlob: Glob.fromString(state.name), // might return null
    };
    return state;
  }
  /** @deprecated use State.create() */
  constructor(config) {
    return StateObject.create(config || {});
  }
  /**
   * Returns true if the provided parameter is the same state.
   *
   * Compares the identity of the state against the passed value, which is either an object
   * reference to the actual `State` instance, the original definition object passed to
   * `$stateProvider.state()`, or the fully-qualified name.
   *
   * @param ref Can be one of (a) a `State` instance, (b) an object that was passed
   *        into `$stateProvider.state()`, (c) the fully-qualified name of a state as a string.
   * @returns Returns `true` if `ref` matches the current `State` instance.
   */
  is(ref) {
    return this === ref || this.self === ref || this.fqn() === ref;
  }
  /**
   * @deprecated this does not properly handle dot notation
   * @returns Returns a dot-separated name of the state.
   */
  fqn() {
    if (!this.parent || !(this.parent instanceof this.constructor))
      return this.name;
    const name = this.parent.fqn();
    return name ? name + "." + this.name : this.name;
  }
  /**
   * Returns the root node of this state's tree.
   *
   * @returns The root of this state's tree.
   */
  root() {
    return (this.parent && this.parent.root()) || this;
  }
  /**
   * Gets the state's `Param` objects
   *
   * Gets the list of [[Param]] objects owned by the state.
   * If `opts.inherit` is true, it also includes the ancestor states' [[Param]] objects.
   * If `opts.matchingKeys` exists, returns only `Param`s whose `id` is a key on the `matchingKeys` object
   *
   * @param opts options
   */
  parameters(opts) {
    opts = defaults(opts, { inherit: true, matchingKeys: null });
    const inherited =
      (opts.inherit && this.parent && this.parent.parameters()) || [];
    return inherited
      .concat(Object.values(this.params))
      .filter(
        (param) =>
          !opts.matchingKeys || opts.matchingKeys.hasOwnProperty(param.id),
      );
  }
  /**
   * Returns a single [[Param]] that is owned by the state
   *
   * If `opts.inherit` is true, it also searches the ancestor states` [[Param]]s.
   * @param id the name of the [[Param]] to return
   * @param opts options
   */
  parameter(id, opts = {}) {
    return (
      (this.url && this.url.parameter(id, opts)) ||
      find(Object.values(this.params), propEq("id", id)) ||
      (opts.inherit && this.parent && this.parent.parameter(id))
    );
  }
  toString() {
    return this.fqn();
  }
}
/** Predicate which returns true if the object is an class with @State() decorator */
StateObject.isStateClass = (stateDecl) =>
  isFunction(stateDecl) && stateDecl["__uiRouterState"] === true;
/** Predicate which returns true if the object is a [[StateDeclaration]] object */
StateObject.isStateDeclaration = (obj) => isFunction(obj["$$state"]);
/** Predicate which returns true if the object is an internal [[StateObject]] object */
StateObject.isState = (obj) => isObject(obj["__stateObjectCache"]);
