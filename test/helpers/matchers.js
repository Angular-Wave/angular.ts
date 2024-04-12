beforeEach(() => {
  function cssMatcher(presentClasses, absentClasses) {
    return function () {
      return {
        compare(actual) {
          const element = angular.element(actual);
          let present = true;
          let absent = false;

          angular.forEach(presentClasses.split(" "), (className) => {
            present = present && element.hasClass(className);
          });

          angular.forEach(absentClasses.split(" "), (className) => {
            absent = absent || element.hasClass(className);
          });

          const message = function () {
            return `Expected to have ${presentClasses}${
              absentClasses ? ` and not have ${absentClasses}` : ""
            } but had ${element[0].className}.`;
          };
          return {
            pass: present && !absent,
            message,
          };
        },
      };
    };
  }

  function DOMTester(a, b) {
    if (a && b && a.nodeType > 0 && b.nodeType > 0) {
      return a === b;
    }
  }

  function isNgElementHidden(element) {
    // we need to check element.getAttribute for SVG nodes
    let hidden = true;
    forEach(angular.element(element), (element) => {
      if (
        ` ${element.getAttribute("class") || ""} `.indexOf(" ng-hide ") === -1
      ) {
        hidden = false;
      }
    });
    return hidden;
  }

  function MinErrMatcher(isNot, namespace, code, content, wording) {
    const codeRegex = new RegExp(`^${escapeRegexp(`[${namespace}:${code}]`)}`);
    const contentRegex =
      angular.isUndefined(content) || jasmine.isA_("RegExp", content)
        ? content
        : new RegExp(escapeRegexp(content));

    this.test = test;

    function escapeRegexp(str) {
      // This function escapes all special regex characters.
      // We use it to create matching regex from arbitrary strings.
      // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
      return str.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
    }

    function test(exception) {
      const exceptionMessage =
        (exception && exception.message) || exception || "";

      const codeMatches = codeRegex.test(exceptionMessage);
      const contentMatches =
        angular.isUndefined(contentRegex) ||
        contentRegex.test(exceptionMessage);
      const matches = codeMatches && contentMatches;

      return {
        pass: isNot ? !matches : matches,
        message,
      };

      function message() {
        return `Expected ${wording.inputType}${isNot ? " not" : ""} to ${
          wording.expectedAction
        } ${namespace}MinErr('${code}')${
          contentRegex ? ` matching ${contentRegex.toString()}` : ""
        }${!exception ? "." : `, but it ${wording.actualAction}: ${exceptionMessage}`}`;
      }
    }
  }

  jasmine.addMatchers({
    toBeEmpty: cssMatcher("ng-empty", "ng-not-empty"),
    toBeNotEmpty: cssMatcher("ng-not-empty", "ng-empty"),
    toBeInvalid: cssMatcher("ng-invalid", "ng-valid"),
    toBeValid: cssMatcher("ng-valid", "ng-invalid"),
    toBeDirty: cssMatcher("ng-dirty", "ng-pristine"),
    toBePristine: cssMatcher("ng-pristine", "ng-dirty"),
    toBeUntouched: cssMatcher("ng-untouched", "ng-touched"),
    toBeTouched: cssMatcher("ng-touched", "ng-untouched"),

    toBeAPromise() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true),
      };
      function generateCompare(isNot) {
        return function (actual) {
          const message = valueFn(
            `Expected object ${isNot ? "not " : ""}to be a promise`,
          );
          return { pass: isPromiseLike(actual), message };
        };
      }
    },

    toBeShown() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true),
      };
      function generateCompare(isNot) {
        return function (actual) {
          const message = valueFn(
            `Expected element ${isNot ? "" : "not "}to have 'ng-hide' class`,
          );
          let pass = !isNgElementHidden(actual);
          if (isNot) {
            pass = !pass;
          }
          return { pass, message };
        };
      }
    },

    toBeHidden() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true),
      };
      function generateCompare(isNot) {
        return function (actual) {
          const message = valueFn(
            `Expected element ${isNot ? "not " : ""}to have 'ng-hide' class`,
          );
          let pass = isNgElementHidden(actual);
          if (isNot) {
            pass = !pass;
          }
          return { pass, message };
        };
      }
    },

    toEqual(util) {
      return {
        compare(actual, expected) {
          if (actual && actual.$$log) {
            actual =
              typeof expected === "string"
                ? actual.toString()
                : actual.toArray();
          }
          return {
            pass: util.equals(actual, expected, [DOMTester]),
          };
        },
      };
    },

    toEqualOneOf(util) {
      return {
        compare(actual) {
          const expectedArgs = Array.prototype.slice.call(arguments, 1);
          return {
            pass: expectedArgs.some((expected) =>
              util.equals(actual, expected, [DOMTester]),
            ),
          };
        },
      };
    },

    toEqual() {
      return {
        compare(actual, expected) {
          return { pass: angular.equals(actual, expected) };
        },
      };
    },

    toHaveBeenCalled() {
      return {
        compare(actual) {
          if (arguments.length > 1) {
            throw new Error(
              "`toHaveBeenCalled` does not take arguments, " +
                "use `toHaveBeenCalledOnceWith`",
            );
          }

          if (!jasmine.isSpy(actual)) {
            throw new Error(`Expected a spy, but got ${jasmine.pp(actual)}.`);
          }

          const count = actual.calls.count();
          const pass = count === 1;

          const message = function () {
            let msg = `Expected spy ${actual.and.identity()}${
              pass ? " not " : " "
            }to have been called once, but `;

            switch (count) {
              case 0:
                msg += "it was never called.";
                break;
              case 1:
                msg += "it was called once.";
                break;
              default:
                msg += `it was called ${count} times.`;
                break;
            }

            return msg;
          };

          return {
            pass,
            message,
          };
        },
      };
    },

    toHaveBeenCalledOnceWith(util, customEqualityTesters) {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true),
      };

      function generateCompare(isNot) {
        return function (actual) {
          if (!jasmine.isSpy(actual)) {
            throw new Error(`Expected a spy, but got ${jasmine.pp(actual)}.`);
          }

          const expectedArgs = Array.prototype.slice.call(arguments, 1);
          const actualCount = actual.calls.count();
          const actualArgs = actualCount && actual.calls.argsFor(0);

          let pass = actualCount === 1 && util.equals(actualArgs, expectedArgs);
          if (isNot) pass = !pass;

          const message = function () {
            let msg = `Expected spy ${actual.and.identity()}${
              isNot ? " not " : " "
            }to have been called once with ${jasmine.pp(expectedArgs)}, but `;

            if (isNot) {
              msg += "it was.";
            } else {
              switch (actualCount) {
                case 0:
                  msg += "it was never called.";
                  break;
                case 1:
                  msg += `it was called with ${jasmine.pp(actualArgs)}.`;
                  break;
                default:
                  msg += `it was called ${actualCount} times.`;
                  break;
              }
            }

            return msg;
          };

          return {
            pass,
            message,
          };
        };
      }
    },

    toBe() {
      return {
        compare(actual) {
          const expectedArgs = Array.prototype.slice.call(arguments, 1);
          return { pass: expectedArgs.indexOf(actual) !== -1 };
        },
      };
    },

    toHaveClass() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true),
      };
      function hasClass(element, selector) {
        if (!element.getAttribute) return false;
        return (
          ` ${element.getAttribute("class") || ""} `
            .replace(/[\n\t]/g, " ")
            .indexOf(` ${selector} `) > -1
        );
      }
      function generateCompare(isNot) {
        return function (actual, clazz) {
          const message = function () {
            return `Expected '${angular.mock.dump(actual)}'${isNot ? " not " : ""} to have class '${clazz}'.`;
          };
          const classes = clazz.trim().split(/\s+/);
          for (let i = 0; i < classes.length; ++i) {
            if (!hasClass(actual[0], classes[i])) {
              return { pass: isNot };
            }
          }
          return { pass: !isNot };
        };
      }
    },

    toEqualMinErr() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true),
      };

      function generateCompare(isNot) {
        return function (actual, namespace, code, content) {
          const matcher = new MinErrMatcher(isNot, namespace, code, content, {
            inputType: "error",
            expectedAction: "equal",
            actualAction: "was",
          });

          return matcher.test(actual);
        };
      }
    },

    toThrow() {
      return {
        compare: generateCompare(false),
        negativeCompare: generateCompare(true),
      };

      function generateCompare(isNot) {
        return function (actual, namespace, code, content) {
          let exception;

          if (!angular.isFunction(actual)) {
            throw new Error("Actual is not a function");
          }

          try {
            actual();
          } catch (e) {
            exception = e;
          }

          const matcher = new MinErrMatcher(isNot, namespace, code, content, {
            inputType: "function",
            expectedAction: "throw",
            actualAction: "threw",
          });

          return matcher.test(exception);
        };
      }
    },

    toBeMarkedAsSelected() {
      // Selected is special because the element property and attribute reflect each other's state.

      // Support: IE 9 only
      // IE9 will wrongly report hasAttribute('selected') === true when the property is
      // undefined or null, and the dev tools show that no attribute is set

      return {
        compare(actual) {
          const errors = [];
          const optionVal = toJson(actual.value);

          if (
            actual.selected === null ||
            typeof actual.selected === "undefined" ||
            actual.selected === false
          ) {
            errors.push(
              `Expected option with value ${optionVal} to have property "selected" set to truthy`,
            );
          }

          const result = {
            pass: errors.length === 0,
            message: errors.join("\n"),
          };

          return result;
        },
        negativeCompare(actual) {
          const errors = [];
          const optionVal = toJson(actual.value);

          if (actual.selected) {
            errors.push(
              `Expected option with value ${optionVal} property "selected" to be falsy`,
            );
          }

          const result = {
            pass: errors.length === 0,
            message: errors.join("\n"),
          };

          return result;
        },
      };
    },
    toEqualSelect() {
      return {
        compare(actual, expected) {
          const actualValues = [];
          const expectedValues = [].slice.call(arguments, 1);

          forEach(actual.find("option"), (option) => {
            actualValues.push(option.selected ? [option.value] : option.value);
          });

          const message = function () {
            return `Expected ${toJson(actualValues)} to equal ${toJson(expectedValues)}.`;
          };

          return {
            pass: equals(expectedValues, actualValues),
            message,
          };
        },
      };
    },
  });
});

