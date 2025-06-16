/** @typedef {import('../interface.ts').ServiceProvider} ServiceProvider } */
/**
 * Global router state
 *
 * This is where we hold the global mutable state such as current state, current
 * params, current transition, etc.
 * @implements {ServiceProvider}
 */
export class UIRouterGlobals implements ServiceProvider {
  /**
   * Current parameter values
   *
   * The parameter values from the latest successful transition
   * @type {StateParams}
   */
  params: StateParams;
  /**
   * @type {number}
   */
  lastStartedTransitionId: number;
  /**
   * @type {Queue<import("./transition/transition.js").Transition>}
   */
  transitionHistory: Queue<import("./transition/transition.js").Transition>;
  /**
   * @type {Queue<import("./transition/transition.js").Transition>}
   */
  successfulTransitions: Queue<import("./transition/transition.js").Transition>;
  $get: () => this;
}
/**
 * }
 */
export type ServiceProvider = import("../interface.ts").ServiceProvider;
import { StateParams } from "./params/state-params.js";
import { Queue } from "./common/queue.js";
