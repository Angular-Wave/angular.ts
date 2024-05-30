import { isDefined, isUndefined } from "../common/predicates";
/** A `LocationConfig` that delegates to the browser's `location` object */
export class BrowserLocationConfig {
  constructor(router, _isHtml5 = false) {
    this._isHtml5 = _isHtml5;
    this._baseHref = undefined;
    this._hashPrefix = "";
  }
  port() {
    if (location.port) {
      return Number(location.port);
    }
    return this.protocol() === "https" ? 443 : 80;
  }
  protocol() {
    return location.protocol.replace(/:/g, "");
  }
  host() {
    return location.hostname;
  }
  html5Mode() {
    return this._isHtml5;
  }
  hashPrefix(newprefix) {
    return isDefined(newprefix)
      ? (this._hashPrefix = newprefix)
      : this._hashPrefix;
  }
  baseHref(href) {
    if (isDefined(href)) this._baseHref = href;
    if (isUndefined(this._baseHref)) this._baseHref = this.getBaseHref();
    return this._baseHref;
  }
  getBaseHref() {
    const baseTag = document.getElementsByTagName("base")[0];
    if (baseTag && baseTag.href) {
      return baseTag.href.replace(/^([^/:]*:)?\/\/[^/]*/, "");
    }
    return this._isHtml5 ? "/" : location.pathname || "/";
  }
  dispose() {}
}
