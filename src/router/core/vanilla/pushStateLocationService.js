import { BaseLocationServices } from "./baseLocationService";
import {
  root,
  splitHash,
  splitQuery,
  stripLastPathElement,
} from "../common/index";
/**
 * A `LocationServices` that gets/sets the current location using the browser's `location` and `history` apis
 *
 * Uses `history.pushState` and `history.replaceState`
 */
export class PushStateLocationService extends BaseLocationServices {
  constructor(router) {
    super(router, true);
    this._config = router.urlService.config;
    root.addEventListener("popstate", this._listener, false);
  }
  /**
   * Gets the base prefix without:
   * - trailing slash
   * - trailing filename
   * - protocol and hostname
   *
   * If <base href='/base/'>, this returns '/base'.
   * If <base href='/foo/base/'>, this returns '/foo/base'.
   * If <base href='/base/index.html'>, this returns '/base'.
   * If <base href='http://localhost:8080/base/index.html'>, this returns '/base'.
   * If <base href='/base'>, this returns ''.
   * If <base href='http://localhost:8080'>, this returns ''.
   * If <base href='http://localhost:8080/'>, this returns ''.
   *
   * See: https://html.spec.whatwg.org/dev/semantics.html#the-base-element
   */
  _getBasePrefix() {
    return stripLastPathElement(this._config.baseHref());
  }
  _get() {
    let { pathname, hash, search } = this._location;
    search = splitQuery(search)[1]; // strip ? if found
    hash = splitHash(hash)[1]; // strip # if found
    const basePrefix = this._getBasePrefix();
    const exactBaseHrefMatch = pathname === this._config.baseHref();
    const startsWithBase = pathname.substr(0, basePrefix.length) === basePrefix;
    pathname = exactBaseHrefMatch
      ? "/"
      : startsWithBase
        ? pathname.substring(basePrefix.length)
        : pathname;
    return pathname + (search ? "?" + search : "") + (hash ? "#" + hash : "");
  }
  _set(state, title, url, replace) {
    const basePrefix = this._getBasePrefix();
    const slash = url && url[0] !== "/" ? "/" : "";
    const fullUrl =
      url === "" || url === "/"
        ? this._config.baseHref()
        : basePrefix + slash + url;
    if (replace) {
      this._history.replaceState(state, title, fullUrl);
    } else {
      this._history.pushState(state, title, fullUrl);
    }
  }
  dispose(router) {
    super.dispose(router);
    root.removeEventListener("popstate", this._listener);
  }
}
