import { isDefined, isObject } from "../shared/utils";
import { val } from "../shared/hof";
import { createProxyFunctions, removeFrom } from "../shared/common";

/**
 * Implements UI-Router LocationServices and LocationConfig using Angular 1's $location service
 * @internalapi
 */
export class Ng1LocationServices {
  /**
   *
   * @param {angular.ILocationProvider} $locationProvider
   */
  constructor($locationProvider) {
    // .onChange() registry
    this._urlListeners = [];
    /** @type {angular.ILocationProvider} */
    this.$locationProvider = $locationProvider;
    const _lp = val($locationProvider);
    createProxyFunctions(_lp, this, _lp, ["hashPrefix"]);
  }

  dispose() {}

  onChange(callback) {
    this._urlListeners.push(callback);
    return () => removeFrom(this._urlListeners)(callback);
  }
  html5Mode() {
    let html5Mode = this.$locationProvider.html5Mode();
    html5Mode = isObject(html5Mode) ? html5Mode.enabled : html5Mode;
    return html5Mode && typeof history !== "undefined";
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

  _runtimeServices($rootScope, $location, $browser) {
    /** @type {angular.ILocationService} */ this.$location = $location;
    this.$browser = $browser;
    this.$window = window;
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
