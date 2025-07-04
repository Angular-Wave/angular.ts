/** @typedef {import('../interface.ts').ServiceProvider} ServiceProvider */
/** @typedef {import('../interface.ts').AnnotatedFactory} AnnotatedFactory */
/**
 * @implements {ServiceProvider}
 */
export class TaskTrackerFactoryProvider implements ServiceProvider {
  /** @type {AnnotatedFactory} */
  $get: AnnotatedFactory;
}
/**
 * A factory function to create `TaskTracker` instances.
 *
 * A `TaskTracker` tracks pending tasks (grouped by type) and notifies interested
 * parties when all pending tasks (or tasks of a specific type) have been completed.
 */
export class TaskTracker {
  /**
   * @param {import('../services/log/interface.ts').LogService} log - The logging service.
   */
  constructor(log: import("../services/log/interface.ts").LogService);
  /** @private */
  private log;
  /** @private */
  private taskCounts;
  /** @private */
  private taskCallbacks;
  /**
   * Special task types used for tracking all tasks and default tasks.
   * @type {string}
   */
  ALL_TASKS_TYPE: string;
  /**
   * Default task type.
   * @type {string}
   */
  DEFAULT_TASK_TYPE: string;
  /**
   * Completes a task and decrements the associated task counter.
   * If the counter reaches 0, all corresponding callbacks are executed.
   *
   * @param {Function} fn - The function to execute when completing the task.
   * @param {string} [taskType=this.DEFAULT_TASK_TYPE] - The type of task being completed.
   */
  completeTask(fn: Function, taskType?: string): void;
  /**
   * Increments the task count for the specified task type.
   *
   * @param {string} [taskType=this.DEFAULT_TASK_TYPE] - The type of task whose count will be increased.
   */
  incTaskCount(taskType?: string): void;
  /**
   * Registers a callback to be executed when all pending tasks of the specified type are completed.
   * If there are no pending tasks of the specified type, the callback is executed immediately.
   *
   * @param {Function} callback - The function to execute when no pending tasks remain.
   * @param {string} [taskType=this.ALL_TASKS_TYPE] - The type of tasks to wait for completion.
   */
  notifyWhenNoPendingTasks(callback: Function, taskType?: string): void;
  /**
   * Retrieves and removes the last registered callback from the queue.
   *
   * @private
   * @returns {Function|undefined} The last callback function or undefined if none exist.
   */
  private getLastCallback;
  /**
   * Retrieves and removes the last registered callback for the specified task type.
   *
   * @private
   * @param {string} taskType - The type of task for which the callback was registered.
   * @returns {Function|undefined} The last callback function for the task type, or undefined if none exist.
   */
  private getLastCallbackForType;
}
export type ServiceProvider = import("../interface.ts").ServiceProvider;
export type AnnotatedFactory = import("../interface.ts").AnnotatedFactory;
