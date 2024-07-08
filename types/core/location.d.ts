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
/**
 * LocationHtml5Url represents a URL
 * This object is exposed as $location service when HTML5 mode is enabled and supported
 *
 * @constructor
 * @param {string} appBase application base URL
 * @param {string} appBaseNoFile application base URL stripped of any filename
 * @param {string} basePrefix URL path prefix
 */
export function LocationHtml5Url(
  appBase: string,
  appBaseNoFile: string,
  basePrefix: string,
): void;
export class LocationHtml5Url {
  /**
   * LocationHtml5Url represents a URL
   * This object is exposed as $location service when HTML5 mode is enabled and supported
   *
   * @constructor
   * @param {string} appBase application base URL
   * @param {string} appBaseNoFile application base URL stripped of any filename
   * @param {string} basePrefix URL path prefix
   */
  constructor(appBase: string, appBaseNoFile: string, basePrefix: string);
  $$html5: boolean;
  /**
   * Parse given HTML5 (regular) URL string into properties
   * @param {string} url HTML5 URL
   * @private
   */
  private $$parse;
  $$normalizeUrl: (url: any) => string;
  $$parseLinkUrl: (url: any, relHref: any) => boolean;
}
/**
 * LocationHashbangUrl represents URL
 * This object is exposed as $location service when developer doesn't opt into html5 mode.
 * It also serves as the base class for html5 mode fallback on legacy browsers.
 *
 * @constructor
 * @param {string} appBase application base URL
 * @param {string} appBaseNoFile application base URL stripped of any filename
 * @param {string} hashPrefix hashbang prefix
 */
export function LocationHashbangUrl(
  appBase: string,
  appBaseNoFile: string,
  hashPrefix: string,
): void;
export class LocationHashbangUrl {
  /**
   * LocationHashbangUrl represents URL
   * This object is exposed as $location service when developer doesn't opt into html5 mode.
   * It also serves as the base class for html5 mode fallback on legacy browsers.
   *
   * @constructor
   * @param {string} appBase application base URL
   * @param {string} appBaseNoFile application base URL stripped of any filename
   * @param {string} hashPrefix hashbang prefix
   */
  constructor(appBase: string, appBaseNoFile: string, hashPrefix: string);
  /**
   * Parse given hashbang URL into properties
   * @param {string} url Hashbang URL
   * @private
   */
  private $$parse;
  $$normalizeUrl: (url: any) => string;
  $$parseLinkUrl: (url: any) => boolean;
}
/**
 * LocationHashbangUrl represents URL
 * This object is exposed as $location service when html5 history api is enabled but the browser
 * does not support it.
 *
 * @constructor
 * @param {string} appBase application base URL
 * @param {string} appBaseNoFile application base URL stripped of any filename
 * @param {string} hashPrefix hashbang prefix
 */
export function LocationHashbangInHtml5Url(
  appBase: string,
  appBaseNoFile: string,
  hashPrefix: string,
  ...args: any[]
): void;
export class LocationHashbangInHtml5Url {
  /**
   * LocationHashbangUrl represents URL
   * This object is exposed as $location service when html5 history api is enabled but the browser
   * does not support it.
   *
   * @constructor
   * @param {string} appBase application base URL
   * @param {string} appBaseNoFile application base URL stripped of any filename
   * @param {string} hashPrefix hashbang prefix
   */
  constructor(
    appBase: string,
    appBaseNoFile: string,
    hashPrefix: string,
    ...args: any[]
  );
  $$html5: boolean;
  $$parseLinkUrl: (url: any, relHref: any) => boolean;
  $$normalizeUrl: (url: any) => string;
}
/**
 * @ngdoc service
 * @name $location
 *
 * @requires $rootElement
 *
 * @description
 * The $location service parses the URL in the browser address bar (based on the
 * [window.location](https://developer.mozilla.org/en/window.location)) and makes the URL
 * available to your application. Changes to the URL in the address bar are reflected into
 * $location service and changes to $location are reflected into the browser address bar.
 *
 * **The $location service:**
 *
 * - Exposes the current URL in the browser address bar, so you can
 *   - Watch and observe the URL.
 *   - Change the URL.
 * - Synchronizes the URL with the browser when the user
 *   - Changes the address bar.
 *   - Clicks the back or forward button (or clicks a History link).
 *   - Clicks on a link.
 * - Represents the URL object as a set of methods (protocol, host, port, path, search, hash).
 *
 * For more information see {@link guide/$location Developer Guide: Using $location}
 */
