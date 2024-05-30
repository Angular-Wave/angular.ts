import { root, trimHashVal } from "../common/index";
import { BaseLocationServices } from "./baseLocationService";
/** A `LocationServices` that uses the browser hash "#" to get/set the current location */
export class HashLocationService extends BaseLocationServices {
  constructor(router) {
    super(router, false);
    root.addEventListener("hashchange", this._listener, false);
  }
  _get() {
    return trimHashVal(this._location.hash);
  }
  _set(state, title, url, replace) {
    this._location.hash = url;
  }
  dispose(router) {
    super.dispose(router);
    root.removeEventListener("hashchange", this._listener);
  }
}
