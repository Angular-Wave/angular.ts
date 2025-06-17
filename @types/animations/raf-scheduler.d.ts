/**
 * @typedef {import('./interface.js').RafScheduler} RafScheduler
 * @typedef {import('../interface.js').ServiceProvider} ServiceProvider
 */
/**
 * Service provider that creates a requestAnimationFrame-based scheduler.
 * @implements {ServiceProvider}
 */
export class RafSchedulerProvider implements ServiceProvider {
  /**
   * Internal task queue, where each item is an array of functions to run.
   * @type {Array<Array<() => void>>}
   */
  queue: Array<Array<() => void>>;
  /**
   * ID of the currently scheduled animation frame (if any).
   * Used for cancellation and tracking.
   * @type {number|null}
   */
  cancelFn: number | null;
  /**
   * Processes the next batch of tasks in the animation frame.
   * Executes the first group of functions in the queue, then
   * schedules the next frame if needed.
   */
  nextTick(): void;
  /**
   * Returns the scheduler function.
   * This function allows tasks to be queued for execution on future animation frames.
   * It also has helper methods and state attached.
   *
   * @returns {RafScheduler} The scheduler function with `queue` and `waitUntilQuiet`.
   */
  $get(): RafScheduler;
}
export type RafScheduler = import("./interface.js").RafScheduler;
export type ServiceProvider = import("../interface.js").ServiceProvider;
