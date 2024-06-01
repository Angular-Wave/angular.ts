/** @publicapi @module ng1 */ /** */
import { getLocals } from "../services";
import { services } from "../../core/common/coreservices";
import { ResolveContext } from "../../core/resolve/resolveContext";

/**
 * This is a [[StateBuilder.builder]] function for angular1 `onEnter`, `onExit`,
 * `onRetain` callback hooks on a [[Ng1StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * ensures that those hooks are injectable for @uirouter/angularjs (ng1).
 *
 * @internalapi
 */
export const getStateHookBuilder = (hookName) =>
  function stateHookBuilder(stateObject) {
    const hook = stateObject[hookName];
    const pathname = hookName === "onExit" ? "from" : "to";
    function decoratedNg1Hook(trans, state) {
      const resolveContext = new ResolveContext(trans.treeChanges(pathname));
      const subContext = resolveContext.subContext(state.$$state());
      const locals = Object.assign(getLocals(subContext), {
        $state$: state,
        $transition$: trans,
      });
      return services.$injector.invoke(hook, this, locals);
    }
    return hook ? decoratedNg1Hook : undefined;
  };
