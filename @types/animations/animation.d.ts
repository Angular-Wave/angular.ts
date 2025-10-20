export function AnimationProvider(): void;
export class AnimationProvider {
  drivers: any[];
  $get: (
    | string
    | ((
        $rootScope: ng.RootScopeService,
        $injector: any,
        $$AnimateRunner: any,
        $$rAFScheduler: any,
        $$animateCache: any,
      ) => (element: any, event: any, options: any) => any)
  )[];
}
