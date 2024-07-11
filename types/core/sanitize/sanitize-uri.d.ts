/**
 *
 * @description
 * Private service to sanitize uris for links and images. Used by $compile.
 */
export function SanitizeUriProvider(): void;
export class SanitizeUriProvider {
  /**
   * @description
   * Retrieves or overrides the default regular expression that is used for determining trusted safe
   * urls during a[href] sanitization.
   *
   * The sanitization is a security measure aimed at prevent XSS attacks via HTML anchor links.
   *
   * Any url due to be assigned to an `a[href]` attribute via interpolation is marked as requiring
   * the $sce.URL security context. When interpolation occurs a call is made to `$sce.trustAsUrl(url)`
   * which in turn may call `$$sanitizeUri(url, isMedia)` to sanitize the potentially malicious URL.
   *
   * If the URL matches the `aHrefSanitizationTrustedUrlList` regular expression, it is returned unchanged.
   *
   * If there is no match the URL is returned prefixed with `'unsafe:'` to ensure that when it is written
   * to the DOM it is inactive and potentially malicious code will not be executed.
   *
   * @param {RegExp=} regexp New regexp to trust urls with.
   * @returns {RegExp|ng.ICompileProvider} Current RegExp if called without value or self for
   *    chaining otherwise.
   */
  aHrefSanitizationTrustedUrlList: (
    regexp?: RegExp | undefined,
  ) => RegExp | ng.ICompileProvider;
  /**
   * @description
   * Retrieves or overrides the default regular expression that is used for determining trusted safe
   * urls during img[src] sanitization.
   *
   * The sanitization is a security measure aimed at prevent XSS attacks via HTML image src links.
   *
   * Any URL due to be assigned to an `img[src]` attribute via interpolation is marked as requiring
   * the $sce.MEDIA_URL security context. When interpolation occurs a call is made to
   * `$sce.trustAsMediaUrl(url)` which in turn may call `$$sanitizeUri(url, isMedia)` to sanitize
   * the potentially malicious URL.
   *
   * If the URL matches the `imgSrcSanitizationTrustedUrlList` regular expression, it is returned
   * unchanged.
   *
   * If there is no match the URL is returned prefixed with `'unsafe:'` to ensure that when it is written
   * to the DOM it is inactive and potentially malicious code will not be executed.
   *
   * @param {RegExp=} regexp New regexp to trust urls with.
   * @returns {RegExp|ng.$compileProvider} Current RegExp if called without value or self for
   *    chaining otherwise.
   */
  imgSrcSanitizationTrustedUrlList: (
    regexp?: RegExp | undefined,
  ) => RegExp | ng.$compileProvider;
  $get: () => (uri: any, isMediaUrl: any) => any;
}
