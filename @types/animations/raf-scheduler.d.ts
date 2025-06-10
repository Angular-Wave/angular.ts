/**
 * @typedef {Function} RafSchedulerFunction
 * @typedef {Object} RafSchedulerObject
 * @property {Function} waitUntilQuiet - Function to wait until the animation frame is quiet.
 * @typedef {RafSchedulerObject & RafSchedulerFunction} RafScheduler
 */
/**
 * Creates a requestAnimationFrame scheduler.
 */
export function RafSchedulerProvider(): void;
export class RafSchedulerProvider {
  /**
   * @returns {RafScheduler} The scheduler object.
   */
  $get: () => RafScheduler;
}
export type RafSchedulerFunction = Function;
export type RafSchedulerObject = {
  /**
   * - Function to wait until the animation frame is quiet.
   */
  waitUntilQuiet: Function;
};
export type RafScheduler = RafSchedulerObject & RafSchedulerFunction;
