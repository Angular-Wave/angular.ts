/**
 * A callback function that gets called when the browser URL or state changes.
 *
 * @param url - The new URL after the change (with trailing `#` removed).
 * @param state - The new history state associated with the URL (`history.state`).
 * @returns void
 */
export type UrlChangeListener = (url: string, state: History["state"]) => void;
