/**
 * Triggers a browser event on the specified element.
 * @param {HTMLElement} element - The target element.
 * @param {Object} options - The event type and properties.
 */
export function browserTrigger(element: HTMLElement, options: any): void;
/**
 *
 * @param {number} t milliseconds to wait
 * @returns
 */
export function wait(t: number): Promise<any>;
/**
 * Helper for bootstraping content onto default element
 */
export function bootstrap(htmlContent: any, moduleName: any): any;