/**
 * @ngdoc provider
 * @name $locationProvider
 *
 *
 * @description
 * Use the `$locationProvider` to configure how the application deep linking paths are stored.
 */
export function $LocationProvider(): void;
export class $LocationProvider {
  /**
   * @ngdoc method
   * @name $locationProvider#hashPrefix
   * @description
   * The default value for the prefix is `'!'`.
   * @param {string=} prefix Prefix for hash part (containing path and search)
   * @returns {*} current value if used as getter or itself (chaining) if used as setter
   */
  hashPrefix: (prefix?: string | undefined) => any;
  /**
   * @ngdoc method
   * @name $locationProvider#html5Mode
   * @description
   * @param {(boolean|Object)=} mode If boolean, sets `html5Mode.enabled` to value.
   *   If object, sets `enabled`, `requireBase` and `rewriteLinks` to respective values. Supported
   *   properties:
   *   - **enabled** – `{boolean}` – (default: false) If true, will rely on `history.pushState` to
   *     change urls where supported. Will fall back to hash-prefixed paths in browsers that do not
   *     support `pushState`.
   *   - **requireBase** - `{boolean}` - (default: `true`) When html5Mode is enabled, specifies
   *     whether or not a <base> tag is required to be present. If `enabled` and `requireBase` are
   *     true, and a base tag is not present, an error will be thrown when `$location` is injected.
   *     See the {@link guide/$location $location guide for more information}
   *   - **rewriteLinks** - `{boolean|string}` - (default: `true`) When html5Mode is enabled,
   *     enables/disables URL rewriting for relative links. If set to a string, URL rewriting will
   *     only happen on links with an attribute that matches the given string. For example, if set
   *     to `'internal-link'`, then the URL will only be rewritten for `<a internal-link>` links.
   *     Note that [attribute name normalization](guide/directive#normalization) does not apply
   *     here, so `'internalLink'` will **not** match `'internal-link'`.
   *
   * @returns {Object} html5Mode object if used as getter or itself (chaining) if used as setter
   */
  html5Mode: (mode?: (boolean | any) | undefined) => any;
  /**
   * @ngdoc event
   * @name $location#$locationChangeStart
   * @eventType broadcast on root scope
   * @description
   * Broadcasted before a URL will change.
   *
   * This change can be prevented by calling
   * `preventDefault` method of the event. See {@link ng.$rootScope.Scope#$on} for more
   * details about event object. Upon successful change
   * {@link ng.$location#$locationChangeSuccess $locationChangeSuccess} is fired.
   *
   * The `newState` and `oldState` parameters may be defined only in HTML5 mode and when
   * the browser supports the HTML5 History API.
   *
   * @param {Object} angularEvent Synthetic event object.
   * @param {string} newUrl New URL
   * @param {string=} oldUrl URL that was before it was changed.
   * @param {string=} newState New history state object
   * @param {string=} oldState History state object that was before it was changed.
   */
  /**
   * @ngdoc event
   * @name $location#$locationChangeSuccess
   * @eventType broadcast on root scope
   * @description
   * Broadcasted after a URL was changed.
   *
   * The `newState` and `oldState` parameters may be defined only in HTML5 mode and when
   * the browser supports the HTML5 History API.
   *
   * @param {Object} angularEvent Synthetic event object.
   * @param {string} newUrl New URL
   * @param {string=} oldUrl URL that was before it was changed.
   * @param {string=} newState New history state object
   * @param {string=} oldState History state object that was before it was changed.
   */
  $get: (
    | string
    | ((
        $rootScope: any,
        $browser: any,
        $rootElement: any,
      ) => LocationHtml5Url | LocationHashbangUrl)
  )[];
}
export const PATH_MATCH: RegExp;
