export function $StateRefDirective(
  $stateService: any,
  $stateRegistry: any,
  $transitions: any,
): {
  restrict: string;
  require: string[];
  link: (scope: any, element: any, attrs: any, ngSrefActive: any) => void;
};
export namespace $StateRefDirective {
  let $inject: string[];
}
/**
 * @param $state
 * @param $stateRegistry
 * @param $transitions
 * @returns {import("../../interface.ts").Directive}
 */
export function $StateRefDynamicDirective(
  $state: any,
  $stateRegistry: any,
  $transitions: any,
): import("../../interface.ts").Directive;
export namespace $StateRefDynamicDirective {
  let $inject_1: string[];
  export { $inject_1 as $inject };
}
/**
 * @param {*} $state
 * @param {import('../globals.js').RouterGlobals} $routerGlobals
 * @param {*} $interpolate
 * @param {*} $stateRegistry
 * @param {*} $transitions
 * @returns {import("../../interface.ts").Directive}
 */
export function $StateRefActiveDirective(
  $state: any,
  $routerGlobals: import("../globals.js").RouterGlobals,
  $interpolate: any,
  $stateRegistry: any,
  $transitions: any,
): import("../../interface.ts").Directive;
export namespace $StateRefActiveDirective {
  let $inject_2: string[];
  export { $inject_2 as $inject };
}
