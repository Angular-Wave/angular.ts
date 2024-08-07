import { Angular } from "../../loader";
import { createInjector } from "../di/injector";
import { wait } from "../../shared/test-utils";

describe("$timeout", () => {
  let injector;
  let $interval;
  let $rootScope;
  let errors;
  let $timeout;
  let $browser;
  let log;

  beforeEach(() => {
    errors = [];
    log = [];
    window.angular = new Angular();
    window.angular
      .module("myModule", ["ng"])
      .decorator("$exceptionHandler", function () {
        return (exception) => {
          errors.push(exception);
        };
      });
    injector = createInjector(["myModule"]);

    $interval = injector.get("$interval");
    $rootScope = injector.get("$rootScope");
    $timeout = injector.get("$timeout");
    $browser = injector.get("$browser");
  });

  it("should delegate functions to $browser.defer", (done) => {
    let counter = 0;
    $timeout(() => {
      counter++;
    });

    expect(counter).toBe(0);

    setTimeout(() => {
      expect(counter).toBe(1);
      done();
    });
  });

  it("should call $apply after each callback is executed", (done) => {
    const applySpy = spyOn($rootScope, "$apply").and.callThrough();

    $timeout(() => {});
    expect(applySpy).not.toHaveBeenCalled();

    setTimeout(() => {
      expect(applySpy).toHaveBeenCalled();
      applySpy.calls.reset();
    });

    $timeout(() => {});
    $timeout(() => {});
    setTimeout(() => {
      expect(applySpy).toHaveBeenCalledTimes(2);
      done();
    });
  });

  it("should NOT call $apply if skipApply is set to true", (done) => {
    const applySpy = spyOn($rootScope, "$apply").and.callThrough();

    $timeout(() => {}, 12, false);
    expect(applySpy).not.toHaveBeenCalled();

    setTimeout(() => {
      expect(applySpy).not.toHaveBeenCalled();
      done();
    });
  });

  it("should NOT call $evalAsync or $digest if invokeApply is set to false", (done) => {
    const evalAsyncSpy = spyOn($rootScope, "$evalAsync").and.callThrough();
    const digestSpy = spyOn($rootScope, "$digest").and.callThrough();
    const fulfilledSpy = jasmine.createSpy("fulfilled");

    $timeout(fulfilledSpy, 1, false);

    setTimeout(() => {
      expect(fulfilledSpy).toHaveBeenCalled();
      expect(evalAsyncSpy).not.toHaveBeenCalled();
      expect(digestSpy).not.toHaveBeenCalled();
      done();
    }, 1);
  });

  it("should allow you to specify the delay time", () => {
    const defer = spyOn($browser, "defer");
    $timeout(() => {}, 123);
    expect(defer).toHaveBeenCalledTimes(1);
    expect(defer.calls.mostRecent().args[1]).toEqual(123);
  });

  it("should return a promise which will be resolved with return value of the timeout callback", (done) => {
    const promise = $timeout(() => {
      log.push("timeout");
      return "buba";
    });

    promise.then(
      (value) => {
        log.push(`promise success: ${value}`);
      },
      () => log.push("promise error"),
    );
    expect(log).toEqual([]);

    setTimeout(() => {
      expect(log).toEqual(["timeout", "promise success: buba"]);
      done();
    });
  });

  it("should allow the `fn` parameter to be optional", (done) => {
    $timeout().then(
      (value) => {
        log.push(`promise success: ${value}`);
      },
      () => log.push("promise error"),
    );
    expect(log).toEqual([]);

    setTimeout(() => {
      expect(log).toEqual(["promise success: undefined"]);
      log = [];
    });

    $timeout(1).then(
      (value) => {
        log.push(`promise success: ${value}`);
      },
      () => log.push("promise error"),
    );
    expect(log).toEqual([]);
    setTimeout(() => {
      expect(log).toEqual(["promise success: undefined"]);
      done();
    }, 1);
  });

  describe("exception handling", () => {
    it("should delegate exception to the $exceptionHandler service", async () => {
      errors = [];
      $timeout(() => {
        errors = [];
        throw "Test Error";
      }, 1);
      expect(errors).toEqual([]);

      await wait(1);
      expect(errors).toEqual([
        "Test Error",
        "Possibly unhandled rejection: Test Error",
      ]);
    });

    it("should call $apply even if an exception is thrown in callback", async () => {
      const applySpy = spyOn($rootScope, "$apply").and.callThrough();

      $timeout(() => {
        throw "Test $apply";
      });
      expect(applySpy).not.toHaveBeenCalled();
      await wait(2);
      expect(applySpy).toHaveBeenCalled();
    });

    it("should reject the timeout promise when an exception is thrown in the timeout callback", (done) => {
      const promise = $timeout(() => {
        throw "Some Error";
      });

      promise.then(
        () => log.push("success"),
        (reason) => {
          log.push(`error: ${reason}`);
        },
      );
      setTimeout(() => {
        expect(log).toEqual(["error: Some Error"]);
        done();
      });
    });

    it("should pass the timeout arguments in the timeout callback even if an exception is thrown", (done) => {
      const promise1 = $timeout(
        (arg) => {
          throw arg;
        },
        1,
        true,
        "Some Arguments",
      );
      const promise2 = $timeout(
        (arg1, args2) => {
          throw `${arg1} ${args2}`;
        },
        2,
        false,
        "Are Meant",
        "To Be Thrown",
      );

      promise1.then(
        () => log.push("success"),
        (reason) => {
          log.push(`error: ${reason}`);
        },
      );
      promise2.then(
        () => log.push("success"),
        (reason) => {
          log.push(`error: ${reason}`);
        },
      );

      setTimeout(() => {
        expect(log).toEqual([]);
      });

      setTimeout(() => {
        expect(log).toEqual(["error: Some Arguments"]);
      }, 1);
      setTimeout(() => {
        expect(log).toEqual([
          "error: Some Arguments",
          "error: Are Meant To Be Thrown",
        ]);
        done();
      }, 15);
    });

    it("should forget references to relevant deferred even when exception is thrown", () => {
      var promise = $timeout(
        function () {
          throw "Test Error";
        },
        0,
        false,
      );

      const res = $timeout.cancel(promise);
      expect(res).toBe(true);
    });
  });

  describe("cancel", () => {
    it("should cancel tasks", (done) => {
      const task1 = jasmine.createSpy("task1");
      const task2 = jasmine.createSpy("task2");
      const task3 = jasmine.createSpy("task3");
      const task4 = jasmine.createSpy("task4");
      let promise1;
      let promise3;
      let promise4;

      promise1 = $timeout(task1);
      $timeout(task2);
      promise3 = $timeout(task3, 333);
      promise4 = $timeout(333);
      promise3.then(task4, () => {});

      $timeout.cancel(promise1);
      $timeout.cancel(promise3);
      $timeout.cancel(promise4);
      setTimeout(() => {
        expect(task1).not.toHaveBeenCalled();
        expect(task2).toHaveBeenCalled();
        expect(task3).not.toHaveBeenCalled();
        expect(task4).not.toHaveBeenCalled();
        done();
      });
    });

    it("should cancel the promise", (done) => {
      const promise = $timeout(() => {});
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

      $timeout.cancel(promise);
      setTimeout(() => {
        expect(log).toEqual(["promise error: canceled"]);
        done();
      });
    });

    it("should return true if a task was successfully canceled", (done) => {
      const task1 = jasmine.createSpy("task1");
      const task2 = jasmine.createSpy("task2");
      let promise1;
      let promise2;

      promise1 = $timeout(task1);
      setTimeout(() => {
        promise2 = $timeout(task2);

        expect($timeout.cancel(promise1)).toBe(false);
        expect($timeout.cancel(promise2)).toBe(true);
        done();
      });
    });

    it("should not throw an error when given an undefined promise", () => {
      expect($timeout.cancel()).toBe(false);
    });

    it("should throw an error when given a non-$timeout promise", () => {
      const promise = $timeout(() => {}).then(() => {});
      expect(() => {
        $timeout.cancel(promise);
      }).toThrowError(/badprom/);
    });

    it("should forget references to relevant deferred", () => {
      // $browser.cancel is only called on cancel if the deferred object is still referenced
      const cancelSpy = spyOn($browser, "cancel").and.callThrough();

      const promise = $timeout(() => {}, 0, false);

      expect(cancelSpy).not.toHaveBeenCalled();
      $timeout.cancel(promise);
      expect(cancelSpy).toHaveBeenCalled();

      // Promise deferred object should already be removed from the list and not cancellable again
      $timeout.cancel(promise);
      expect(cancelSpy).toHaveBeenCalled();
    });

    it("should not trigger digest when cancelled", () => {
      const watchSpy = jasmine.createSpy("watchSpy");
      $rootScope.$watch(watchSpy);

      const t = $timeout();
      $timeout.cancel(t);
      expect(watchSpy).not.toHaveBeenCalled();
    });
  });
});
