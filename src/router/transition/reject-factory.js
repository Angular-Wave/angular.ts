import { silentRejection } from "../../shared/common";
import { stringify } from "../../shared/strings";
import { is } from "../../shared/hof";

/**
 * An object for Transition Rejection reasons.
 * @enum {number}
 */
export const RejectType = {
  /**
   * A new transition superseded this one.
   *
   * While this transition was running, a new transition started.
   * This transition is cancelled because it was superseded by a new transition.
   * @type {number}
   */
  SUPERSEDED: 2,

  /**
   * The transition was aborted.
   *
   * The transition was aborted by a hook which returned `false`.
   * @type {number}
   */
  ABORTED: 3,

  /**
   * The transition was invalid.
   *
   * The transition was never started because it was invalid.
   * @type {number}
   */
  INVALID: 4,

  /**
   * The transition was ignored.
   *
   * The transition was ignored because it would have no effect.
   * Either:
   * - The transition is targeting the current state and parameter values.
   * - The transition is targeting the same state and parameter values as the currently running transition.
   * @type {number}
   */
  IGNORED: 5,

  /**
   * The transition errored.
   *
   * This generally means a hook threw an error or returned a rejected promise.
   * @type {number}
   */
  ERROR: 6,
};

let id = 0;
export class Rejection {
  /** Returns a Rejection due to transition superseded */
  static superseded(detail, options) {
    const message =
      "The transition has been superseded by a different transition";
    const rejection = new Rejection(RejectType.SUPERSEDED, message, detail);
    if (options && options.redirected) {
      rejection.redirected = true;
    }
    return rejection;
  }
  /** Returns a Rejection due to redirected transition */
  static redirected(detail) {
    return Rejection.superseded(detail, { redirected: true });
  }
  /** Returns a Rejection due to invalid transition */
  static invalid(detail) {
    const message = "This transition is invalid";
    return new Rejection(RejectType.INVALID, message, detail);
  }
  /** Returns a Rejection due to ignored transition */
  static ignored(detail) {
    const message = "The transition was ignored";
    return new Rejection(RejectType.IGNORED, message, detail);
  }
  /** Returns a Rejection due to aborted transition */
  static aborted(detail) {
    const message = "The transition has been aborted";
    return new Rejection(RejectType.ABORTED, message, detail);
  }
  /** Returns a Rejection due to aborted transition */
  static errored(detail) {
    const message = "The transition errored";
    return new Rejection(RejectType.ERROR, message, detail);
  }
  /**
   * Returns a Rejection
   *
   * Normalizes a value as a Rejection.
   * If the value is already a Rejection, returns it.
   * Otherwise, wraps and returns the value as a Rejection (Rejection type: ERROR).
   *
   * @returns `detail` if it is already a `Rejection`, else returns an ERROR Rejection.
   */
  static normalize(detail) {
    return is(Rejection)(detail) ? detail : Rejection.errored(detail);
  }
  constructor(type, message, detail) {
    this.$id = id++;
    this.type = type;
    this.message = message;
    this.detail = detail;
  }
  toString() {
    const detailString = (d) =>
      d && d.toString !== Object.prototype.toString
        ? d.toString()
        : stringify(d);
    const detail = detailString(this.detail);
    const { $id, type, message } = this;
    return `Transition Rejection($id: ${$id} type: ${type}, message: ${message}, detail: ${detail})`;
  }
  toPromise() {
    return Object.assign(silentRejection(this), { _transitionRejection: this });
  }
}