/**
 * Create jasmine.Spy on given method, but ignore calls without arguments
 * This is helpful when need to spy only setter methods and ignore getters
 */
function spyOnlyCallsWithArgs(obj, method) {
  const originalFn = obj[method];
  const spy = spyOn(obj, method);
  obj[method] = function () {
    if (arguments.length) return spy.apply(this, arguments);
    return originalFn.apply(this);
  };
  return spy;
}

// Minimal implementation to mock what was removed from Jasmine 1.x
function createAsync(doneFn) {
  function Job() {
    this.next = [];
  }
  Job.prototype.done = function () {
    return this.runs(doneFn);
  };
  Job.prototype.runs = function (fn) {
    const newJob = new Job();
    this.next.push(() => {
      fn();
      newJob.start();
    });
    return newJob;
  };
  Job.prototype.waitsFor = function (fn, error, timeout) {
    const newJob = new Job();
    timeout = timeout || 5000;
    this.next.push(() => {
      let counter = 0;
      const intervalId = window.setInterval(() => {
        if (fn()) {
          window.clearInterval(intervalId);
          newJob.start();
        }
        counter += 5;
        if (counter > timeout) {
          window.clearInterval(intervalId);
          throw new Error(error);
        }
      }, 5);
    });
    return newJob;
  };
  Job.prototype.waits = function (timeout) {
    return this.waitsFor(() => true, undefined, timeout);
  };
  Job.prototype.start = function () {
    let i;
    for (i = 0; i < this.next.length; i += 1) {
      this.next[i]();
    }
  };
  return new Job();
}
