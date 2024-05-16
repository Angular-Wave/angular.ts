export const $$rAFSchedulerFactory = [
  () => {
    let queue;
    let cancelFn;

    function nextTick() {
      if (!queue.length) return;

      const items = queue.shift();
      items.forEach((i) => i());

      if (!cancelFn) {
        window.requestAnimationFrame(() => {
          if (!cancelFn) nextTick();
        });
      }
    }

    function scheduler(tasks) {
      // we make a copy since RAFScheduler mutates the state
      // of the passed in array variable and this would be difficult
      // to track down on the outside code
      queue = queue.concat(tasks);
      nextTick();
    }

    // eslint-disable-next-line no-multi-assign
    queue = scheduler.queue = [];

    /* waitUntilQuiet does two things:
     * 1. It will run the FINAL `fn` value only when an uncanceled RAF has passed through
     * 2. It will delay the next wave of tasks from running until the quiet `fn` has run.
     *
     * The motivation here is that animation code can request more time from the scheduler
     * before the next wave runs. This allows for certain DOM properties such as classes to
     * be resolved in time for the next animation to run.
     */
    scheduler.waitUntilQuiet = (fn) => {
      if (cancelFn) cancelFn();

      cancelFn = window.requestAnimationFrame(() => {
        cancelFn = null;
        fn();
        nextTick();
      });
    };

    return scheduler;
  },
];
