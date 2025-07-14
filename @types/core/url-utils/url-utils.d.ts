/**
 * @param {import("./interface.js").ResolvableUrl} url
 * @return {import("./interface.js").ParsedUrl}
 */
export function urlResolve(
  url: import("./interface.js").ResolvableUrl,
): import("./interface.js").ParsedUrl;
/**
 * Parse a request URL and determine whether this is a same-origin request as the application
 * document.
 *
 * @param {import("./interface.js").ResolvableUrl} requestUrl The url of the request as a string that will be resolved
 * or a parsed URL object.
 * @returns {boolean} Whether the request is for the same origin as the application document.
 */
export function urlIsSameOrigin(
  requestUrl: import("./interface.js").ResolvableUrl,
): boolean;
/**
 * Parse a request URL and determine whether it is same-origin as the current document base URL.
 *
 * Note: The base URL is usually the same as the document location (`location.href`) but can
 * be overriden by using the `<base>` tag.
 *
 * @param {import("./interface.js").ResolvableUrl} requestUrl The url of the request as a string that will be resolved
 * or a parsed URL object.
 * @returns {boolean} Whether the URL is same-origin as the document base URL.
 */
export function urlIsSameOriginAsBaseUrl(
  requestUrl: import("./interface.js").ResolvableUrl,
): boolean;
/**
 * Create a function that can check a URL's origin against a list of allowed/trusted origins.
 * The current location's origin is implicitly trusted.
 *
 * @param {string[]} trustedOriginUrls - A list of URLs (strings), whose origins are trusted.
 *
 * @returns {(url: import("./interface.js").ResolvableUrl) => boolean } - A function that receives a URL (string or parsed URL object) and returns
 *     whether it is of an allowed origin.
 */
export function urlIsAllowedOriginFactory(
  trustedOriginUrls: string[],
): (url: import("./interface.js").ResolvableUrl) => boolean;
/**
 * Determine if two URLs share the same origin.
 *
 * @param {import("./interface.js").ResolvableUrl} url1 - First URL to compare as a string or a normalized URL in the form of
 *     a dictionary object returned by `urlResolve()`.
 * @param {import("./interface.js").ResolvableUrl} url2 - Second URL to compare as a string or a normalized URL in the form
 *     of a dictionary object returned by `urlResolve()`.
 *
 * @returns {boolean} - True if both URLs have the same origin, and false otherwise.
 */
export function urlsAreSameOrigin(
  url1: import("./interface.js").ResolvableUrl,
  url2: import("./interface.js").ResolvableUrl,
): boolean;
/**
 * Returns the current document base URL.
 * @returns {string}
 */
export function getBaseUrl(): string;
/**
 * Removes a trailing hash ('#') from the given URL if it exists.
 *
 * @param {string} url
 * @returns {string}
 */
export function trimEmptyHash(url: string): string;
