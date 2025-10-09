/**
 * Encapsulate the target (destination) state/params/options of a [[Transition]].
 *
 * This class is frequently used to redirect a transition to a new destination.
 *
 * See:
 *
 * - [[HookResult]]
 * - [[TransitionHookFn]]
 * - [[TransitionService.onStart]]
 *
 * To create a `TargetState`, use [[StateService.target]].
 *
 * ---
 *
 * This class wraps:
 *
 * 1) an identifier for a state
 * 2) a set of parameters
 * 3) and transition options
 * 4) the registered state object (the [[StateDeclaration]])
 *
 * Many ng-router APIs such as [[StateService.go]] take a [[StateOrName]] argument which can
 * either be a *state object* (a [[StateDeclaration]] or [[StateObject]]) or a *state name* (a string).
 * The `TargetState` class normalizes those options.
 *
 * A `TargetState` may be valid (the state being targeted exists in the registry)
 * or invalid (the state being targeted is not registered).
 */
export class TargetState {
  /**
   * The TargetState constructor
   *
   * Note: Do not construct a `TargetState` manually.
   * To create a `TargetState`, use the [[StateService.target]] factory method.
   *
   * @param _stateRegistry The StateRegistry to use to look up the _definition
   * @param _identifier An identifier for a state.
   *    Either a fully-qualified state name, or the object used to define the state.
   * @param _params Parameters for the target state
   * @param _options Transition options.
   *
   * @internal
   */
  constructor(
    _stateRegistry: any,
    _identifier: any,
    _params: any,
    _options: any,
  );
  _stateRegistry: any;
  _identifier: any;
  _params: any;
  _options: any;
  _definition: any;
  /** The name of the state this object targets */
  name(): any;
  /** The identifier used when creating this TargetState */
  identifier(): any;
  /** The target parameter values */
  params(): any;
  /** The internal state object (if it was found) */
  $state(): any;
  /** The internal state declaration (if it was found) */
  state(): any;
  /** The target options */
  options(): any;
  /** True if the target state was found */
  exists(): boolean;
  /** True if the object is valid */
  valid(): boolean;
  /** If the object is invalid, returns the reason why */
  error(): string;
  toString(): string;
  /**
   * Returns a copy of this TargetState which targets a different state.
   * The new TargetState has the same parameter values and transition options.
   *
   * @param state The new state that should be targeted
   */
  withState(state: any): TargetState;
  /**
   * Returns a copy of this TargetState, using the specified parameter values.
   *
   * @param params the new parameter values to use
   * @param replace When false (default) the new parameter values will be merged with the current values.
   *                When true the parameter values will be used instead of the current values.
   */
  withParams(params: any, replace?: boolean): TargetState;
  /**
   * Returns a copy of this TargetState, using the specified Transition Options.
   *
   * @param options the new options to use
   * @param replace When false (default) the new options will be merged with the current options.
   *                When true the options will be used instead of the current options.
   */
  withOptions(options: any, replace?: boolean): TargetState;
}
export namespace TargetState {
  /** Returns true if the object has a state property that might be a state or state name */
  function isDef(obj: any): boolean;
}
