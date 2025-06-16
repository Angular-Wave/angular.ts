/** @typedef {import('../../interface.ts').ServiceProvider} ServiceProvider } */
/**
 * Private service to sanitize uris for links and images. Used by $compile.
 * @implements {ServiceProvider}
 */
export class SanitizeUriProvider implements ServiceProvider {
  /**
   * @private
   * @type {RegExp}
   */
  private _aHrefSanitizationTrustedUrlList;
  /**
   * @private
   * @type {RegExp}
   */
  private _imgSrcSanitizationTrustedUrlList;
  /**
   * Retrieves or overrides the regexp used to trust URLs for a[href] sanitization.
   *
   * @param {RegExp=} regexp New regexp to trust URLs with.
   * @returns {RegExp|SanitizeUriProvider} Current regexp if no param, or self for chaining.
   */
  aHrefSanitizationTrustedUrlList(
    regexp?: RegExp | undefined,
  ): RegExp | SanitizeUriProvider;
  /**
   * Retrieves or overrides the regexp used to trust URLs for img[src] sanitization.
   *
   * @param {RegExp=} regexp New regexp to trust URLs with.
   * @returns {RegExp|SanitizeUriProvider} Current regexp if no param, or self for chaining.
   */
  imgSrcSanitizationTrustedUrlList(
    regexp?: RegExp | undefined,
  ): RegExp | SanitizeUriProvider;
  /**
   * @returns {import("./interface.js").SanitizerFn} Sanitizer function.
   */
  $get(): import("./interface.js").SanitizerFn;
}
/**
 * }
 */
export type ServiceProvider = import("../../interface.ts").ServiceProvider;
