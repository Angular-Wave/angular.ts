import { isObject } from "./utils.js";

/**
 * Triggers a browser event on the specified element.
 * @param {HTMLElement} element - The target element.
 * @param {Object} options - The event type and properties.
 */
export function browserTrigger(element, options) {
  const { type, ...eventProps } = options;
  let event;
  if (isObject(options) && type.startsWith("key")) {
    event = new KeyboardEvent(type, eventProps);
  } else if (isObject(options) && type.startsWith("mouse")) {
    event = new MouseEvent(type, eventProps);
  } else {
    event = new Event(type || options, { bubbles: true, cancelable: true });
  }

  element.dispatchEvent(event);
}

/**
 *
 * @param {number} t milliseconds to wait
 * @returns
 */
export function wait(t) {
  return new Promise((resolve) => setTimeout(resolve, t));
}
