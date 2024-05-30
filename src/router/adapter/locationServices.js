/** @publicapi @module ng1 */ /** */
import { isDefined, isObject } from "../../core/utils";
import { val } from "../core/common/hof";
import { createProxyFunctions, removeFrom } from "../core/common/common";
/**
 * Implements UI-Router LocationServices and LocationConfig using Angular 1's $location service
 * @internalapi
 */
export class Ng1LocationServices {
  /**
   * Applys ng1-specific path parameter encoding
   *
   * The Angular 1 `$location` service is a bit weird.
   * It doesn't allow slashes to be encoded/decoded bi-directionally.
   *
   * See the writeup at https://github.com/angular-ui/ui-router/issues/2598
   *
   * This code patches the `path` parameter type so it encoded/decodes slashes as ~2F
   *
   * @param router
   */
  static monkeyPatchPathParameterType(router) {
    const pathType = router.urlMatcherFactory.type("path");
    pathType.encode = (x) =>
      x != null
        ? x.toString().replace(/(~|\/)/g, (m) => ({ "~": "~~", "/": "~2F" })[m])
        : x;
    pathType.decode = (x) =>
      x != null
        ? x
            .toString()
            .replace(/(~~|~2F)/g, (m) => ({ "~~": "~", "~2F": "/" })[m])
        : x;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  dispose() {}
  constructor($locationProvider) {
    // .onChange() registry
    this._urlListeners = [];
    this.$locationProvider = $locationProvider;
    const _lp = val($locationProvider);
    createProxyFunctions(_lp, this, _lp, ["hashPrefix"]);
  }
  onChange(callback) {
    this._urlListeners.push(callback);
    return () => removeFrom(this._urlListeners)(callback);
  }
  html5Mode() {
    let html5Mode = this.$locationProvider.html5Mode();
    html5Mode = isObject(html5Mode) ? html5Mode.enabled : html5Mode;
    return html5Mode && this.$sniffer.history;
  }
  baseHref() {
    return (
      this._baseHref ||
      (this._baseHref =
        this.$browser.baseHref() || this.$window.location.pathname)
    );
  }
  url(newUrl, replace = false, state) {
    if (isDefined(newUrl)) this.$location.url(newUrl);
    if (replace) this.$location.replace();
    if (state) this.$location.state(state);
    return this.$location.url();
  }
  _runtimeServices($rootScope, $location, $sniffer, $browser, $window) {
    this.$location = $location;
    this.$sniffer = $sniffer;
    this.$browser = $browser;
    this.$window = $window;
    // Bind $locationChangeSuccess to the listeners registered in LocationService.onChange
    $rootScope.$on("$locationChangeSuccess", (evt) =>
      this._urlListeners.forEach((fn) => fn(evt)),
    );
    const _loc = val($location);
    // Bind these LocationService functions to $location
    createProxyFunctions(_loc, this, _loc, [
      "replace",
      "path",
      "search",
      "hash",
    ]);
    // Bind these LocationConfig functions to $location
    createProxyFunctions(_loc, this, _loc, ["port", "protocol", "host"]);
  }
}
