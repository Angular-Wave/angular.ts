/**
 *
 * @param {*} $templateRequest
 * @param {import("../../services/anchor-scroll.js").AnchorScrollFunction} $anchorScroll
 * @param {*} $animate
 * @returns
 */
export function ngIncludeDirective(
  $templateRequest: any,
  $anchorScroll: import("../../services/anchor-scroll.js").AnchorScrollFunction,
  $animate: any,
): {
  restrict: string;
  priority: number;
  terminal: boolean;
  transclude: string;
  controller: () => void;
  compile(
    _element: any,
    attr: any,
  ): (
    scope: any,
    $element: any,
    _$attr: any,
    ctrl: any,
    $transclude: any,
  ) => void;
};
export namespace ngIncludeDirective {
  let $inject: string[];
}
/**
 * @param {import("../../core/compile/compile.js").CompileFn} $compile
 * @returns {import("../../interface.ts").Directive}
 */
export function ngIncludeFillContentDirective(
  $compile: import("../../core/compile/compile.js").CompileFn,
): import("../../interface.ts").Directive;
export namespace ngIncludeFillContentDirective {
  let $inject_1: string[];
  export { $inject_1 as $inject };
}
