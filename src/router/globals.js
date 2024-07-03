import { StateParams } from "./params/state-params";
import { Queue } from "./common/queue";
/**
 * Global router state
 *
 * This is where we hold the global mutable state such as current state, current
 * params, current transition, etc.
 */
export class UIRouterGlobals {
  constructor() {
    /**
     * Current parameter values
     *
     * The parameter values from the latest successful transition
     * @type {StateParams}
     */
    this.params = new StateParams();

    /**
     * @type {Number}
     */
    this.lastStartedTransitionId = -1;

    /**
     * @type {Queue}
     */
    this.transitionHistory = new Queue([], 1);

    /**
     * @type {Queue}
     */
    this.successfulTransitions = new Queue([], 1);
  }

  $get = [() => this];
}
