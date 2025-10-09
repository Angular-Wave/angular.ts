/**
 *
 * @param {import("../../core/compile/compile.js").CompileFn} $compile
 * @param {import("../../core/parse/interface.ts").ParseService} $parse
 * @returns {import("../../interface.ts").Directive}
 */
export function ngOptionsDirective(
  $compile: import("../../core/compile/compile.js").CompileFn,
  $parse: import("../../core/parse/interface.ts").ParseService,
): import("../../interface.ts").Directive;
export namespace ngOptionsDirective {
  let $inject: string[];
}
