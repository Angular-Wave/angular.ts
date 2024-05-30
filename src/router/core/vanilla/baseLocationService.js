import { deregAll, isDefined, removeFrom, root } from "../common/index";
import { buildUrl, getParams, parseUrl } from "./utils";
/** A base `LocationServices` */
export class BaseLocationServices {
  constructor(router, fireAfterUpdate) {
    this.fireAfterUpdate = fireAfterUpdate;
    this._listeners = [];
    this._listener = (evt) => this._listeners.forEach((cb) => cb(evt));
    this.hash = () => parseUrl(this._get()).hash;
    this.path = () => parseUrl(this._get()).path;
    this.search = () => getParams(parseUrl(this._get()).search);
    this._location = root.location;
    this._history = root.history;
  }
  url(url, replace = true) {
    if (isDefined(url) && url !== this._get()) {
      this._set(null, null, url, replace);
      if (this.fireAfterUpdate) {
        this._listeners.forEach((cb) => cb({ url }));
      }
    }
    return buildUrl(this);
  }
  onChange(cb) {
    this._listeners.push(cb);
    return () => removeFrom(this._listeners, cb);
  }
  dispose(router) {
    deregAll(this._listeners);
  }
}
