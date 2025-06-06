import { assertPredicate, unnestR } from "../../shared/common.js";
import { TransitionHookPhase, TransitionHookScope } from "./interface.js";
import { TransitionHook } from "./transition-hook.js";
/**
 * This class returns applicable TransitionHooks for a specific Transition instance.
 *
 * Hooks ([[RegisteredHook]]) may be registered globally, e.g., $transitions.onEnter(...), or locally, e.g.
 * myTransition.onEnter(...).  The HookBuilder finds matching RegisteredHooks (where the match criteria is
 * determined by the type of hook)
 *
 * The HookBuilder also converts RegisteredHooks objects to TransitionHook objects, which are used to run a Transition.
 *
 * The HookBuilder constructor is given the $transitions service and a Transition instance.  Thus, a HookBuilder
 * instance may only be used for one specific Transition object. (side note: the _treeChanges accessor is private
 * in the Transition class, so we must also provide the Transition's _treeChanges)
 */
export class HookBuilder {
  constructor(transition) {
    this.transition = transition;
  }

  /**
   * @param {TransitionHookPhase} phase
   * @returns
   */
  buildHooksForPhase(phase) {
    return this.transition.transitionService._pluginapi
      ._getEvents(phase)
      .map((type) => this.buildHooks(type))
      .reduce(unnestR, [])
      .filter(Boolean);
  }

  /**
   * Returns an array of newly built TransitionHook objects.
   *
   * - Finds all RegisteredHooks registered for the given `hookType` which matched the transition's [[TreeChanges]].
   * - Finds [[PathNode]] (or `PathNode[]`) to use as the TransitionHook context(s)
   * - For each of the [[PathNode]]s, creates a TransitionHook
   *
   * @param hookType the type of the hook registration function, e.g., 'onEnter', 'onFinish'.
   */
  buildHooks(hookType) {
    const transition = this.transition;
    const treeChanges = transition.treeChanges();
    // Find all the matching registered hooks for a given hook type
    const matchingHooks = this.getMatchingHooks(
      hookType,
      treeChanges,
      transition,
    );
    if (!matchingHooks) return [];
    const baseHookOptions = {
      transition: transition,
      current: transition.options().current,
    };
    const makeTransitionHooks = (hook) => {
      // Fetch the Nodes that caused this hook to match.
      const matches = hook.matches(treeChanges, transition);
      // Select the PathNode[] that will be used as TransitionHook context objects
      const matchingNodes = matches[hookType.criteriaMatchPath.name];
      // Return an array of HookTuples
      return matchingNodes.map((node) => {
        const _options = Object.assign(
          {
            bind: hook.bind,
            traceData: { hookType: hookType.name, context: node },
          },
          baseHookOptions,
        );
        const state =
          hookType.criteriaMatchPath.scope === TransitionHookScope.STATE
            ? node.state.self
            : null;
        const transitionHook = new TransitionHook(
          transition,
          state,
          hook,
          _options,
        );
        return { hook, node, transitionHook };
      });
    };
    return matchingHooks
      .map(makeTransitionHooks)
      .reduce(unnestR, [])
      .sort(tupleSort(hookType.reverseSort))
      .map((tuple) => tuple.transitionHook);
  }
  /**
   * Finds all RegisteredHooks from:
   * - The Transition object instance hook registry
   * - The TransitionService ($transitions) global hook registry
   *
   * which matched:
   * - the eventType
   * - the matchCriteria (to, from, exiting, retained, entering)
   *
   * @returns an array of matched [[RegisteredHook]]s
   */
  getMatchingHooks(hookType, treeChanges, transition) {
    const isCreate = hookType.hookPhase === TransitionHookPhase.CREATE;
    // Instance and Global hook registries
    const $transitions = this.transition.transitionService;
    const registries = isCreate
      ? [$transitions]
      : [this.transition, $transitions];
    return registries
      .map((reg) => reg.getHooks(hookType.name)) // Get named hooks from registries
      .filter(
        assertPredicate(Array.isArray, `broken event named: ${hookType.name}`),
      ) // Sanity check
      .reduce(unnestR, []) // Un-nest RegisteredHook[][] to RegisteredHook[] array
      .filter((hook) => hook.matches(treeChanges, transition)); // Only those satisfying matchCriteria
  }
}
/**
 * A factory for a sort function for HookTuples.
 *
 * The sort function first compares the PathNode depth (how deep in the state tree a node is), then compares
 * the EventHook priority.
 *
 * @param reverseDepthSort a boolean, when true, reverses the sort order for the node depth
 * @returns a tuple sort function
 */
function tupleSort(reverseDepthSort = false) {
  return function nodeDepthThenPriority(l, r) {
    const factor = reverseDepthSort ? -1 : 1;
    const depthDelta =
      (l.node.state.path.length - r.node.state.path.length) * factor;
    return depthDelta !== 0 ? depthDelta : r.hook.priority - l.hook.priority;
  };
}
