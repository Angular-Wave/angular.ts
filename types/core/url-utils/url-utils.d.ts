/**
 *
 * Implementation Notes for non-IE browsers
 * ----------------------------------------
 * Assigning a URL to the href property of an anchor DOM node, even one attached to the DOM,
 * results both in the normalizing and parsing of the URL.  Normalizing means that a relative
 * URL will be resolved into an absolute URL in the context of the application document.
 * Parsing means that the anchor node's host, hostname, protocol, port, pathname and related
 * properties are all populated to reflect the normalized URL.  This approach has wide
 * compatibility - Safari 1+, Mozilla 1+ etc.  See
 * http://www.aptana.com/reference/html/api/HTMLAnchorElement.html
 *
 * Implementation Notes for IE
 * ---------------------------
 * IE <= 10 normalizes the URL when assigned to the anchor node similar to the other
 * browsers.  However, the parsed components will not be set if the URL assigned did not specify
 * them.  (e.g. if you assign a.href = "foo", then a.protocol, a.host, etc. will be empty.)  We
 * work around that by performing the parsing in a 2nd step by taking a previously normalized
 * URL (e.g. by assigning to a.href) and assigning it a.href again.  This correctly populates the
 * properties such as protocol, hostname, port, etc.
 *
 * References:
 *   http://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement
 *   http://www.aptana.com/reference/html/api/HTMLAnchorElement.html
 *   http://url.spec.whatwg.org/#urlutils
 *   https://github.com/angular/angular.js/pull/2902
 *   http://james.padolsey.com/javascript/parsing-urls-with-the-dom/
 *
 * @kind function
 * @param {string|object} url The URL to be parsed. If `url` is not a string, it will be returned
 *     unchanged.
 * @description Normalizes and parses a URL.
 * @returns {object} Returns the normalized URL as a dictionary.
 *
 *   | member name   | Description                                                            |
 *   |---------------|------------------------------------------------------------------------|
 *   | href          | A normalized version of the provided URL if it was not an absolute URL |
 *   | protocol      | The protocol without the trailing colon                                |
 *   | host          | The host and port (if the port is non-default) of the normalizedUrl    |
 *   | search        | The search params, minus the question mark                             |
 *   | hash          | The hash string, minus the hash symbol                                 |
 *   | hostname      | The hostname                                                           |
 *   | port          | The port, without ":"                                                  |
 *   | pathname      | The pathname, beginning with "/"                                       |
 *
 */
export function urlResolve(url: string | object): object;
/**
 * Parse a request URL and determine whether this is a same-origin request as the application
 * document.
 *
 * @param {string|object} requestUrl The url of the request as a string that will be resolved
 * or a parsed URL object.
 * @returns {boolean} Whether the request is for the same origin as the application document.
 */
export function urlIsSameOrigin(requestUrl: string | object): boolean;
/**
 * Parse a request URL and determine whether it is same-origin as the current document base URL.
 *
 * Note: The base URL is usually the same as the document location (`location.href`) but can
 * be overriden by using the `<base>` tag.
 *
 * @param {string|object} requestUrl The url of the request as a string that will be resolved
 * or a parsed URL object.
 * @returns {boolean} Whether the URL is same-origin as the document base URL.
 */
export function urlIsSameOriginAsBaseUrl(requestUrl: string | object): boolean;
/**
 * Create a function that can check a URL's origin against a list of allowed/trusted origins.
 * The current location's origin is implicitly trusted.
 *
 * @param {string[]} trustedOriginUrls - A list of URLs (strings), whose origins are trusted.
 *
 * @returns {Function} - A function that receives a URL (string or parsed URL object) and returns
 *     whether it is of an allowed origin.
 */
export function urlIsAllowedOriginFactory(
  trustedOriginUrls: string[],
): Function;
/**
 * Determine if two URLs share the same origin.
 *
 * @param {string|Object} url1 - First URL to compare as a string or a normalized URL in the form of
 *     a dictionary object returned by `urlResolve()`.
 * @param {string|object} url2 - Second URL to compare as a string or a normalized URL in the form
 *     of a dictionary object returned by `urlResolve()`.
 *
 * @returns {boolean} - True if both URLs have the same origin, and false otherwise.
 */
export function urlsAreSameOrigin(
  url1: string | any,
  url2: string | object,
): boolean;
/**
 * Returns the current document base URL.
 * @returns {string}
 */
export function getBaseUrl(): string;
