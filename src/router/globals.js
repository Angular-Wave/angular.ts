import { StateParams } from "./params/state-params.js";
import { Queue } from "./common/queue.js";

/** @typedef {import('../interface.ts').ServiceProvider} ServiceProvider } */

/**
 * Global router state
 *
 * This is where we hold the global mutable state such as current state, current
 * params, current transition, etc.
 * @implements {ServiceProvider}
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
     * @type {number}
     */
    this.lastStartedTransitionId = -1;

    /**
     * @type {Queue<import("./transition/transition.js").Transition>}
     */
    this.transitionHistory = new Queue([], 1);

    /**
     * @type {Queue<import("./transition/transition.js").Transition>}
     */
    this.successfulTransitions = new Queue([], 1);
  }

  $get = () => this;
}
