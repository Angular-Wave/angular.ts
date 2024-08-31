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
 * This object has two goals:
 *
 * - hide all the global state in the browser caused by the window object
 * - abstract away all the browser specific features and inconsistencies
 */
export class Browser {
    /**
     * @param {import('../core/task-tracker-factory').TaskTracker} taskTracker
     */
    constructor(taskTracker: import("../core/task-tracker-factory").TaskTracker);
    /**
     * @type {import('../core/task-tracker-factory').TaskTracker} taskTracker
     */
    taskTracker: import("../core/task-tracker-factory").TaskTracker;
    pendingDeferIds: {};
    /** @type {Array<UrlChangeListener>} */
    urlChangeListeners: Array<UrlChangeListener>;
    urlChangeInit: boolean;
    /** @type {any} */
    cachedState: any;
    /** @type {any} */
    lastHistoryState: any;
    /** @type {string} */
    lastBrowserUrl: string;
    /** @type {JQLite} */
    baseElement: JQLite;
    $$completeOutstandingRequest: any;
    $$incOutstandingRequestCount: any;
    notifyWhenNoOutstandingRequests: any;
    url(url: any, state: any): string | this;
    /**
     * Returns the cached state.
     *
     * @returns {any} The cached state.
     */
    state(): any;
    /**
     * Caches the current state and fires the URL change event.
     *
     * @private
     */
    private cacheStateAndFireUrlChange;
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
     * @param {UrlChangeListener} callback - The callback function to register.
     * @returns {UrlChangeListener} The registered callback function.
     */
    onUrlChange(callback: UrlChangeListener): UrlChangeListener;
    $$applicationDestroyed(): void;
    $$checkUrlChange(): void;
    baseHref(): any;
    defer(fn: any, delay?: number, taskType?: string): number;
    cancel(deferId: any): boolean;
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
import { JQLite } from "../shared/jqlite/jqlite";
