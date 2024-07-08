/**
 * @ngdoc provider
 * @name $qProvider
 *
 *
 * @description
 */
export function $QProvider(): void;
export class $QProvider {
  $get: (string | (($rootScope: any, $exceptionHandler: any) => any))[];
  /**
   * @ngdoc method
   * @name $qProvider#errorOnUnhandledRejections
   * @kind function
   *
   * @description
   * Retrieves or overrides whether to generate an error when a rejected promise is not handled.
   * This feature is enabled by default.
   *
   * @param {boolean=} value Whether to generate an error when a rejected promise is not handled.
   * @returns {boolean|ng.$qProvider} Current value when called without a new value or self for
   *    chaining otherwise.
   */
  errorOnUnhandledRejections: (
    value?: boolean | undefined,
  ) => boolean | ng.$qProvider;
}
export function $$QProvider(): void;
export class $$QProvider {
  $get: (string | (($browser: any, $exceptionHandler: any) => any))[];
  errorOnUnhandledRejections: (value: any) => boolean | this;
}
export function markQExceptionHandled(q: any): void;
