export class Browser {
  /** @type {Array<import("./interface.js").UrlChangeListener>} */
  urlChangeListeners: Array<import("./interface.js").UrlChangeListener>;
  urlChangeInit: boolean;
  /** @type {History['state']} */
  cachedState: History["state"];
  /** @typeof {History.state} */
  lastHistoryState: any;
  /** @type {string} */
  lastBrowserUrl: string;
  setUrl(url: any, state: any): this;
  /**
   * Returns the current URL with any empty hash (`#`) removed.
   * @return {string}
   */
  getUrl(): string;
  /**
   * Returns the cached state.
   * @returns {History['state']} The cached state.
   */
  state(): History["state"];
  /**
   * Caches the current state.
   *
   * @private
   */
  private cacheState;
  lastCachedState: any;
  /**
   * Fires the state or URL change event.
   *
   * @private
   */
  private fireStateOrUrlChange;
  /**
   * Registers a callback to be called when the URL changes.
   *
   * @param {import("./interface.js").UrlChangeListener} callback - The callback function to register.
   * @returns void
   */
  onUrlChange(callback: import("./interface.js").UrlChangeListener): void;
}
export class BrowserProvider {
  $get: (() => Browser)[];
}
