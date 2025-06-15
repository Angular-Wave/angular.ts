/**
 * Global router state
 *
 * This is where we hold the global mutable state such as current state, current
 * params, current transition, etc.
 */
export class UIRouterGlobals {
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
  $get: (() => this)[];
}
import { StateParams } from "./params/state-params.js";
import { Queue } from "./common/queue.js";
