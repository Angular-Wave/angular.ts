import { jqLite } from "../jqLite";
import { urlResolve } from "../core/urlUtils";
import { forEach, isUndefined, equals } from "../shared/utils";

// This variable should be used *only* inside the cacheState function.
let lastCachedState = null;

export function trimEmptyHash(url) {
  return url.replace(/#$/, "");
}

/**
 * @name $browser
 * @requires $log
 * @description
 * This object has two goals:
 *
 * - hide all the global state in the browser caused by the window object
 * - abstract away all the browser specific features and inconsistencies
 *
 */

/**
 * @param {object} $log window.console or an object with the same interface.
 */
export function Browser($log, $$taskTrackerFactory) {
  const self = this;
  const { setTimeout } = window;
  const { clearTimeout } = window;
  const pendingDeferIds = {};
  const taskTracker = $$taskTrackerFactory($log);

  /// ///////////////////////////////////////////////////////////
  // Task-tracking API
  /// ///////////////////////////////////////////////////////////

  // TODO(vojta): remove this temporary api
  self.$$completeOutstandingRequest = taskTracker.completeTask;
  self.$$incOutstandingRequestCount = taskTracker.incTaskCount;

  // TODO(vojta): prefix this method with $$ ?
  self.notifyWhenNoOutstandingRequests = taskTracker.notifyWhenNoPendingTasks;

  /// ///////////////////////////////////////////////////////////
  // URL API
  /// ///////////////////////////////////////////////////////////

  let cachedState;
  let lastHistoryState;
  let lastBrowserUrl = window.location.href;
  const baseElement = jqLite(Array.from(document.getElementsByTagName("base")));
  let pendingLocation = null;
  const getCurrentState = function getCurrentState() {
    return history.state;
  };

  cacheState();

  /**
   * @name $browser#url
   *
   * @description
   * GETTER:
   * Without any argument, this method just returns current value of `location.href` (with a
   * trailing `#` stripped of if the hash is empty).
   *
   * SETTER:
   * With at least one argument, this method sets url to new value.
   * If html5 history api supported, `pushState`/`replaceState` is used, otherwise
   * `location.href`/`location.replace` is used.
   * Returns its own instance to allow chaining.
   *
   * NOTE: this api is intended for use only by the `$location` service. Please use the
   * {@link ng.$location $location service} to change url.
   *
   * @param {string} url New url (when used as setter)
   * @param {boolean=} replace Should new url replace current history record?
   * @param {object=} state State object to use with `pushState`/`replaceState`
   */
  self.url = function (url, replace, state) {
    // In modern browsers `history.state` is `null` by default; treating it separately
    // from `undefined` would cause `$browser.url('/foo')` to change `history.state`
    // to undefined via `pushState`. Instead, let's change `undefined` to `null` here.
    if (isUndefined(state)) {
      state = null;
    }

    // setter
    if (url) {
      const sameState = lastHistoryState === state;

      // Normalize the inputted URL
      url = urlResolve(url).href;

      // Don't change anything if previous and current URLs and states match. This also prevents
      // IE<10 from getting into redirect loop when in LocationHashbangInHtml5Url mode.
      // See https://github.com/angular/angular.js/commit/ffb2701
      if (lastBrowserUrl === url && sameState) {
        return self;
      }
      // const sameBase =
      //   lastBrowserUrl && stripHash(lastBrowserUrl) === stripHash(url);
      lastBrowserUrl = url;
      lastHistoryState = state;
      history.pushState(state, "", url);
      cacheState();
      return self;
      // getter
    }
    // - pendingLocation is needed as browsers don't allow to read out
    //   the new location.href if a reload happened or if there is a bug like in iOS 9 (see
    //   https://openradar.appspot.com/22186109).
    return trimEmptyHash(pendingLocation || window.location.href);
  };

  /**
   * @name $browser#state
   *
   * @description
   * This method is a getter.
   *
   * Return history.state or null if history.state is undefined.
   *
   * @returns {object} state
   */
  self.state = function () {
    return cachedState;
  };

  const urlChangeListeners = [];
  let urlChangeInit = false;

  function cacheStateAndFireUrlChange() {
    pendingLocation = null;
    fireStateOrUrlChange();
  }

  function cacheState() {
    // This should be the only place in $browser where `history.state` is read.
    cachedState = getCurrentState();
    cachedState = isUndefined(cachedState) ? null : cachedState;

    // Prevent callbacks fo fire twice if both hashchange & popstate were fired.
    if (equals(cachedState, lastCachedState)) {
      cachedState = lastCachedState;
    }

    lastCachedState = cachedState;
    lastHistoryState = cachedState;
  }

  function fireStateOrUrlChange() {
    const prevLastHistoryState = lastHistoryState;
    cacheState();

    if (lastBrowserUrl === self.url() && prevLastHistoryState === cachedState) {
      return;
    }

    lastBrowserUrl = self.url();
    lastHistoryState = cachedState;
    forEach(urlChangeListeners, (listener) => {
      listener(self.url(), cachedState);
    });
  }

  /**
   * @name $browser#onUrlChange
   *
   * @description
   * Register callback function that will be called, when url changes.
   *
   * It's only called when the url is changed from outside of AngularJS:
   * - user types different url into address bar
   * - user clicks on history (forward/back) button
   * - user clicks on a link
   *
   * It's not called when url is changed by $browser.url() method
   *
   * The listener gets called with new url as parameter.
   *
   * NOTE: this api is intended for use only by the $location service. Please use the
   * {@link ng.$location $location service} to monitor url changes in AngularJS apps.
   *
   * @param {function(string)} listener Listener function to be called when url changes.
   * @return {function(string)} Returns the registered listener fn - handy if the fn is anonymous.
   */
  self.onUrlChange = function (callback) {
    // TODO(vojta): refactor to use node's syntax for events
    if (!urlChangeInit) {
      // We listen on both (hashchange/popstate) when available, as some browsers don't
      // fire popstate when user changes the address bar and don't fire hashchange when url
      // changed by push/replaceState

      // html5 history api - popstate event
      jqLite(window).on("popstate", cacheStateAndFireUrlChange);
      // hashchange event
      jqLite(window).on("hashchange", cacheStateAndFireUrlChange);

      urlChangeInit = true;
    }

    urlChangeListeners.push(callback);
    return callback;
  };

  /**
   * Remove popstate and hashchange handler from window.
   *
   * NOTE: this api is intended for use only by $rootScope.
   */
  self.$$applicationDestroyed = function () {
    jqLite(window).off("hashchange popstate", cacheStateAndFireUrlChange);
  };

  /**
   * Checks whether the url has changed outside of AngularJS.
   * Needs to be exported to be able to check for changes that have been done in sync,
   * as hashchange/popstate events fire in async.
   */
  self.$$checkUrlChange = fireStateOrUrlChange;

  /// ///////////////////////////////////////////////////////////
  // Misc API
  /// ///////////////////////////////////////////////////////////

  /**
   * @name $browser#baseHref
   *
   * @description
   * Returns current <base href>
   * (always relative - without domain)
   *
   * @returns {string} The current base href
   */
  self.baseHref = function () {
    const href = baseElement.attr("href");
    return href ? href.replace(/^(https?:)?\/\/[^/]*/, "") : "";
  };

  /**
   * @name $browser#defer
   * @param {function()} fn A function, who's execution should be deferred.
   * @param {number=} [delay=0] Number of milliseconds to defer the function execution.
   * @param {string=} [taskType=DEFAULT_TASK_TYPE] The type of task that is deferred.
   * @returns {*} DeferId that can be used to cancel the task via `$browser.cancel()`.
   *
   * @description
   * Executes a fn asynchronously via `setTimeout(fn, delay)`.
   *
   * Unlike when calling `setTimeout` directly, in test this function is mocked and instead of using
   * `setTimeout` in tests, the fns are queued in an array, which can be programmatically flushed
   * via `$browser.defer.flush()`.
   *
   */
  self.defer = function (fn, delay, taskType) {
    let timeoutId;

    delay = delay || 0;
    taskType = taskType || taskTracker.DEFAULT_TASK_TYPE;

    taskTracker.incTaskCount(taskType);
    timeoutId = setTimeout(() => {
      delete pendingDeferIds[timeoutId];
      taskTracker.completeTask(fn, taskType);
    }, delay);
    pendingDeferIds[timeoutId] = taskType;

    return timeoutId;
  };

  /**
   * @name $browser#cancel
   *
   * @description
   * Cancels a deferred task identified with `deferId`.
   *
   * @param {*} deferId Token returned by the `$browser.defer` function.
   * @returns {boolean} Returns `true` if the task hasn't executed yet and was successfully
   *                    canceled.
   */
  self.cancel = function (deferId) {
    if (Object.prototype.hasOwnProperty.call(pendingDeferIds, deferId)) {
      const taskType = pendingDeferIds[deferId];
      delete pendingDeferIds[deferId];
      clearTimeout(deferId);
      taskTracker.completeTask(() => {}, taskType);
      return true;
    }
    return false;
  };
}

export function BrowserProvider() {
  this.$get = [
    "$log",
    "$$taskTrackerFactory",
    function ($log, $$taskTrackerFactory) {
      return new Browser($log, $$taskTrackerFactory);
    },
  ];
}
