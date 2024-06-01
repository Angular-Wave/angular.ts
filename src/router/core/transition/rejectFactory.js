import { silentRejection } from "../common/common";
import { stringify } from "../common/strings";
import { is } from "../common/hof";
/** An enum for Transition Rejection reasons */
var RejectType;
(function (RejectType) {
  /**
   * A new transition superseded this one.
   *
   * While this transition was running, a new transition started.
   * This transition is cancelled because it was superseded by new transition.
   */
  RejectType[(RejectType["SUPERSEDED"] = 2)] = "SUPERSEDED";
  /**
   * The transition was aborted
   *
   * The transition was aborted by a hook which returned `false`
   */
  RejectType[(RejectType["ABORTED"] = 3)] = "ABORTED";
  /**
   * The transition was invalid
   *
   * The transition was never started because it was invalid
   */
  RejectType[(RejectType["INVALID"] = 4)] = "INVALID";
  /**
   * The transition was ignored
   *
   * The transition was ignored because it would have no effect.
   *
   * Either:
   *
   * - The transition is targeting the current state and parameter values
   * - The transition is targeting the same state and parameter values as the currently running transition.
   */
  RejectType[(RejectType["IGNORED"] = 5)] = "IGNORED";
  /**
   * The transition errored.
   *
   * This generally means a hook threw an error or returned a rejected promise
   */
  RejectType[(RejectType["ERROR"] = 6)] = "ERROR";
})(RejectType || (RejectType = {}));
export { RejectType };
/** @internal */
let id = 0;
export class Rejection {
  /** Returns true if the obj is a rejected promise created from the `asPromise` factory */
  static isRejectionPromise(obj) {
    return (
      obj &&
      typeof obj.then === "function" &&
      is(Rejection)(obj._transitionRejection)
    );
  }
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
    /** @internal */
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
