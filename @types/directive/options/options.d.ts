/**
 *
 * @param {ng.CompileService} $compile
 * @param {import("../../core/parse/interface.ts").ParseService} $parse
 * @returns {import("../../interface.ts").Directive}
 */
export function ngOptionsDirective(
  $compile: ng.CompileService,
  $parse: import("../../core/parse/interface.ts").ParseService,
): import("../../interface.ts").Directive;
export namespace ngOptionsDirective {
  let $inject: string[];
}
