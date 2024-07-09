import { isDefined, sliceArgs } from "../../shared/utils";

export function $$IntervalFactoryProvider() {
  this.$get = [
    "$browser",
    "$q",
    "$$q",
    "$rootScope",
    function ($browser, $q, $$q, $rootScope) {
      return function intervalFactory(setIntervalFn, clearIntervalFn) {
        return function intervalFn(fn, delay, count, invokeApply) {
          const hasParams = arguments.length > 4;
          const args = hasParams ? sliceArgs(arguments, 4) : [];
          let iteration = 0;
          const skipApply = isDefined(invokeApply) && !invokeApply;
          const deferred = (skipApply ? $$q : $q).defer();
          const { promise } = deferred;

          count = isDefined(count) ? count : 0;

          function callback() {
            if (!hasParams) {
              fn(iteration);
            } else {
              fn.apply(null, args);
            }
          }

          function tick() {
            if (skipApply) {
              $browser.defer(callback);
            } else {
              $rootScope.$evalAsync(callback);
            }
            deferred.notify(iteration++);

            if (count > 0 && iteration >= count) {
              deferred.resolve(iteration);
              clearIntervalFn(promise.$$intervalId);
            }

            if (!skipApply) $rootScope.$apply();
          }

          promise.$$intervalId = setIntervalFn(
            tick,
            delay,
            deferred,
            skipApply,
          );

          return promise;
        };
      };
    },
  ];
}
