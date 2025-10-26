/**
 * SSE Provider
 *
 * Usage:
 *   const source = $sse('/events', {
 *     onMessage: (data) => console.log(data),
 *     onError: (err) => console.error(err),
 *     withCredentials: true
 *   });
 *
 *   // later:
 *   source.close();
 */

export class SseProvider {
  constructor() {
    /**
     * Optional provider-level defaults
     * @type {ng.SseConfig}
     */
    this.defaults = {};
  }

  /**
   * Returns the $sse service function
   * @returns {ng.SseService}
   */
  $get =
    () =>
    (url, config = {}) => {
      const finalUrl = this.#buildUrl(url, config.params);
      return this.#createEventSource(finalUrl, config);
    };

  /**
   * Build URL with query parameters
   * @param {string} url - Base URL
   * @param {Record<string, any>=} params - Query parameters
   * @returns {string} URL with serialized query string
   */
  #buildUrl(url, params) {
    if (!params) return url;
    const query = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    return url + (url.includes("?") ? "&" : "?") + query;
  }

  /**
   * Create and manage an EventSource
   * @param {string} url - URL for SSE connection
   * @param {ng.SseConfig} config - Configuration object
   * @returns {EventSource} The EventSource instance wrapped as SseService
   */
  #createEventSource(url, config) {
    const es = new EventSource(url, {
      withCredentials: !!config.withCredentials,
    });

    if (config.onOpen) {
      es.addEventListener("open", (e) => config.onOpen(e));
    }

    es.addEventListener("message", (e) => {
      let data = e.data;
      try {
        data = config.transformMessage
          ? config.transformMessage(data)
          : JSON.parse(data);
      } catch {
        // leave as raw string if not JSON
      }
      config.onMessage?.(data, e);
    });

    if (config.onError) {
      es.addEventListener("error", (e) => config.onError(e));
    }

    return es;
  }
}
