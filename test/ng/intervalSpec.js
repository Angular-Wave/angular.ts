import { publishExternalAPI } from "../../src/public";
import { createInjector } from "../../src/injector";

describe("$interval", () => {
  let injector;
  let $window;
  let $interval;
  let $rootScope;
  let errors;

  beforeEach(() => {
    errors = [];
    publishExternalAPI().decorator("$exceptionHandler", function () {
      return (exception) => {
        errors.push(exception);
      };
    });
    injector = createInjector(["ng"]);

    $interval = injector.get("$interval");
    $rootScope = injector.get("$rootScope");
  });

  it("should run tasks repeatedly", (done) => {
    let counter = 0;
    $interval(() => {
      counter++;
    }, 100);

    expect(counter).toBe(0);
    setTimeout(() => {
      expect(counter).toBe(1);
    }, 100);

    setTimeout(() => {
      expect(counter).toBe(2);
      done();
    }, 200);
  });

  it("should call $apply after each task is executed", (done) => {
    const applySpy = spyOn($rootScope, "$apply").and.callThrough();

    $interval(() => {}, 100);
    expect(applySpy).not.toHaveBeenCalled();

    setTimeout(() => {
      expect(applySpy).toHaveBeenCalled();
    }, 100);

    applySpy.calls.reset();

    $interval(() => {}, 100);
    $interval(() => {}, 100);

    setTimeout(() => {
      expect(applySpy).toHaveBeenCalledTimes(3);
      done();
    }, 100);
  });

  it("should NOT call $apply if invokeApply is set to false", (done) => {
    const applySpy = spyOn($rootScope, "$apply").and.callThrough();

    $interval(() => {}, 100, 0, false);
    expect(applySpy).not.toHaveBeenCalled();

    setTimeout(() => {
      expect(applySpy).not.toHaveBeenCalled();
      done();
    }, 200);
  });

  it("should NOT call $evalAsync or $digest if invokeApply is set to false", (done) => {
    const evalAsyncSpy = spyOn($rootScope, "$evalAsync").and.callThrough();
    const digestSpy = spyOn($rootScope, "$digest").and.callThrough();
    const notifySpy = jasmine.createSpy("notify");

    $interval(notifySpy, 100, 1, false);

    setTimeout(() => {
      expect(notifySpy).toHaveBeenCalled();
      expect(evalAsyncSpy).not.toHaveBeenCalled();
      expect(digestSpy).not.toHaveBeenCalled();
      done();
    }, 200);
  });

  it("should allow you to specify a number of iterations", (done) => {
    let counter = 0;
    $interval(
      () => {
        counter++;
      },
      100,
      2,
    );

    setTimeout(() => {
      expect(counter).toBe(1);
    }, 100);

    setTimeout(() => {
      expect(counter).toBe(2);
    }, 200);

    setTimeout(() => {
      expect(counter).toBe(2);
      done();
    }, 300);
  });

  it("should allow you to specify a number of arguments", (done) => {
    const task1 = jasmine.createSpy("task1");
    const task2 = jasmine.createSpy("task2");
    const task3 = jasmine.createSpy("task3");
    $interval(task1, 100, 2, true, "Task1");
    $interval(task2, 100, 2, true, "Task2");
    $interval(task3, 100, 2, true, "I", "am", "a", "Task3", "spy");

    setTimeout(() => {
      expect(task1).toHaveBeenCalledWith("Task1");
      expect(task2).toHaveBeenCalledWith("Task2");
      expect(task3).toHaveBeenCalledWith("I", "am", "a", "Task3", "spy");
    }, 100);

    task1.calls.reset();
    task2.calls.reset();
    task3.calls.reset();

    setTimeout(() => {
      expect(task1).toHaveBeenCalledWith("Task1");
      expect(task2).toHaveBeenCalledWith("Task2");
      expect(task3).toHaveBeenCalledWith("I", "am", "a", "Task3", "spy");
      done();
    }, 100);
  });

  it("should return a promise which will be updated with the count on each iteration", (done) => {
    const log = [];
    const promise = $interval(() => {
      log.push("tick");
    }, 100);

    promise.then(
      (value) => {
        log.push(`promise success: ${value}`);
      },
      (err) => {
        log.push(`promise error: ${err}`);
      },
      (note) => {
        log.push(`promise update: ${note}`);
      },
    );
    expect(log).toEqual([]);

    setTimeout(() => {
      expect(log).toEqual(["tick", "promise update: 0"]);
    }, 100);

    setTimeout(() => {
      expect(log).toEqual([
        "tick",
        "promise update: 0",
        "tick",
        "promise update: 1",
      ]);
      done();
    }, 200);
  });

  it("should return a promise which will be resolved after the specified number of iterations", (done) => {
    const log = [];
    const promise = $interval(
      () => {
        log.push("tick");
      },
      100,
      2,
    );

    promise.then(
      (value) => {
        log.push(`promise success: ${value}`);
      },
      (err) => {
        log.push(`promise error: ${err}`);
      },
      (note) => {
        log.push(`promise update: ${note}`);
      },
    );
    expect(log).toEqual([]);

    setTimeout(() => {
      expect(log).toEqual(["tick", "promise update: 0"]);
    }, 100);

    setTimeout(() => {
      expect(log).toEqual([
        "tick",
        "promise update: 0",
        "tick",
        "promise update: 1",
        "promise success: 2",
      ]);
      done();
    }, 200);
  });

  describe("exception handling", () => {
    it("should delegate exception to the $exceptionHandler service", (done) => {
      $interval(() => {
        throw "Test Error";
      }, 100);
      expect(errors).toEqual([]);

      setTimeout(() => {
        expect(errors).toEqual(["Test Error"]);
      }, 100);

      setTimeout(() => {
        expect(errors).toEqual(["Test Error", "Test Error"]);
        done();
      }, 200);
    });

    it("should call $apply even if an exception is thrown in callback", (done) => {
      const applySpy = spyOn($rootScope, "$apply").and.callThrough();

      $interval(() => {
        throw "Test Error";
      }, 100);
      expect(applySpy).not.toHaveBeenCalled();

      setTimeout(() => {
        expect(applySpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    it("should still update the interval promise when an exception is thrown", (done) => {
      const promise = $interval(() => {
        throw "Some Error";
      }, 100);

      promise.then(
        (value) => {
          errors.push(`promise success: ${value}`);
        },
        (err) => {
          errors.push(`promise error: ${err}`);
        },
        (note) => {
          errors.push(`promise update: ${note}`);
        },
      );
      setTimeout(() => {
        expect(errors[1]).toEqual("promise update: 0");
        done();
      }, 100);
    });
  });

  describe("cancel", () => {
    it("should cancel tasks", () => {
      const task1 = jasmine.createSpy("task1", 100);
      const task2 = jasmine.createSpy("task2", 100);
      const task3 = jasmine.createSpy("task3", 100);
      let promise1;
      let promise3;

      promise1 = $interval(task1, 200);
      $interval(task2, 100);
      promise3 = $interval(task3, 333);

      $interval.cancel(promise3);
      $interval.cancel(promise1);
      $window.flush(100);

      expect(task1).not.toHaveBeenCalled();
      expect(task2).toHaveBeenCalled();
      expect(task3).not.toHaveBeenCalled();
    });

    it("should cancel the promise", () => {
      const promise = $interval(() => {}, 100);
      const log = [];
      promise.then(
        (value) => {
          log.push(`promise success: ${value}`);
        },
        (err) => {
          log.push(`promise error: ${err}`);
        },
        (note) => {
          log.push(`promise update: ${note}`);
        },
      );
      expect(log).toEqual([]);

      $window.flush(100);
      $interval.cancel(promise);
      $window.flush(100);
      $rootScope.$apply(); // For resolving the promise -
      // necessary since q uses $rootScope.evalAsync.

      expect(log).toEqual(["promise update: 0", "promise error: canceled"]);
    });

    it("should return true if a task was successfully canceled", () => {
      const task1 = jasmine.createSpy("task1");
      const task2 = jasmine.createSpy("task2");
      let promise1;
      let promise2;

      promise1 = $interval(task1, 100, 1);
      $window.flush(100);
      promise2 = $interval(task2, 100, 1);

      expect($interval.cancel(promise1)).toBe(false);
      expect($interval.cancel(promise2)).toBe(true);
    });

    it("should not throw an error when given an undefined promise", inject((
      $interval,
    ) => {
      expect($interval.cancel()).toBe(false);
    }));

    it("should throw an error when given a non-$interval promise", () => {
      const promise = $interval(() => {}).then(() => {});
      expect(() => {
        $interval.cancel(promise);
      }).toThrow("$interval", "badprom");
    });

    it("should not trigger digest when cancelled", () => {
      const watchSpy = jasmine.createSpy("watchSpy");
      $rootScope.$watch(watchSpy);

      const t = $interval();
      $interval.cancel(t);
      expect(() => {
        $browser.defer.flush();
      }).toThrowError("No deferred tasks to be flushed");
      expect(watchSpy).not.toHaveBeenCalled();
    });
  });

  describe("$window delegation", () => {
    it("should use $window.setInterval instead of the global function", () => {
      const setIntervalSpy = spyOn($window, "setInterval");

      $interval(() => {}, 100);
      expect(setIntervalSpy).toHaveBeenCalled();
    });

    it("should use $window.clearInterval instead of the global function", () => {
      const clearIntervalSpy = spyOn($window, "clearInterval");

      $interval(() => {}, 100, 1);
      $window.flush(100);
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.calls.reset();
      $interval.cancel($interval(() => {}, 100));
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});
