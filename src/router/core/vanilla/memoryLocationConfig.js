import { isDefined } from "../common/predicates";
import { noop } from "../common/index";
/** A `LocationConfig` mock that gets/sets all config from an in-memory object */
export class MemoryLocationConfig {
  constructor() {
    this.dispose = noop;
    this._baseHref = "";
    this._port = 80;
    this._protocol = "http";
    this._host = "localhost";
    this._hashPrefix = "";
    this.port = () => this._port;
    this.protocol = () => this._protocol;
    this.host = () => this._host;
    this.baseHref = () => this._baseHref;
    this.html5Mode = () => false;
    this.hashPrefix = (newval) =>
      isDefined(newval) ? (this._hashPrefix = newval) : this._hashPrefix;
  }
}
