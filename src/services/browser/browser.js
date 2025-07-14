import { urlResolve, trimEmptyHash } from "../../core/url-utils/url-utils.js";
import { equals } from "../../shared/utils.js";

export class Browser {
  constructor() {
    /** @type {Array<import("./interface.js").UrlChangeListener>} */
    this.urlChangeListeners = [];
    this.urlChangeInit = false;

    /** @type {History['state']} */
    this.cachedState = null;
    /** @typeof {History.state} */
    this.lastHistoryState = null;
    /** @type {string} */
    this.lastBrowserUrl = window.location.href;
    this.cacheState();
  }

  /// ///////////////////////////////////////////////////////////
  // URL API
  /// ///////////////////////////////////////////////////////////

  setUrl(url, state) {
    if (state === undefined) {
      state = null;
    }

    // setter
    if (url) {
      url = urlResolve(url).href;

      if (this.lastBrowserUrl === url && this.lastHistoryState === state) {
        return this;
      }

      this.lastBrowserUrl = url;
      this.lastHistoryState = state;
      history.pushState(state, "", url);
      this.cacheState();
    }
  }

  /**
   * Returns the current URL with any empty hash (`#`) removed.
   * @return {string}
   */
  getUrl() {
    return trimEmptyHash(window.location.href);
  }

  /**
   * Returns the cached state.
   * @returns {History['state']} The cached state.
   */
  state() {
    return this.cachedState;
  }

  /**
   * Caches the current state.
   *
   * @private
   */
  cacheState() {
    const currentState = history.state ?? null;
    if (!equals(currentState, this.lastCachedState)) {
      this.cachedState = currentState;
      this.lastCachedState = currentState;
      this.lastHistoryState = currentState;
    }
  }

  /**
   * Fires the state or URL change event.
   *
   * @private
   */
  fireStateOrUrlChange() {
    const prevLastHistoryState = this.lastHistoryState;
    this.cacheState();
    if (
      this.lastBrowserUrl === this.getUrl() &&
      prevLastHistoryState === this.cachedState
    ) {
      return;
    }
    this.lastBrowserUrl = this.getUrl();
    this.lastHistoryState = this.cachedState;
    this.urlChangeListeners.forEach((listener) => {
      listener(trimEmptyHash(window.location.href), this.cachedState);
    });
  }

  /**
   * Registers a callback to be called when the URL changes.
   *
   * @param {import("./interface.js").UrlChangeListener} callback - The callback function to register.
   * @returns void
   */
  onUrlChange(callback) {
    if (!this.urlChangeInit) {
      window.addEventListener("popstate", this.fireStateOrUrlChange.bind(this));
      window.addEventListener(
        "hashchange",
        this.fireStateOrUrlChange.bind(this),
      );
      this.urlChangeInit = true;
    }
    this.urlChangeListeners.push(callback);
  }

  /// ///////////////////////////////////////////////////////////
  // Misc API
  /// ///////////////////////////////////////////////////////////
}

export class BrowserProvider {
  $get = [
    /**
     * @returns {Browser}
     */
    () => new Browser(),
  ];
}
