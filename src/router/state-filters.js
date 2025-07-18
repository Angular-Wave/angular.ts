/**
 * `isState` Filter: truthy if the current state is the parameter
 *
 * Translates to [[StateService.is]] `$state.is("stateName")`.
 *
 * #### Example:
 * ```html
 * <div ng-if="'stateName' | isState">show if state is 'stateName'</div>
 * ```
 */
$IsStateFilter.$inject = ["$state"];
/**
 * @returns {import('../interface.ts').FilterFn}
 */
export function $IsStateFilter($state) {
  const isFilter = function (state, params, options) {
    return $state.is(state, params, options);
  };
  isFilter.$stateful = true;
  return isFilter;
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
 */
$IncludedByStateFilter.$inject = ["$state"];
/**
 * @returns {import('../interface.ts').FilterFn}
 */
export function $IncludedByStateFilter($state) {
  const includesFilter = function (state, params, options) {
    return $state.includes(state, params, options);
  };
  includesFilter.$stateful = true;
  return includesFilter;
}
