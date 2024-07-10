import { jqLite } from "../jqlite";

/**
 * @param {HTMLElement} element
 * @param {string} event
 */
export function browserTrigger(element, event) {
  jqLite(element)[0].dispatchEvent(
    new Event(event, { bubbles: true, cancelable: true }),
  );
}

/**
 *
 * @param {number} t milliseconds to wait
 * @returns
 */
export function wait(t) {
  return new Promise((resolve, _) => setTimeout(resolve, t));
}
