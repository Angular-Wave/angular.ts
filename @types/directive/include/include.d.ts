/**
 *
 * @param {*} $templateRequest
 * @param {import("../../services/anchor-scroll/anchor-scroll.js").AnchorScrollFunction} $anchorScroll
 * @param {*} $animate
 * @param {import('../../services/exception/interface.ts').Interface} $exceptionHandler
 * @returns {import('../../interface.js').Directive}
 */
export function ngIncludeDirective(
  $templateRequest: any,
  $anchorScroll: import("../../services/anchor-scroll/anchor-scroll.js").AnchorScrollFunction,
  $animate: any,
  $exceptionHandler: import("../../services/exception/interface.ts").Interface,
): import("../../interface.js").Directive;
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
