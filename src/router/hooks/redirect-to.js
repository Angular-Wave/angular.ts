import { isString, isFunction } from "../../shared/utils";
import { services } from "../common/coreservices";
import { TargetState } from "../state/target-state";
/**
 * A [[TransitionHookFn]] that redirects to a different state or params
 *
 * Registered using `transitionService.onStart({ to: (state) => !!state.redirectTo }, redirectHook);`
 *
 * See [[StateDeclaration.redirectTo]]
 */
const redirectToHook = (trans) => {
  const redirect = trans.to().redirectTo;
  if (!redirect) return;
  const $state = trans.router.stateService;
  function handleResult(result) {
    if (!result) return;
    if (result instanceof TargetState) return result;
    if (isString(result))
      return $state.target(result, trans.params(), trans.options());
    if (result["state"] || result["params"])
      return $state.target(
        result["state"] || trans.to(),
        result["params"] || trans.params(),
        trans.options(),
      );
  }
  if (isFunction(redirect)) {
    return services.$q.when(redirect(trans)).then(handleResult);
  }
  return handleResult(redirect);
};
export const registerRedirectToHook = (transitionService) =>
  transitionService.onStart(
    { to: (state) => !!state.redirectTo },
    redirectToHook,
  );
