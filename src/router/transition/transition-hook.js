import { TransitionHookPhase } from "./interface";
import { defaults, silentRejection } from "../../shared/common";
import { fnToString, maxLength } from "../../shared/strings";
import { isPromise } from "../../shared/predicates";
import { is, parse } from "../../shared/hof";
import { trace } from "../common/trace";
import { services } from "../common/coreservices";
import { Rejection } from "./reject-factory";
import { TargetState } from "../state/target-state";
import { EventBus } from "../../core/pubsub/pubsub";
const defaultOptions = {
  current: () => {},
  transition: null,
  traceData: {},
  bind: null,
};
export class TransitionHook {
  /**
   * Chains together an array of TransitionHooks.
   *
   * Given a list of [[TransitionHook]] objects, chains them together.
   * Each hook is invoked after the previous one completes.
   *
   * #### Example:
   * ```js
   * var hooks: TransitionHook[] = getHooks();
   * let promise: Promise<any> = TransitionHook.chain(hooks);
   *
   * promise.then(handleSuccess, handleError);
   * ```
   *
   * @param hooks the list of hooks to chain together
   * @param waitFor if provided, the chain is `.then()`'ed off this promise
   * @returns a `Promise` for sequentially invoking the hooks (in order)
   */
  static chain(hooks, waitFor) {
    // Chain the next hook off the previous
    const createHookChainR = (prev, nextHook) =>
      prev.then(() => nextHook.invokeHook());
    return hooks.reduce(createHookChainR, waitFor || services.$q.resolve());
  }
  /**
   * Invokes all the provided TransitionHooks, in order.
   * Each hook's return value is checked.
   * If any hook returns a promise, then the rest of the hooks are chained off that promise, and the promise is returned.
   * If no hook returns a promise, then all hooks are processed synchronously.
   *
   * @param hooks the list of TransitionHooks to invoke
   * @param doneCallback a callback that is invoked after all the hooks have successfully completed
   *
   * @returns a promise for the async result, or the result of the callback
   */
  static invokeHooks(hooks, doneCallback) {
    for (let idx = 0; idx < hooks.length; idx++) {
      const hookResult = hooks[idx].invokeHook();
      if (isPromise(hookResult)) {
        const remainingHooks = hooks.slice(idx + 1);
        return TransitionHook.chain(remainingHooks, hookResult).then(
          doneCallback,
        );
      }
    }
    return doneCallback();
  }
  /**
   * Run all TransitionHooks, ignoring their return value.
   */
  static runAllHooks(hooks) {
    hooks.forEach((hook) => hook.invokeHook());
  }
  constructor(transition, stateContext, registeredHook, options) {
    this.transition = transition;
    this.stateContext = stateContext;
    this.registeredHook = registeredHook;
    this.options = options;
    this.isSuperseded = () =>
      this.type.hookPhase === TransitionHookPhase.RUN &&
      !this.options.transition.isActive();
    this.options = defaults(options, defaultOptions);
    this.type = registeredHook.eventType;
  }
  logError(err) {
    EventBus.publish("$stateService:defaultErrorHandler", err);
  }
  invokeHook() {
    const hook = this.registeredHook;
    if (hook._deregistered) return;
    const notCurrent = this.getNotCurrentRejection();
    if (notCurrent) return notCurrent;
    const options = this.options;
    trace.traceHookInvocation(this, this.transition, options);
    const invokeCallback = () =>
      hook.callback.call(options.bind, this.transition, this.stateContext);
    const normalizeErr = (err) => Rejection.normalize(err).toPromise();
    const handleError = (err) => hook.eventType.getErrorHandler(this)(err);
    const handleResult = (result) =>
      hook.eventType.getResultHandler(this)(result);
    try {
      const result = invokeCallback();
      if (!this.type.synchronous && isPromise(result)) {
        return result.catch(normalizeErr).then(handleResult, handleError);
      } else {
        return handleResult(result);
      }
    } catch (err) {
      // If callback throws (synchronously)
      return handleError(Rejection.normalize(err));
    } finally {
      if (hook.invokeLimit && ++hook.invokeCount >= hook.invokeLimit) {
        hook.deregister();
      }
    }
  }
  /**
   * This method handles the return value of a Transition Hook.
   *
   * A hook can return false (cancel), a TargetState (redirect),
   * or a promise (which may later resolve to false or a redirect)
   *
   * This also handles "transition superseded" -- when a new transition
   * was started while the hook was still running
   */
  handleHookResult(result) {
    const notCurrent = this.getNotCurrentRejection();
    if (notCurrent) return notCurrent;
    // Hook returned a promise
    if (isPromise(result)) {
      // Wait for the promise, then reprocess with the resulting value
      return result.then((val) => this.handleHookResult(val));
    }
    trace.traceHookResult(result, this.transition);
    // Hook returned false
    if (result === false) {
      // Abort this Transition
      return Rejection.aborted("Hook aborted transition").toPromise();
    }
    const isTargetState = is(TargetState);
    // hook returned a TargetState
    if (isTargetState(result)) {
      // Halt the current Transition and redirect (a new Transition) to the TargetState.
      return Rejection.redirected(result).toPromise();
    }
  }
  /**
   * Return a Rejection promise if the transition is no longer current due
   * a new transition has started and superseded this one.
   */
  getNotCurrentRejection() {
    if (this.transition._aborted) {
      return Rejection.aborted().toPromise();
    }
    // This transition is no longer current.
    // Another transition started while this hook was still running.
    if (this.isSuperseded()) {
      // Abort this transition
      return Rejection.superseded(this.options.current()).toPromise();
    }
  }
  toString() {
    const { options, registeredHook } = this;
    const event = parse("traceData.hookType")(options) || "internal",
      context =
        parse("traceData.context.state.name")(options) ||
        parse("traceData.context")(options) ||
        "unknown",
      name = fnToString(registeredHook.callback);
    return `${event} context: ${context}, ${maxLength(200, name)}`;
  }
}
/**
 * These GetResultHandler(s) are used by [[invokeHook]] below
 * Each HookType chooses a GetResultHandler (See: [[TransitionService._defineCoreEvents]])
 */
TransitionHook.HANDLE_RESULT = (hook) => (result) =>
  hook.handleHookResult(result);
/**
 * If the result is a promise rejection, log it.
 * Otherwise, ignore the result.
 */
TransitionHook.LOG_REJECTED_RESULT = (hook) => (result) => {
  isPromise(result) &&
    result.catch((err) => hook.logError(Rejection.normalize(err)));
  return undefined;
};
/**
 * These GetErrorHandler(s) are used by [[invokeHook]] below
 * Each HookType chooses a GetErrorHandler (See: [[TransitionService._defineCoreEvents]])
 */
TransitionHook.LOG_ERROR = (hook) => (error) => hook.logError(error);
TransitionHook.REJECT_ERROR = () => (error) => silentRejection(error);
TransitionHook.THROW_ERROR = () => (error) => {
  throw error;
};
