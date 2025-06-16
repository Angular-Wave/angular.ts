/**
 * @param {import('../../interface.ts').Provider} $provide
 */
export function FilterProvider(
  $provide: import("../../interface.ts").Provider,
): void;
export class FilterProvider {
  /**
   * @param {import('../../interface.ts').Provider} $provide
   */
  constructor($provide: import("../../interface.ts").Provider);
  register: (
    name: string | Record<string, import("../../interface.ts").FilterFactory>,
    factory: import("../../interface.ts").FilterFactory,
  ) => import("../../interface.ts").ServiceProvider;
  $get: (
    | string
    | ((
        $injector: import("../../core/di/internal-injector.js").InjectorService,
      ) => (name: any) => any)
  )[];
}
export namespace FilterProvider {
  let $inject: string[];
}
