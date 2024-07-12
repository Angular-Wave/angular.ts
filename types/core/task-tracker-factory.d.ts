export function $$TaskTrackerFactoryProvider(): void;
export class $$TaskTrackerFactoryProvider {
    $get: (string | ((log: import("../services/log").angular.LogService) => TaskTracker))[];
}
/**
 * ! This is a private undocumented service !
 *
 * @name $$taskTrackerFactory
 * @description
 * A function to create `TaskTracker` instances.
 *
 * A `TaskTracker` can keep track of pending tasks (grouped by type) and can notify interested
 * parties when all pending tasks (or tasks of a specific type) have been completed.
 * @param {import('../services/log').angular.LogService} log
 */
export function TaskTracker(log: import("../services/log").angular.LogService): void;
export class TaskTracker {
    /**
     * ! This is a private undocumented service !
     *
     * @name $$taskTrackerFactory
     * @description
     * A function to create `TaskTracker` instances.
     *
     * A `TaskTracker` can keep track of pending tasks (grouped by type) and can notify interested
     * parties when all pending tasks (or tasks of a specific type) have been completed.
     * @param {import('../services/log').angular.LogService} log
     */
    constructor(log: import("../services/log").angular.LogService);
    ALL_TASKS_TYPE: string;
    DEFAULT_TASK_TYPE: string;
    /**
     * Execute the specified function and decrement the appropriate `taskCounts` counter.
     * If the counter reaches 0, all corresponding `taskCallbacks` are executed.
     *
     * @param {Function} fn - The function to execute.
     * @param {string=} [taskType=DEFAULT_TASK_TYPE] - The type of task that is being completed.
     */
    completeTask: (fn: any, taskType: any) => void;
    /**
     * Increase the task count for the specified task type (or the default task type if non is
     * specified).
     *
     * @param {string=} [taskType=DEFAULT_TASK_TYPE] - The type of task whose count will be increased.
     */
    incTaskCount: (taskType: any) => void;
    /**
     * Execute the specified callback when all pending tasks have been completed.
     *
     * If there are no pending tasks, the callback is executed immediately. You can optionally limit
     * the tasks that will be waited for to a specific type, by passing a `taskType`.
     *
     * @param {function} callback - The function to call when there are no pending tasks.
     * @param {string=} [taskType=ALL_TASKS_TYPE] - The type of tasks that will be waited for.
     */
    notifyWhenNoPendingTasks: (callback: any, taskType: any) => void;
}
