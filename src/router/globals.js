import { StateParams } from "./params/stateParams";
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
     */
    this.params = new StateParams();
    /** @internal */
    this.lastStartedTransitionId = -1;
    /** @internal */
    this.transitionHistory = new Queue([], 1);
    /** @internal */
    this.successfulTransitions = new Queue([], 1);
  }
  dispose() {
    this.transitionHistory.clear();
    this.successfulTransitions.clear();
    this.transition = null;
  }
}
