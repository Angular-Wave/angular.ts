export function $$IntervalFactoryProvider(): void;
export class $$IntervalFactoryProvider {
  $get: (
    | string
    | ((
        $browser: any,
        $q: any,
        $$q: any,
        $rootScope: any,
      ) => (
        setIntervalFn: any,
        clearIntervalFn: any,
      ) => (
        fn: any,
        delay: any,
        count: any,
        invokeApply: any,
        ...args: any[]
      ) => any)
  )[];
}
