/**
 * ///////////////////////////
 *          HELPERS
 * ///////////////////////////
 */
/**
 * Encodes a URL path by encoding each path segment individually using `encodeUriSegment`,
 * while preserving forward slashes (`/`) as segment separators.
 *
 * This function first decodes any existing percent-encodings (such as `%20` or `%2F`)
 * in each segment to prevent double encoding, except for encoded forward slashes (`%2F`),
 * which are replaced with literal slashes before decoding to keep path boundaries intact.
 *
 * After decoding, each segment is re-encoded with `encodeUriSegment` according to RFC 3986,
 * encoding only characters that must be encoded in a path segment.
 *
 * The encoded segments are then rejoined with `/` to form the encoded path.
 *
 * @param {string} path - The URL path string to encode. May contain multiple segments separated by `/`.
 * @returns {string} The encoded path, where each segment is encoded, but forward slashes are preserved.
 *
 * @example
 * encodePath("user profile/images/pic 1.jpg")
 * // returns "user%20profile/images/pic%201.jpg"
 *
 * @example
 * encodePath("folder1%2Fsub/folder2")
 * // returns "folder1%2Fsub/folder2"
 */
export function encodePath(path: string): string;
/**
 * Decodes each segment of a URL path.
 *
 * Splits the input path by "/", decodes each segment using decodeURIComponent,
 * and if html5Mode is enabled, re-encodes any forward slashes inside segments
 * as "%2F" to avoid confusion with path separators.
 *
 * @param {string} path - The URL path to decode.
 * @param {boolean} html5Mode - If true, encodes forward slashes in segments as "%2F".
 * @returns {string} The decoded path with segments optionally encoding slashes.
 */
export function decodePath(path: string, html5Mode: boolean): string;
/**
 * Normalizes a URL path by encoding the path segments, query parameters, and hash fragment.
 *
 * - Path segments are encoded using `encodePath`, which encodes each segment individually.
 * - Query parameters (`searchValue`) are converted to a query string using `toKeyValue`.
 * - Hash fragment (`hashValue`) is encoded using `encodeUriSegment` and prefixed with `#`.
 *
 * This function returns a fully constructed URL path with optional query and hash components.
 *
 * @param {string} pathValue - The base URL path (e.g., "folder/item name").
 * @param {Object.<string, any> | string | null} searchValue - An object or string representing query parameters.
 *   - If an object, it can contain strings, numbers, booleans, or arrays of values.
 *   - If a string, it is assumed to be a raw query string.
 *   - If null or undefined, no query string is added.
 * @param {string | null} hashValue - The URL fragment (everything after `#`). If null or undefined, no hash is added.
 *
 * @returns {string} The normalized URL path including encoded path, optional query string, and optional hash.
 *
 * @example
 * normalizePath("products/list", { category: "books", page: 2 }, "section1")
 * // returns "products/list?category=books&page=2#section1"
 *
 * @example
 * normalizePath("user profile/images", null, null)
 * // returns "user%20profile/images"
 */
export function normalizePath(
  pathValue: string,
  searchValue:
    | {
        [x: string]: any;
      }
    | string
    | null,
  hashValue: string | null,
): string;
/**
 * Parses the application URL and updates the location object with path, search, and hash.
 *
 * @param {string} url - The URL string to parse.
 * @param {Object} locationObj - The location object to be updated.
 * @param {string} locationObj.$$path - The path component (will be set).
 * @param {Object.<string, (string|boolean|string[])>} locationObj.$$search - The parsed query parameters (will be set).
 * @param {string} locationObj.$$hash - The decoded URL fragment (will be set).
 * @param {boolean} html5Mode - Whether HTML5 mode is enabled (affects decoding).
 * @throws Will throw an error if the URL starts with invalid slashes.
 */
export function parseAppUrl(
  url: string,
  locationObj: {
    $$path: string;
    $$search: {
      [x: string]: string | boolean | string[];
    };
    $$hash: string;
  },
  html5Mode: boolean,
): void;
/**
 *
 * Returns the substring of `url` after the `base` string if `url` starts with `base`.
 * Returns `undefined` if `url` does not start with `base`.
 * @param {string} base
 * @param {string} url
 * @returns {string} returns text from `url` after `base` or `undefined` if it does not begin with
 *                   the expected string.
 */
export function stripBaseUrl(base: string, url: string): string;
/**
 * Removes the hash fragment (including the '#') from the given URL string.
 *
 * @param {string} url - The URL string to process.
 * @returns {string} The URL without the hash fragment.
 */
