/**
 * @typedef {Object} RafScheduler
 * @property {Function} waitUntilQuiet - Function to wait until the animation frame is quiet.
 */

/**
 * Creates a requestAnimationFrame scheduler.
 * @returns {RafScheduler} The scheduler object.
 */
export function $$rAFSchedulerFactory() {
  /**
   * @type {Array<Array<Function>>}
   */
  let queue = [];
  /**
   * @type {number|null}
   */
  let cancelFn = null;

  /**
   * Processes the next tick of the animation frame.
   */
  function nextTick() {
    if (!queue.length) return;

    const items = queue.shift();
    items.forEach((i) => i());

    if (!cancelFn) {
      window.requestAnimationFrame(() => {
        cancelFn = null;
        nextTick();
      });
    }
  }

  /**
   * Adds tasks to the queue and schedules the next tick.
   * @param {Array<Function>} tasks - The tasks to be added to the queue.
   */
  function scheduler(tasks) {
    // Make a copy since RAFScheduler mutates the state
    // of the passed in array variable and this would be difficult
    // to track down on the outside code
    queue = queue.concat(tasks);
    nextTick();
  }

  queue = scheduler.queue = [];

  /**
   * Waits until the animation frame is quiet before running the provided function.
   * Cancels any previous animation frame requests.
   * @param {Function} fn - The function to run when the animation frame is quiet.
   */
  scheduler.waitUntilQuiet = (fn) => {
    if (cancelFn !== null) {
      window.cancelAnimationFrame(cancelFn);
      cancelFn = null;
    }

    cancelFn = window.requestAnimationFrame(() => {
      cancelFn = null;
      fn();
      nextTick();
    });
  };

  return scheduler;
}
