export function AnimateQueueProvider($animateProvider: any): void;
export class AnimateQueueProvider {
  constructor($animateProvider: any);
  rules: {
    skip: any[];
    cancel: any[];
    join: any[];
  };
  $get: (
    | string
    | ((
        $rootScope: import("../core/scope/scope.js").Scope,
        $injector: import("../core/di/internal-injector.js").InjectorService,
        $$animation: any,
        $$AnimateRunner: any,
        $templateRequest: any,
      ) => {
        on(event: any, container: any, callback: any): void;
        off(event: any, container: any, callback: any, ...args: any[]): void;
        pin(element: any, parentElement: any): void;
        push(element: any, event: any, options: any, domOperation: any): any;
        enabled(element: any, bool: any, ...args: any[]): any;
      })
  )[];
}
export namespace AnimateQueueProvider {
  let $inject: string[];
}
