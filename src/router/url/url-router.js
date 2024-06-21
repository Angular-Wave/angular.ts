import { stripLastPathElement } from "../../shared/strings";
import { UrlRuleFactory } from "./url-rule";
function appendBasePath(url, isHtml5, absolute, baseHref) {
  if (baseHref === "/") return url;
  if (isHtml5) return stripLastPathElement(baseHref) + url;
  if (absolute) return baseHref.slice(1) + url;
  return url;
}
/**
 * Updates URL and responds to URL changes
 *
 * ### Deprecation warning:
 * This class is now considered to be an internal API
 * Use the [[UrlService]] instead.
 * For configuring URL rules, use the [[UrlRules]] which can be found as [[UrlService.rules]].
 */
export class UrlRouter {
  /**
   *
   * @param {import('../router').UIRouter} router
   */
  constructor(router) {
    this.router = router;
    this.urlRuleFactory = new UrlRuleFactory(router);
  }
  /** Internal API. */
  update(read) {
    const $url = this.router.urlService;
    if (read) {
      this.location = $url.url();
      return;
    }
    if ($url.url() === this.location) return;
    $url.url(this.location, true);
  }
  /**
   * Internal API.
   *
   * Pushes a new location to the browser history.
   *
   * @internal
   * @param urlMatcher
   * @param params
   * @param options
   */
  push(urlMatcher, params, options) {
    const replace = options && !!options.replace;
    this.router.urlService.url(urlMatcher.format(params || {}), replace);
  }
  /**
   * Builds and returns a URL with interpolated parameters
   *
   * #### Example:
   * ```js
   * matcher = $umf.compile("/about/:person");
   * params = { person: "bob" };
   * $bob = $urlRouter.href(matcher, params);
   * // $bob == "/about/bob";
   * ```
   *
   * @param urlMatcher The [[UrlMatcher]] object which is used as the template of the URL to generate.
   * @param params An object of parameter values to fill the matcher's required parameters.
   * @param options Options object. The options are:
   *
   * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
   *
   * @returns Returns the fully compiled URL, or `null` if `params` fail validation against `urlMatcher`
   */
  href(urlMatcher, params, options) {
    let url = urlMatcher.format(params);
    if (url == null) return null;
    options = options || { absolute: false };
    const cfg = this.router.urlService.config;
    const isHtml5 = cfg.html5Mode();
    if (!isHtml5 && url !== null) {
      url = "#" + cfg.hashPrefix() + url;
    }
    url = appendBasePath(url, isHtml5, options.absolute, cfg.baseHref());
    if (!options.absolute || !url) {
      return url;
    }
    const slash = !isHtml5 && url ? "/" : "";
    const cfgPort = cfg.port();
    const port = cfgPort === 80 || cfgPort === 443 ? "" : ":" + cfgPort;
    return [cfg.protocol(), "://", cfg.host(), port, slash, url].join("");
  }
}
