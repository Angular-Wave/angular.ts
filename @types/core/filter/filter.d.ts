export class FilterProvider {
  static $inject: string[];
  /**
   * @param {import('../../interface.ts').Provider} $provide
   */
  constructor($provide: import("../../interface.ts").Provider);
  $provide: import("../../interface.ts").Provider;
  /**
   * @param {string|Record<string, ng.FilterFn>} name
   * @param {ng.FilterService} [factory]
   * @return {import('../../interface.ts').Provider}
   */
  register(
    name: string | Record<string, ng.FilterFn>,
    factory?: ng.FilterService,
  ): import("../../interface.ts").Provider;
  $get: (
    | string
    | ((
        $injector: import("../../core/di/internal-injector.js").InjectorService,
      ) => ng.FilterService)
  )[];
}
