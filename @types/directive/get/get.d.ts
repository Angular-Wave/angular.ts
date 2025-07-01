/**
 * @param {{ get: (arg0: any) => Promise<any>; }} $http
 * @param {import("../../core/compile/compile.js").CompileFn} $compile
 * @param {import("../../services/log.js").LogService} $log
 * @returns {import('../../interface.ts').Directive}
 */
export function ngGetDirective(
  $http: {
    get: (arg0: any) => Promise<any>;
  },
  $compile: import("../../core/compile/compile.js").CompileFn,
  $log: import("../../services/log.js").LogService,
): import("../../interface.ts").Directive;
export namespace ngGetDirective {
  let $inject: string[];
}
