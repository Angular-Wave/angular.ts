/**
 * SSE Provider
 *
 * Usage:
 *   const source = $sse('/events', {
 *     onMessage: (data) => console.log(data),
 *     onError: (err) => console.error(err),
 *     retryDelay: 2000,
 *     heartbeatTimeout: 10000,
 *   });
 *
 *   source.close();
 */
export class SseProvider {
  /**
   * Optional provider-level defaults
   * @type {ng.SseConfig}
   */
  defaults: ng.SseConfig;
  /**
   * Returns the $sse service function
   * @returns {ng.SseService}
   */
  $get: () => ng.SseService;
  #private;
}
