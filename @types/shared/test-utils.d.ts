/**
 * Triggers a browser event on the specified element.
 * @param {HTMLElement} element - The target element.
 * @param {Object} options - The event type and properties.
 */
export function browserTrigger(element: HTMLElement, options: any): void;
/**
 * Delays execution for a specified number of milliseconds.
 * TODO remove
 *
 * @param {number} [t=0] - The number of milliseconds to wait. Defaults to 0.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
export function wait(t?: number): Promise<void>;
/**
 * Helper for bootstraping content onto default element
 */
export function bootstrap(htmlContent: any, moduleName: any): any;
