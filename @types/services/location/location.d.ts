/**
 *
 * @param {string} base
 * @param {string} url
 * @returns {string} returns text from `url` after `base` or `undefined` if it does not begin with
 *                   the expected string.
 */
export function stripBaseUrl(base: string, url: string): string;
export function stripHash(url: any): any;
export function stripFile(url: any): any;
export function serverBase(url: any): any;
export class Location {
  /**
   * @param {string} appBase application base URL
   * @param {string} appBaseNoFile application base URL stripped of any filename
   * @param {boolean} html5
   * @param {string} [prefix] URL path prefix for html5 mode or hash prefix for hashbang mode
   */
  constructor(
    appBase: string,
    appBaseNoFile: string,
    html5: boolean,
    prefix?: string,
  );
  /** @type {string} */
  appBase: string;
  /** @type {string} */
  appBaseNoFile: string;
  /** @type {boolean} */
  $$html5: boolean;
  /** @type {string | undefined} */
  basePrefix: string | undefined;
  /** @type {string | undefined} */
  hashPrefix: string | undefined;
  /**
   * An absolute URL is the full URL, including protocol (http/https ), the optional subdomain (e.g. www ), domain (example.com), and path (which includes the directory and slug).
   * @type {string}
   */
  $$absUrl: string;
  /**
   * Has any change been replacing?
   * @type {boolean}
   */
  $$replace: boolean;
  /** @type {string} */
  $$protocol: string;
  /** @type {string} */
  $$host: string;
  /**
   * The port, without ":"
   * @type {number}
   */
  $$port: number;
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
   * Return full URL representation with all segments encoded according to rules specified in
   * [RFC 3986](http://www.ietf.org/rfc/rfc3986.txt).
   *
   * @return {string} full URL
   */
  absUrl(): string;
  /**
   * This method is getter / setter.
   *
   * Return URL (e.g. `/path?a=b#hash`) when called without any parameter.
   * Change path, search and hash, when called with parameter and return `$location`.
   *
   * @param {string=} url New URL without base prefix (e.g. `/path?a=b#hash`)
   * @return {Location|string} url
   */
  url(url?: string | undefined): Location | string;
  /**
   *
   * Return protocol of current URL.
   * @return {string} protocol of current URL
   */
  protocol(): string;
  /**
   * This method is getter only.
   *
   * Return host of current URL.
   *
   * Note: compared to the non-AngularTS version `location.host` which returns `hostname:port`, this returns the `hostname` portion only.
   *
   *
   * @return {string} host of current URL.
   */
  host(): string;
  /**
   * This method is getter only.
   *
   * Return port of current URL.
   *
   *
   * ```js
   * // given URL http://example.com/#/some/path?foo=bar&baz=xoxo
   * let port = $location.port();
   * // => 80
   * ```
   *
   * @return {number} port
   */
  port(): number;
  /**
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
   * This method is getter / setter.
   *
   * Returns the hash fragment when called without any parameters.
   *
   * Changes the hash fragment when called with a parameter and returns `$location`.
   *
   *
   * ```js
   * // given URL http://example.com/#/some/path?foo=bar&baz=xoxo#hashValue
   * let hash = $location.hash();
   * // => "hashValue"
   * ```
   *
   * @param {(string|number)=} hash New hash fragment
   * @return {string|Location} hash
   */
  hash(hash?: (string | number) | undefined): string | Location;
  /**
   * If called, all changes to $location during the current `$digest` will replace the current history
   * record, instead of adding a new one.
   */
  replace(): this;
  /**
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
   * Compose url and update `url` and `absUrl` property
   * @returns {void}
   */
  $$compose(): void;
  $$url: string;
  /**
   * @param {string} url
   * @returns {string}
   */
  $$normalizeUrl(url: string): string;
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
  $$parseLinkUrl(url: string, relHref: string): boolean;
  /**
   * Parse given HTML5 (regular) URL string into properties
   * @param {string} url HTML5 URL
   */
  $$parse(url: string): void;
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
  setUrl(url: any, state: any): this;
  /**
   * Returns the current URL with any empty hash (`#`) removed.
   * @return {string}
   */
  getUrl(): string;
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
  /**
   * Fires the state or URL change event.
   *
   * @private
   */
  private fireStateOrUrlChange;
  /**
   * Registers a callback to be called when the URL changes.
   *
   * @param {import("./interface.js").UrlChangeListener} callback - The callback function to register.
   * @returns void
   */
  onUrlChange(callback: import("./interface.js").UrlChangeListener): void;
  /**
   * The default value for the prefix is `'!'`.
   * @param {string=} prefix Prefix for hash part (containing path and search)
   * @returns {void}
   */
  setHashPrefix(prefix?: string | undefined): void;
  /**
   * Current hash prefix
   * @returns {string}
   */
  getHashPrefix(): string;
  /**
   * Returns html5 mode cofiguration
   * @returns {import("./interface.ts").Html5Mode}
   */
  getHtml5Mode(): import("./interface.ts").Html5Mode;
  $get: (
    | string
    | ((
        $rootScope: import("../../core/scope/scope.js").Scope,
        $rootElement: Element,
      ) => Location)
  )[];
}
