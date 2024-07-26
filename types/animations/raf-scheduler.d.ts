/**
 * @typedef {Object} RafScheduler
 * @property {Function} waitUntilQuiet - Function to wait until the animation frame is quiet.
 */
/**
 * Creates a requestAnimationFrame scheduler.
 * @returns {RafScheduler} The scheduler object.
 */
export function $$rAFSchedulerFactory(): RafScheduler;
export type RafScheduler = {
    /**
     * - Function to wait until the animation frame is quiet.
     */
    waitUntilQuiet: Function;
};
