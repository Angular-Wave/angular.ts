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
   * @type {Number}
   */
  lastStartedTransitionId: number;
  /**
   * @type {Queue}
   */
  transitionHistory: Queue;
  /**
   * @type {Queue}
   */
  successfulTransitions: Queue;
  $get: (() => this)[];
}
import { StateParams } from "./params/state-params.js";
import { Queue } from "./common/queue.js";