export function stripHash(url: string): string;
/**
 * Removes the file name (and any hash) from a URL, returning the base directory path.
 *
 * For example:
 * - Input: "https://example.com/path/to/file.js"
 *   Output: "https://example.com/path/to/"
 *
 * - Input: "https://example.com/path/to/file.js#section"
 *   Output: "https://example.com/path/to/"
 *
 * @param {string} url - The URL from which to strip the file name and hash.
 * @returns {string} The base path of the URL, ending with a slash.
 */
export function stripFile(url: string): string;
/**
 * Extracts the base server URL (scheme, host, and optional port) from a full URL.
 *
 * If no path is present, returns the full URL.
 *
 * For example:
 * - Input: "https://example.com/path/to/file"
 *   Output: "https://example.com"
 *
 * - Input: "http://localhost:3000/api/data"
 *   Output: "http://localhost:3000"
 *
 * @param {string} url - The full URL to extract the server base from.
 * @returns {string} The server base, including scheme and host (and port if present).
 */
export function serverBase(url: string): string;
/**
 * Determine if two URLs are equal despite potential differences in encoding,
 * trailing slashes, or empty hash fragments, such as between $location.absUrl() and $browser.url().
 *
 * @param {string} a - First URL to compare.
 * @param {string} b - Second URL to compare.
 * @returns {boolean} True if URLs are equivalent after normalization.
 */
