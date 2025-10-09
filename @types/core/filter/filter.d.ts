export class FilterProvider {
  static $inject: string[];
  /**
   * @param {import('../../interface.ts').Provider} $provide
   */
  constructor($provide: import("../../interface.ts").Provider);
  $provide: import("../../interface.ts").Provider;
  /**
   * @param {string|Record<string, import('../../interface.ts').FilterFactory>} name
   * @param {import('../../interface.ts').FilterFactory} [factory]
   * @return {import('../../interface.ts').Provider}
   */
  register(
    name: string | Record<string, import("../../interface.ts").FilterFactory>,
    factory?: import("../../interface.ts").FilterFactory,
  ): import("../../interface.ts").Provider;
  $get: (
    | string
    | ((
        $injector: import("../../core/di/internal-injector.js").InjectorService,
      ) => import("../../interface.ts").FilterFn)
  )[];
}
