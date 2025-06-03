export class TaskTrackerFactoryProvider {
  $get = [
    "$log",
    /**
     * Creates a new `TaskTracker` instance.
     *
     * @param {import('../services/log.js').LogService} log - The logging service.
     * @returns {TaskTracker} A new `TaskTracker` instance.
     */
    (log) => new TaskTracker(log),
  ];
}

/**
 * A factory function to create `TaskTracker` instances.
 *
 * A `TaskTracker` tracks pending tasks (grouped by type) and notifies interested
 * parties when all pending tasks (or tasks of a specific type) have been completed.
 */
export class TaskTracker {
  /**
   * @param {import('../services/log.js').LogService} log - The logging service.
   */
  constructor(log) {
    /** @private */
    this.log = log;

    /** @private */
    this.taskCounts = {};

    /** @private */
    this.taskCallbacks = [];

    /**
     * Special task types used for tracking all tasks and default tasks.
     * @type {string}
     */
    this.ALL_TASKS_TYPE = "$$all$$";

    /**
     * Default task type.
     * @type {string}
     */
    this.DEFAULT_TASK_TYPE = "$$default$$";
  }

  /**
   * Completes a task and decrements the associated task counter.
   * If the counter reaches 0, all corresponding callbacks are executed.
   *
   * @param {Function} fn - The function to execute when completing the task.
   * @param {string} [taskType=this.DEFAULT_TASK_TYPE] - The type of task being completed.
   */
  completeTask(fn, taskType = this.DEFAULT_TASK_TYPE) {
    try {
      fn();
    } finally {
      if (this.taskCounts[taskType]) {
        this.taskCounts[taskType]--;
        this.taskCounts[this.ALL_TASKS_TYPE]--;
      }

      const countForType = this.taskCounts[taskType];
      const countForAll = this.taskCounts[this.ALL_TASKS_TYPE];

      // If either the overall task queue or the specific task type queue is empty, run callbacks.
      if (!countForAll || !countForType) {
        const getNextCallback = !countForAll
          ? this.getLastCallback.bind(this)
          : () => this.getLastCallbackForType(taskType);

        let nextCb;
        while ((nextCb = getNextCallback())) {
          try {
            nextCb();
          } catch (e) {
            this.log.error(e);
          }
        }
      }
    }
  }

  /**
   * Increments the task count for the specified task type.
   *
   * @param {string} [taskType=this.DEFAULT_TASK_TYPE] - The type of task whose count will be increased.
   */
  incTaskCount(taskType = this.DEFAULT_TASK_TYPE) {
    this.taskCounts[taskType] = (this.taskCounts[taskType] || 0) + 1;
    this.taskCounts[this.ALL_TASKS_TYPE] =
      (this.taskCounts[this.ALL_TASKS_TYPE] || 0) + 1;
  }

  /**
   * Registers a callback to be executed when all pending tasks of the specified type are completed.
   * If there are no pending tasks of the specified type, the callback is executed immediately.
   *
   * @param {Function} callback - The function to execute when no pending tasks remain.
   * @param {string} [taskType=this.ALL_TASKS_TYPE] - The type of tasks to wait for completion.
   */
  notifyWhenNoPendingTasks(callback, taskType = this.ALL_TASKS_TYPE) {
    if (!this.taskCounts[taskType]) {
      callback();
    } else {
      this.taskCallbacks.push({ type: taskType, cb: callback });
    }
  }

  /**
   * Retrieves and removes the last registered callback from the queue.
   *
   * @private
   * @returns {Function|undefined} The last callback function or undefined if none exist.
   */
  getLastCallback() {
    const cbInfo = this.taskCallbacks.pop();
    return cbInfo ? cbInfo.cb : undefined;
  }

  /**
   * Retrieves and removes the last registered callback for the specified task type.
   *
   * @private
   * @param {string} taskType - The type of task for which the callback was registered.
   * @returns {Function|undefined} The last callback function for the task type, or undefined if none exist.
   */
  getLastCallbackForType(taskType) {
    for (let i = this.taskCallbacks.length - 1; i >= 0; --i) {
      const cbInfo = this.taskCallbacks[i];
      if (cbInfo.type === taskType) {
        this.taskCallbacks.splice(i, 1);
        return cbInfo.cb;
      }
    }
    return undefined;
  }
}
