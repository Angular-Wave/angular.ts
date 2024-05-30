import { BaseLocationServices } from "./baseLocationService";
/** A `LocationServices` that gets/sets the current location from an in-memory object */
export class MemoryLocationService extends BaseLocationServices {
  constructor(router) {
    super(router, true);
  }
  _get() {
    return this._url;
  }
  _set(state, title, url, replace) {
    this._url = url;
  }
}