export function urlsEqual(a: string, b: string): boolean;
export class Location {
  /**
   * @param {string} appBase application base URL
   * @param {string} appBaseNoFile application base URL stripped of any filename
   * @param {boolean} [html5] Defaults to true
   * @param {string} [prefix] URL path prefix for html5 mode or hash prefix for hashbang mode
   */
  constructor(
    appBase: string,
    appBaseNoFile: string,
    html5?: boolean,
    prefix?: string,
  );
  /** @type {string} */
  appBase: string;
  /** @type {string} */
  appBaseNoFile: string;
  /** @type {boolean} */
  html5: boolean;
  /** @type {string | undefined} */
  basePrefix: string | undefined;
  /** @type {string | undefined} */
  hashPrefix: string | undefined;
  /**
   * An absolute URL is the full URL, including protocol (http/https ), the optional subdomain (e.g. www ), domain (example.com), and path (which includes the directory and slug)
   * with all segments encoded according to rules specified in [RFC 3986](http://www.ietf.org/rfc/rfc3986.txt).
   * @type {string}
   */
  absUrl: string;
  /**
   * The protocol scheme of the URL, without the trailing colon.
   * Example: "http" or "https"
   * @type {string}
   */
  protocol: string;
  /**
   * Return host of current URL.
   * Note: compared to the non-AngularTS version `location.host` which returns `hostname:port`, this returns the `hostname` portion only.
   * @type {string}
   */
  host: string;
  /**
   * Port of current URL.
   *
   * ```js
   * // given URL http://example.com/#/some/path?foo=bar&baz=xoxo
   * let port = $location.port;
   * // => 80
   * ```
   * @type {number}
   */
  port: number;
  /**
   * The pathname, beginning with "/"
   * @type {string}
   */
  $$path: string;
  /**
   * The hash string, minus the hash symbol
   * @type {string}
   */
  $$hash: string;
  /**
   * Helper property for scope watch changes
   * @type {boolean}
   */
  $$urlUpdatedByLocation: boolean;
  /**
   * @deprecated
   * Return URL (e.g. `/path?a=b#hash`) when called without any parameter.
   * Change path, search and hash, when called with parameter and return `$location`.
   *
   * @param {string=} url New URL without base prefix (e.g. `/path?a=b#hash`)
   * @return {Location|string} url
   */
  url(url?: string | undefined): Location | string;
  /**
   * Change path, search and hash, when called with parameter and return `$location`.
   *
   * @param {string} url New URL without base prefix (e.g. `/path?a=b#hash`)
   * @return {Location} url
   */
  setUrl(url: string): Location;
  /**
   * Return URL (e.g. `/path?a=b#hash`) when called without any parameter.
   *
   * @return {string} url
   */
  getUrl(): string;
  /**
   * @deprecated
   * This method is getter / setter.
   *
   * Return path of current URL when called without any parameter.
   *
   * Change path when called with parameter and return `$location`.
   *
   * Note: Path should always begin with forward slash (/), this method will add the forward slash
   * if it is missing.
   *
   *
   * ```js
   * // given URL http://example.com/#/some/path?foo=bar&baz=xoxo
   * let path = $location.path();
   * // => "/some/path"
   * ```
   *
   * @param {(string|number)=} path New path
   * @return {(string|object)} path if called with no parameters, or `$location` if called with a parameter
   */
  path(path?: (string | number) | undefined): string | object;
  /**
   * Change path parameter and return `$location`.
   *
   * @param {(string|number)} path New path
   * @return {Location}
   */
  setPath(path: string | number): Location;
  /**
   *
   * Return path of current URL when called without any parameter.
   *
   * @return {(string|object)} path if called with no parameters, or `$location` if called with a parameter
   */
  getPath(): string | object;
  /**
   * @deprecated
   * This method is getter / setter.
   *
   * Returns the hash fragment when called without any parameters.
   *
   * Changes the hash fragment when called with a parameter and returns `$location`.
   *
   *
   * ```js
   * // given URL http://example.com/#/some/path?foo=bar&baz=xoxo#hashValue
   * let hash = $location.getHash();
   * // => "hashValue"
   * ```
   *
   * @param {(string|number)=} hash New hash fragment
   * @return {string|Location} hash
   */
  hash(hash?: (string | number) | undefined): string | Location;
  /**
   * Changes the hash fragment when called with a parameter and returns `$location`.
   * @param {(string|number)} hash New hash fragment
   * @return {Location} hash
   */
  setHash(hash: string | number): Location;
  /**
   * Returns the hash fragment when called without any parameters.
   * @return {string} hash
   */
  getHash(): string;
  /**
   * @deprecated
   * Returns or sets the search part (as object) of current URL when called without any parameter
   *
   * @param {string|Object=} search New search params - string or hash object.
   * @param {(string|number|Array<string>|boolean)=} paramValue If search is a string or number, then paramValue will override only a single search property.
   * @returns {Object|Location} Search object or Location object
   */
  search(
    search?: (string | any) | undefined,
    paramValue?: (string | number | Array<string> | boolean) | undefined,
    ...args: any[]
  ): any | Location;
  $$search: any;
  /**
   * Sets the search part (as object) of current URL
   *
   * @param {string|Object} search New search params - string or hash object.
   * @param {(string|number|Array<string>|boolean)=} paramValue If search is a string or number, then paramValue will override only a single search property.
   * @returns {Object} Search object or Location object
   */
  setSearch(
    search: string | any,
    paramValue?: (string | number | Array<string> | boolean) | undefined,
    ...args: any[]
  ): any;
  /**
   * Returns the search part (as object) of current URL
   *
   * @returns {Object} Search object or Location object
   */
  getSearch(): any;
  $$url: string;
  /**
   * This method is getter / setter.
   *
   * Return the history state object when called without any parameter.
   *
   * Change the history state object when called with one parameter and return `$location`.
   * The state object is later passed to `pushState` or `replaceState`.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/API/History/pushState#state|History.state}
   *
   * NOTE: This method is supported only in HTML5 mode and only in browsers supporting
   * the HTML5 History API (i.e. methods `pushState` and `replaceState`). If you need to support
   * older browsers (like IE9 or Android < 4.0), don't use this method.
   *
   * @param {any} state State object for pushState or replaceState
   * @return {any} state
   */
  state(state: any, ...args: any[]): any;
  $$state: any;
  /**
   * @param {string} url
   * @param {string} relHref
   * @returns {boolean}
   */
  parseLinkUrl(url: string, relHref: string): boolean;
  /**
   * Parse given HTML5 (regular) URL string into properties
   * @param {string} url HTML5 URL
   */
  parse(url: string): void;
  #private;
}
export class LocationProvider {
  /** @type {string} */
  hashPrefixConf: string;
  /** @type {import("./interface.ts").Html5Mode} */
  html5ModeConf: import("./interface.ts").Html5Mode;
  /** @type {Array<import("./interface.ts").UrlChangeListener>} */
  urlChangeListeners: Array<import("./interface.ts").UrlChangeListener>;
  urlChangeInit: boolean;
  /** @type {History['state']} */
  cachedState: History["state"];
  /** @typeof {History.state} */
  lastHistoryState: any;
  /** @type {string} */
  lastBrowserUrl: string;
  /**
   * Updates the browser's current URL and history state.
   *
   * @param {string|undefined} url - The target URL to navigate to.
   * @param {*} [state=null] - Optional history state object to associate with the new URL.
   * @returns {LocationProvider}
   */
  setUrl(url: string | undefined, state?: any): LocationProvider;
  /**
   * Returns the current URL with any empty hash (`#`) removed.
   * @return {string}
   */
  getBrowserUrl(): string;
  /**
   * Returns the cached state.
   * @returns {History['state']} The cached state.
   */
  state(): History["state"];
  /**
   * Caches the current state.
   *
   * @private
   */
  private cacheState;
  lastCachedState: any;
  $get: (
    | string
    | ((
        $rootScope: import("../../core/scope/scope.js").Scope,
        $rootElement: Element,
      ) => Location)
  )[];
  #private;
}
