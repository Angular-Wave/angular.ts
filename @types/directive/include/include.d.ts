/**
 *
 * @param {*} $templateRequest
 * @param {import("../../services/anchor-scroll/anchor-scroll.js").AnchorScrollFunction} $anchorScroll
 * @param {*} $animate
 * @param {import('../../services/exception/interface.ts').ErrorHandler} $exceptionHandler
 * @returns {import('../../interface.js').Directive}
 */
export function ngIncludeDirective(
  $templateRequest: any,
  $anchorScroll: import("../../services/anchor-scroll/anchor-scroll.js").AnchorScrollFunction,
  $animate: any,
  $exceptionHandler: import("../../services/exception/interface.ts").ErrorHandler,
): import("../../interface.js").Directive;
export namespace ngIncludeDirective {
  let $inject: string[];
}
/**
 * @param {ng.CompileService} $compile
 * @returns {import("../../interface.ts").Directive}
 */
export function ngIncludeFillContentDirective(
  $compile: ng.CompileService,
): import("../../interface.ts").Directive;
export namespace ngIncludeFillContentDirective {
  let $inject_1: string[];
  export { $inject_1 as $inject };
}
