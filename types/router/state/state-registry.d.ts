/**
 * A registry for all of the application's [[StateDeclaration]]s
 *
 * This API is found at `$stateRegistry` ([[UIRouter.stateRegistry]])
 */
export class StateRegistryProvider {
    static $inject: string[];
    constructor(urlService: any, stateService: any, globals: any, viewService: any);
    states: {};
    urlService: any;
    urlServiceRules: any;
    $injector: import("../../core/di/internal-injector.js").InjectorService;
    listeners: any[];
    matcher: StateMatcher;
    builder: StateBuilder;
    stateQueue: StateQueueManager;
    $get: (string | (($injector: import("../../core/di/internal-injector.js").InjectorService) => this))[];
    /**
     * This is a [[StateBuilder.builder]] function for angular1 `onEnter`, `onExit`,
     * `onRetain` callback hooks on a [[Ng1StateDeclaration]].
     *
     * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
     * ensures that those hooks are injectable for @uirouter/angularjs (ng1).
     *
     * @internalapi
     */
    getStateHookBuilder(hookName: any): (stateObject: any) => (trans: any, state: any) => any;
    /**
     * @private
     */
    private registerRoot;
    _root: import("./state-object").StateObject;
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
    onStatesChanged(listener: any): any;
    /**
     * Gets the implicit root state
     *
     * Gets the root of the state tree.
     * The root state is implicitly created by ng-router.
     * Note: this returns the internal [[StateObject]] representation, not a [[StateDeclaration]]
     *
     * @return the root [[StateObject]]
     */
    root(): import("./state-object").StateObject;
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
    register(stateDefinition: any): import("./state-object").StateObject;
    _deregisterTree(state: any): any[];
    /**
     * Removes a state from the registry
     *
     * This removes a state from the registry.
     * If the state has children, they are are also removed from the registry.
     *
     * @param stateOrName the state's name or object representation
     * @returns {import('./state-object').StateObject[]} a list of removed states
     */
    deregister(stateOrName: any): import("./state-object").StateObject[];
    get(stateOrName: any, base: any, ...args: any[]): any;
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
    decorator(property: any, builderFunction: any): any;
}
export function getLocals(ctx: any): any;
import { StateMatcher } from "./state-matcher";
import { StateBuilder } from "./state-builder";
import { StateQueueManager } from "./state-queue-manager";
