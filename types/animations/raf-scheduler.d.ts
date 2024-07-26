/**
 * @typedef {Object} Scheduler
 * @property {Function} waitUntilQuiet - Function to wait until the animation frame is quiet.
 * @property {Array<Function>} queue - The queue of tasks to be processed.
 * @property {Function} scheduler - The function to add tasks to the queue and schedule the next tick.
 */
/**
 * Creates a requestAnimationFrame scheduler.
 * @returns {Scheduler} The scheduler object.
 */
export const $$rAFSchedulerFactory: (() => {
    (tasks: Array<Function>): void;
    queue: any[];
    /**
     * Waits until the animation frame is quiet before running the provided function.
     * Cancels any previous animation frame requests.
     * @param {Function} fn - The function to run when the animation frame is quiet.
     */
    waitUntilQuiet(fn: Function): void;
})[];
export type Scheduler = {
    /**
     * - Function to wait until the animation frame is quiet.
     */
    waitUntilQuiet: Function;
    /**
     * - The queue of tasks to be processed.
     */
    queue: Array<Function>;
    /**
     * - The function to add tasks to the queue and schedule the next tick.
     */
    scheduler: Function;
};
