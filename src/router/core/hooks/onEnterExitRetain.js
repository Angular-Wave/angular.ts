/**
 * A factory which creates an onEnter, onExit or onRetain transition hook function
 *
 * The returned function invokes the (for instance) state.onEnter hook when the
 * state is being entered.
 */
function makeEnterExitRetainHook(hookName) {
  return (transition, state) => {
    const _state = state.$$state();
    const hookFn = _state[hookName];
    return hookFn(transition, state);
  };
}
/**
 * The [[TransitionStateHookFn]] for onExit
 *
 * When the state is being exited, the state's .onExit function is invoked.
 *
 * Registered using `transitionService.onExit({ exiting: (state) => !!state.onExit }, onExitHook);`
 *
 * See: [[IHookRegistry.onExit]]
 */
const onExitHook = makeEnterExitRetainHook("onExit");
export const registerOnExitHook = (transitionService) =>
  transitionService.onExit({ exiting: (state) => !!state.onExit }, onExitHook);
/**
 * The [[TransitionStateHookFn]] for onRetain
 *
 * When the state was already entered, and is not being exited or re-entered, the state's .onRetain function is invoked.
 *
 * Registered using `transitionService.onRetain({ retained: (state) => !!state.onRetain }, onRetainHook);`
 *
 * See: [[IHookRegistry.onRetain]]
 */
const onRetainHook = makeEnterExitRetainHook("onRetain");
export const registerOnRetainHook = (transitionService) =>
  transitionService.onRetain(
    { retained: (state) => !!state.onRetain },
    onRetainHook,
  );
/**
 * The [[TransitionStateHookFn]] for onEnter
 *
 * When the state is being entered, the state's .onEnter function is invoked.
 *
 * Registered using `transitionService.onEnter({ entering: (state) => !!state.onEnter }, onEnterHook);`
 *
 * See: [[IHookRegistry.onEnter]]
 */
const onEnterHook = makeEnterExitRetainHook("onEnter");
export const registerOnEnterHook = (transitionService) =>
  transitionService.onEnter(
    { entering: (state) => !!state.onEnter },
    onEnterHook,
  );
