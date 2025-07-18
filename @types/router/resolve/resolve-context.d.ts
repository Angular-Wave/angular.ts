export namespace resolvePolicies {
  namespace when {
    let LAZY: string;
    let EAGER: string;
  }
  namespace async {
    let WAIT: string;
    let NOWAIT: string;
  }
}
/**
 * Encapsulates Dependency Injection for a path of nodes
 *
 * ng-router states are organized as a tree.
 * A nested state has a path of ancestors to the root of the tree.
 * When a state is being activated, each element in the path is wrapped as a [[PathNode]].
 * A `PathNode` is a stateful object that holds things like parameters and resolvables for the state being activated.
 *
 * The ResolveContext closes over the [[PathNode]]s, and provides DI for the last node in the path.
 */
export class ResolveContext {
  constructor(_path: any);
  _path: any;
  /** Gets all the tokens found in the resolve context, de-duplicated */
  getTokens(): any;
  /**
   * Gets the Resolvable that matches the token
   *
   * Gets the last Resolvable that matches the token in this context, or undefined.
   * Throws an error if it doesn't exist in the ResolveContext
   */
  getResolvable(token: any): any;
  /** Returns the [[ResolvePolicy]] for the given [[Resolvable]] */
  getPolicy(resolvable: any): any;
  /**
   * Returns a ResolveContext that includes a portion of this one
   *
   * Given a state, this method creates a new ResolveContext from this one.
   * The new context starts at the first node (root) and stops at the node for the `state` parameter.
   *
   * #### Why
   *
   * When a transition is created, the nodes in the "To Path" are injected from a ResolveContext.
   * A ResolveContext closes over a path of [[PathNode]]s and processes the resolvables.
   * The "To State" can inject values from its own resolvables, as well as those from all its ancestor state's (node's).
   * This method is used to create a narrower context when injecting ancestor nodes.
   *
   * @example
   * `let ABCD = new ResolveContext([A, B, C, D]);`
   *
   * Given a path `[A, B, C, D]`, where `A`, `B`, `C` and `D` are nodes for states `a`, `b`, `c`, `d`:
   * When injecting `D`, `D` should have access to all resolvables from `A`, `B`, `C`, `D`.
   * However, `B` should only be able to access resolvables from `A`, `B`.
   *
   * When resolving for the `B` node, first take the full "To Path" Context `[A,B,C,D]` and limit to the subpath `[A,B]`.
   * `let AB = ABCD.subcontext(a)`
   */
  subContext(state: any): ResolveContext;
  /**
   * Adds Resolvables to the node that matches the state
   *
   * This adds a [[Resolvable]] (generally one created on the fly; not declared on a [[StateDeclaration.resolve]] block).
   * The resolvable is added to the node matching the `state` parameter.
   *
   * These new resolvables are not automatically fetched.
   * The calling code should either fetch them, fetch something that depends on them,
   * or rely on [[resolvePath]] being called when some state is being entered.
   *
   * Note: each resolvable's [[ResolvePolicy]] is merged with the state's policy, and the global default.
   *
   * @param {Resolvable[]} newResolvables the new Resolvables
   * @param state Used to find the node to put the resolvable on
   */
  addResolvables(newResolvables: Resolvable[], state: any): void;
  /**
   * Returns a promise for an array of resolved path Element promises
   *
   * @param {string} when
   * @param trans
   * @returns {Promise<any>|any}
   */
  resolvePath(when: string, trans: any): Promise<any> | any;
  injector(): UIInjectorImpl;
  _injector: UIInjectorImpl;
  findNode(resolvable: any): undefined;
  /**
   * Gets the async dependencies of a Resolvable
   *
   * Given a Resolvable, returns its dependencies as a Resolvable[]
   * @param {Resolvable} resolvable
   * @returns {Resolvable[]}
   */
  getDependencies(resolvable: Resolvable): Resolvable[];
}
import { Resolvable } from "./resolvable.js";
declare class UIInjectorImpl {
  native: any;
  get(token: any): any;
  getAsync(token: any): Promise<any>;
  getNative(token: any): any;
}
export {};
