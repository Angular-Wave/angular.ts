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
  static chain(hooks: any, waitFor: any): any;
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
  static invokeHooks(hooks: any, doneCallback: any): any;
  /**
   * Run all TransitionHooks, ignoring their return value.
   */
  static runAllHooks(hooks: any): void;
  constructor(
    transition: any,
    stateContext: any,
    registeredHook: any,
    options: any,
  );
  transition: any;
  stateContext: any;
  registeredHook: any;
  options: any;
  isSuperseded: () => boolean;
  type: any;
  logError(err: any): void;
  invokeHook(): any;
  /**
   * This method handles the return value of a Transition Hook.
   *
   * A hook can return false (cancel), a TargetState (redirect),
   * or a promise (which may later resolve to false or a redirect)
   *
   * This also handles "transition superseded" -- when a new transition
   * was started while the hook was still running
   */
  handleHookResult(result: any): any;
  /**
   * Return a Rejection promise if the transition is no longer current due
   * a new transition has started and superseded this one.
   */
  getNotCurrentRejection(): any;
  toString(): string;
}
export namespace TransitionHook {
  /**
   * These GetResultHandler(s) are used by [[invokeHook]] below
   * Each HookType chooses a GetResultHandler (See: [[TransitionService._defineCoreEvents]])
   */
  function HANDLE_RESULT(hook: any): (result: any) => any;
  /**
   * If the result is a promise rejection, log it.
   * Otherwise, ignore the result.
   */
  function LOG_REJECTED_RESULT(hook: any): (result: any) => any;
  /**
   * These GetErrorHandler(s) are used by [[invokeHook]] below
   * Each HookType chooses a GetErrorHandler (See: [[TransitionService._defineCoreEvents]])
   */
  function LOG_ERROR(hook: any): (error: any) => any;
  function REJECT_ERROR(): (error: any) => any;
  function THROW_ERROR(): (error: any) => never;
}
