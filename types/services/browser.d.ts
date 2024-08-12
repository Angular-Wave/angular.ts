/**
 * Removes a trailing hash ('#') from the given URL if it exists.
 *
 * @param {string} url
 * @returns {string}
 */
export function trimEmptyHash(url: string): string;
/**
 * @typedef {function(string, string|null): any} UrlChangeListener
 */
/**
 * @name $browser
 * @description
 * This object has two goals:
 *
 * - hide all the global state in the browser caused by the window object
 * - abstract away all the browser specific features and inconsistencies
 *
 *
 */
/**
 * @param {import('../core/task-tracker-factory').TaskTracker} taskTracker
 */
export function Browser(taskTracker: import("../core/task-tracker-factory").TaskTracker): void;
export class Browser {
    /**
     * @typedef {function(string, string|null): any} UrlChangeListener
     */
    /**
     * @name $browser
     * @description
     * This object has two goals:
     *
     * - hide all the global state in the browser caused by the window object
     * - abstract away all the browser specific features and inconsistencies
     *
     *
     */
    /**
     * @param {import('../core/task-tracker-factory').TaskTracker} taskTracker
     */
    constructor(taskTracker: import("../core/task-tracker-factory").TaskTracker);
    $$completeOutstandingRequest: (fn: any, taskType: any) => void;
    $$incOutstandingRequestCount: (taskType: any) => void;
    notifyWhenNoOutstandingRequests: (callback: any, taskType: any) => void;
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
     * @param {string=} url New url (when used as setter)
     * @param {boolean=} replace Should new url replace current history record?
     * @param {object=} state State object to use with `pushState`/`replaceState`
     */
    url: (url?: string | undefined, replace?: boolean | undefined, state?: object | undefined) => string | this;
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
    state: () => object;
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
     * @param {UrlChangeListener} callback Listener function to be called when url changes.
     * @return {UrlChangeListener} Returns the registered listener fn - handy if the fn is anonymous.
     */
    onUrlChange: (callback: UrlChangeListener) => UrlChangeListener;
    /**
     * Remove popstate and hashchange handler from window.
     *
     * NOTE: this api is intended for use only by $rootScope.
     */
    $$applicationDestroyed: () => void;
    /**
     * Checks whether the url has changed outside of AngularJS.
     * Needs to be exported to be able to check for changes that have been done in sync,
     * as hashchange/popstate events fire in async.
     */
    $$checkUrlChange: () => void;
    /**
     * @name $browser#baseHref
     *
     * @description
     * Returns current <base href>
     * (always relative - without domain)
     *
     * @returns {string} The current base href
     */
    baseHref: () => string;
    /**
     * @name $browser#defer
     * @param {function():any} fn A function, who's execution should be deferred.
     * @param {number=} [delay=0] Number of milliseconds to defer the function execution.
     * @param {string=} [taskType=DEFAULT_TASK_TYPE] The type of task that is deferred.
     * @returns {number} DeferId that can be used to cancel the task via `$browser.cancel()`.
     *
     * @description
     * Executes a fn asynchronously via `setTimeout(fn, delay)`.
     *
     * Unlike when calling `setTimeout` directly, in test this function is mocked and instead of using
     * `setTimeout` in tests, the fns are queued in an array, which can be programmatically flushed
     * via `$browser.defer.flush()`.
     *
     */
    defer: (fn: () => any, delay?: number | undefined, taskType?: string | undefined) => number;
    /**
     * @name $browser#cancel
     *
     * @description
     * Cancels a deferred task identified with `deferId`.
     *
     * @param {number} deferId Token returned by the `$browser.defer` function.
     * @returns {boolean} Returns `true` if the task hasn't executed yet and was successfully
     *                    canceled.
     */
    cancel: (deferId: number) => boolean;
}
/**
 * This object has two goals:
 *
 * - hide all the global state in the browser caused by the window object
 * - abstract away all the browser specific features and inconsistencies
 *
 * Remove this in the future
 */
export class BrowserProvider {
    $get: (string | (($$taskTrackerFactory: import("../core/task-tracker-factory").TaskTracker) => Browser))[];
}
export type UrlChangeListener = (arg0: string, arg1: string | null) => any;
