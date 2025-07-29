/**
 * `isState` Filter: truthy if the current state is the parameter
 *
 * Translates to [[StateService.is]] `$state.is("stateName")`.
 *
 * #### Example:
 * ```html
 * <div ng-if="'stateName' | isState">show if state is 'stateName'</div>
 * ```
 *
 * @param {import('./state/state-service.js').StateProvider} $state
 * @returns {import('../interface.ts').FilterFn}
 */
export function $IsStateFilter(
  $state: import("./state/state-service.js").StateProvider,
): import("../interface.ts").FilterFn;
export namespace $IsStateFilter {
  let $inject: string[];
}
/**
 * `includedByState` Filter: truthy if the current state includes the parameter
 *
 * Translates to [[StateService.includes]]` $state.is("fullOrPartialStateName")`.
 *
 * #### Example:
 * ```html
 * <div ng-if="'fullOrPartialStateName' | includedByState">show if state includes 'fullOrPartialStateName'</div>
 * ```
 *
 * @param {import('./state/state-service.js').StateProvider} $state
 * @returns {import('../interface.ts').FilterFn}
 */
export function $IncludedByStateFilter(
  $state: import("./state/state-service.js").StateProvider,
): import("../interface.ts").FilterFn;
export namespace $IncludedByStateFilter {
  let $inject_1: string[];
  export { $inject_1 as $inject };
}
