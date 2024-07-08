export function $timeout(
  $rootScope: any,
  $browser: any,
  $q: any,
  $$q: any,
  $exceptionHandler: any,
): {
  (
    fn?: (() => any) | undefined,
    delay?: number | undefined,
    invokeApply?: boolean | undefined,
    ...args: any[]
  ): Promise<any>;
  /**
   * @ngdoc method
   * @name $timeout#cancel
   *
   * @description
   * Cancels a task associated with the `promise`. As a result of this, the promise will be
   * resolved with a rejection.
   *
   * @param {Promise=} promise Promise returned by the `$timeout` function.
   * @returns {boolean} Returns `true` if the task hasn't executed yet and was successfully
   *   canceled.
   */
  cancel(promise?: Promise<any> | undefined): boolean;
};
export function $TimeoutProvider(): void;
export class $TimeoutProvider {
  $get: (string | typeof $timeout)[];
}
