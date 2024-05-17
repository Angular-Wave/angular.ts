import { jqLite, dealoc } from "../../../src/jqLite";
import { publishExternalAPI } from "../../../src/public";
import { createInjector } from "../../../src/injector";
import { NgModelController } from "../../../src/directive/ngModel";
import { isDefined, valueFn, isObject } from "../../../src/core/utils";
import { browserTrigger } from "../../utils";

import { Angular } from "../../../src/loader";

describe("ngModel", () => {
  let ctrl;
  let scope;
  let element;
  let parentFormCtrl;
  let $compile;
  let injector;
  let $rootScope;
  let $q;

  beforeEach(() => {
    publishExternalAPI().decorator("$exceptionHandler", function () {
      return (exception, cause) => {
        throw new Error(exception.message);
      };
    });
    injector = createInjector(["ng"]);
    $compile = injector.get("$compile");

    const attrs = { name: "testAlias", ngModel: "value" };

    parentFormCtrl = {
      $$setPending: jasmine.createSpy("$$setPending"),
      $setValidity: jasmine.createSpy("$setValidity"),
      $setDirty: jasmine.createSpy("$setDirty"),
      $$clearControlValidity: () => {},
    };

    element = jqLite("<form><input></form>");
    let $controller = injector.get("$controller");
    scope = injector.get("$rootScope");
    $q = injector.get("$q");
    $rootScope = scope;
    ctrl = $controller(NgModelController, {
      $scope: scope,
      $element: element.find("input"),
      $attrs: attrs,
    });

    // Assign the mocked parentFormCtrl to the model controller
    ctrl.$$parentForm = parentFormCtrl;
  });

  afterEach(() => {
    dealoc(element);
  });

  describe("NgModelController", () => {
    it("should init the properties", () => {
      expect(ctrl.$untouched).toBe(true);
      expect(ctrl.$touched).toBe(false);
      expect(ctrl.$dirty).toBe(false);
      expect(ctrl.$pristine).toBe(true);
      expect(ctrl.$valid).toBe(true);
      expect(ctrl.$invalid).toBe(false);

      expect(ctrl.$viewValue).toBeDefined();
      expect(ctrl.$modelValue).toBeDefined();

      expect(ctrl.$formatters).toEqual([]);
      expect(ctrl.$parsers).toEqual([]);

      expect(ctrl.$name).toBe("testAlias");
    });

    describe("setValidity", () => {
      function expectOneError() {
        expect(ctrl.$error).toEqual({ someError: true });
        expect(ctrl.$$success).toEqual({});
        expect(ctrl.$pending).toBeUndefined();
      }

      function expectOneSuccess() {
        expect(ctrl.$error).toEqual({});
        expect(ctrl.$$success).toEqual({ someError: true });
        expect(ctrl.$pending).toBeUndefined();
      }

      function expectOnePending() {
        expect(ctrl.$error).toEqual({});
        expect(ctrl.$$success).toEqual({});
        expect(ctrl.$pending).toEqual({ someError: true });
      }

      function expectCleared() {
        expect(ctrl.$error).toEqual({});
        expect(ctrl.$$success).toEqual({});
        expect(ctrl.$pending).toBeUndefined();
      }

      it("should propagate validity to the parent form", () => {
        expect(parentFormCtrl.$setValidity).not.toHaveBeenCalled();
        ctrl.$setValidity("ERROR", false);
        expect(parentFormCtrl.$setValidity).toHaveBeenCalledOnceWith(
          "ERROR",
          false,
          ctrl,
        );
      });

      it("should transition from states correctly", () => {
        expectCleared();

        ctrl.$setValidity("someError", false);
        expectOneError();

        ctrl.$setValidity("someError", undefined);
        expectOnePending();

        ctrl.$setValidity("someError", true);
        expectOneSuccess();

        ctrl.$setValidity("someError", null);
        expectCleared();
      });

      it("should set valid/invalid with multiple errors", () => {
        ctrl.$setValidity("first", false);
        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);

        ctrl.$setValidity("second", false);
        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);

        ctrl.$setValidity("third", undefined);
        expect(ctrl.$valid).toBeUndefined();
        expect(ctrl.$invalid).toBeUndefined();

        ctrl.$setValidity("third", null);
        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);

        ctrl.$setValidity("second", true);
        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);

        ctrl.$setValidity("first", true);
        expect(ctrl.$valid).toBe(true);
        expect(ctrl.$invalid).toBe(false);
      });
    });

    describe("setPristine", () => {
      it("should set control to its pristine state", () => {
        ctrl.$setViewValue("edit");
        expect(ctrl.$dirty).toBe(true);
        expect(ctrl.$pristine).toBe(false);

        ctrl.$setPristine();
        expect(ctrl.$dirty).toBe(false);
        expect(ctrl.$pristine).toBe(true);
      });
    });

    describe("setDirty", () => {
      it("should set control to its dirty state", () => {
        expect(ctrl.$pristine).toBe(true);
        expect(ctrl.$dirty).toBe(false);

        ctrl.$setDirty();
        expect(ctrl.$pristine).toBe(false);
        expect(ctrl.$dirty).toBe(true);
      });

      it("should set parent form to its dirty state", () => {
        ctrl.$setDirty();
        expect(parentFormCtrl.$setDirty).toHaveBeenCalled();
      });
    });

    describe("setUntouched", () => {
      it("should set control to its untouched state", () => {
        ctrl.$setTouched();

        ctrl.$setUntouched();
        expect(ctrl.$touched).toBe(false);
        expect(ctrl.$untouched).toBe(true);
      });
    });

    describe("setTouched", () => {
      it("should set control to its touched state", () => {
        ctrl.$setUntouched();

        ctrl.$setTouched();
        expect(ctrl.$touched).toBe(true);
        expect(ctrl.$untouched).toBe(false);
      });
    });

    describe("view -> model", () => {
      it("should set the value to $viewValue", () => {
        ctrl.$setViewValue("some-val");
        expect(ctrl.$viewValue).toBe("some-val");
      });

      it("should pipeline all registered parsers and set result to $modelValue", () => {
        const log = [];

        ctrl.$parsers.push((value) => {
          log.push(value);
          return `${value}-a`;
        });

        ctrl.$parsers.push((value) => {
          log.push(value);
          return `${value}-b`;
        });

        ctrl.$setViewValue("init");
        expect(log).toEqual(["init", "init-a"]);
        expect(ctrl.$modelValue).toBe("init-a-b");
      });

      it("should fire viewChangeListeners when the value changes in the view (even if invalid)", () => {
        const spy = jasmine.createSpy("viewChangeListener");
        ctrl.$viewChangeListeners.push(spy);
        ctrl.$setViewValue("val");
        expect(spy).toHaveBeenCalled();
        spy.calls.reset();

        // invalid
        ctrl.$parsers.push(() => undefined);
        ctrl.$setViewValue("val2");
        expect(spy).toHaveBeenCalled();
      });

      it("should reset the model when the view is invalid", () => {
        ctrl.$setViewValue("aaaa");
        expect(ctrl.$modelValue).toBe("aaaa");

        // add a validator that will make any input invalid
        ctrl.$parsers.push(() => undefined);
        expect(ctrl.$modelValue).toBe("aaaa");
        ctrl.$setViewValue("bbbb");
        expect(ctrl.$modelValue).toBeUndefined();
      });

      it("should not reset the model when the view is invalid due to an external validator", () => {
        ctrl.$setViewValue("aaaa");
        expect(ctrl.$modelValue).toBe("aaaa");

        ctrl.$setValidity("someExternalError", false);
        ctrl.$setViewValue("bbbb");
        expect(ctrl.$modelValue).toBe("bbbb");
      });

      it("should not reset the view when the view is invalid", () => {
        // this test fails when the view changes the model and
        // then the model listener in ngModel picks up the change and
        // tries to update the view again.

        // add a validator that will make any input invalid
        ctrl.$parsers.push(() => undefined);
        spyOn(ctrl, "$render");

        // first digest
        ctrl.$setViewValue("bbbb");
        expect(ctrl.$modelValue).toBeUndefined();
        expect(ctrl.$viewValue).toBe("bbbb");
        expect(ctrl.$render).not.toHaveBeenCalled();
        expect(scope.value).toBeUndefined();

        // further digests
        scope.$apply('value = "aaa"');
        expect(ctrl.$viewValue).toBe("aaa");
        ctrl.$render.calls.reset();

        ctrl.$setViewValue("cccc");
        expect(ctrl.$modelValue).toBeUndefined();
        expect(ctrl.$viewValue).toBe("cccc");
        expect(ctrl.$render).not.toHaveBeenCalled();
        expect(scope.value).toBeUndefined();
      });

      it("should call parentForm.$setDirty only when pristine", () => {
        ctrl.$setViewValue("");
        expect(ctrl.$pristine).toBe(false);
        expect(ctrl.$dirty).toBe(true);
        expect(parentFormCtrl.$setDirty).toHaveBeenCalled();

        parentFormCtrl.$setDirty.calls.reset();
        ctrl.$setViewValue("");
        expect(ctrl.$pristine).toBe(false);
        expect(ctrl.$dirty).toBe(true);
        expect(parentFormCtrl.$setDirty).not.toHaveBeenCalled();
      });

      it("should remove all other errors when any parser returns undefined", () => {
        let a;
        let b;
        const val = function (val, x) {
          return x ? val : x;
        };

        ctrl.$parsers.push((v) => val(v, a));
        ctrl.$parsers.push((v) => val(v, b));

        ctrl.$validators.high = function (value) {
          return !isDefined(value) || value > 5;
        };

        ctrl.$validators.even = function (value) {
          return !isDefined(value) || value % 2 === 0;
        };

        a = b = true;

        ctrl.$setViewValue("3");
        expect(ctrl.$error).toEqual({ high: true, even: true });

        ctrl.$setViewValue("10");
        expect(ctrl.$error).toEqual({});

        a = undefined;

        ctrl.$setViewValue("12");
        expect(ctrl.$error).toEqual({ parse: true });

        a = true;
        b = undefined;

        ctrl.$setViewValue("14");
        expect(ctrl.$error).toEqual({ parse: true });

        a = undefined;
        b = undefined;

        ctrl.$setViewValue("16");
        expect(ctrl.$error).toEqual({ parse: true });

        a = b = false; // not undefined

        ctrl.$setViewValue("2");
        expect(ctrl.$error).toEqual({ high: true });
      });

      it("should not remove external validators when a parser failed", () => {
        ctrl.$parsers.push((v) => undefined);
        ctrl.$setValidity("externalError", false);
        ctrl.$setViewValue("someValue");
        expect(ctrl.$error).toEqual({ externalError: true, parse: true });
      });

      it("should remove all non-parse-related CSS classes from the form when a parser fails", () => {
        const element = $compile(
          '<form name="myForm">' +
            '<input name="myControl" ng-model="value" >' +
            "</form>",
        )($rootScope);
        const inputElm = element.find("input");
        const ctrl = $rootScope.myForm.myControl;

        let parserIsFailing = false;
        ctrl.$parsers.push((value) => (parserIsFailing ? undefined : value));

        ctrl.$validators.alwaysFail = function () {
          return false;
        };

        ctrl.$setViewValue("123");
        scope.$digest();

        expect(element[0].classList.contains("ng-valid-parse")).toBeTrue();
        expect(element[0].classList.contains("ng-invalid-parse")).toBeFalse();
        expect(
          element[0].classList.contains("ng-invalid-always-fail"),
        ).toBeTrue();

        parserIsFailing = true;
        ctrl.$setViewValue("12345");
        scope.$digest();

        expect(element[0].classList.contains("ng-valid-parse")).toBeFalse();
        expect(element[0].classList.contains("ng-invalid-parse")).toBeTrue();
        expect(
          element[0].classList.contains("ng-invalid-always-fail"),
        ).toBeFalse();
        dealoc(element);
      });

      it("should set the ng-invalid-parse and ng-valid-parse CSS class when parsers fail and pass", () => {
        let pass = true;
        ctrl.$parsers.push((v) => (pass ? v : undefined));

        const input = element.find("input");

        ctrl.$setViewValue("1");
        expect(input[0].classList.contains("ng-valid-parse")).toBeTrue();
        expect(input[0].classList.contains("ng-invalid-parse")).toBeFalse();

        pass = undefined;

        ctrl.$setViewValue("2");
        expect(input[0].classList.contains("ng-valid-parse")).toBeFalse();
        expect(input[0].classList.contains("ng-invalid-parse")).toBeTrue();
      });

      it("should update the model after all async validators resolve", () => {
        let defer;
        ctrl.$asyncValidators.promiseValidator = function (value) {
          defer = $q.defer();
          return defer.promise;
        };

        // set view value on first digest
        ctrl.$setViewValue("b");

        expect(ctrl.$modelValue).toBeUndefined();
        expect(scope.value).toBeUndefined();

        defer.resolve();
        scope.$digest();

        expect(ctrl.$modelValue).toBe("b");
        expect(scope.value).toBe("b");

        // set view value on further digests
        ctrl.$setViewValue("c");

        expect(ctrl.$modelValue).toBe("b");
        expect(scope.value).toBe("b");

        defer.resolve();
        scope.$digest();

        expect(ctrl.$modelValue).toBe("c");
        expect(scope.value).toBe("c");
      });

      it("should not throw an error if the scope has been destroyed", () => {
        scope.$destroy();
        ctrl.$setViewValue("some-val");
        expect(ctrl.$viewValue).toBe("some-val");
      });
    });

    describe("model -> view", () => {
      it("should set the value to $modelValue", () => {
        scope.$apply("value = 10");
        expect(ctrl.$modelValue).toBe(10);
      });

      it("should pipeline all registered formatters in reversed order and set result to $viewValue", () => {
        const log = [];

        ctrl.$formatters.unshift((value) => {
          log.push(value);
          return value + 2;
        });

        ctrl.$formatters.unshift((value) => {
          log.push(value);
          return `${value}`;
        });

        scope.$apply("value = 3");
        expect(log).toEqual([3, 5]);
        expect(ctrl.$viewValue).toBe("5");
      });

      it("should $render only if value changed", () => {
        spyOn(ctrl, "$render");

        scope.$apply("value = 3");
        expect(ctrl.$render).toHaveBeenCalled();
        ctrl.$render.calls.reset();

        ctrl.$formatters.push(() => 3);
        scope.$apply("value = 5");
        expect(ctrl.$render).not.toHaveBeenCalled();
      });

      it("should clear the view even if invalid", () => {
        spyOn(ctrl, "$render");

        ctrl.$formatters.push(() => undefined);
        scope.$apply("value = 5");
        expect(ctrl.$render).toHaveBeenCalled();
      });

      it("should render immediately even if there are async validators", () => {
        spyOn(ctrl, "$render");
        ctrl.$asyncValidators.someValidator = function () {
          return $q.defer().promise;
        };

        scope.$apply("value = 5");
        expect(ctrl.$viewValue).toBe(5);
        expect(ctrl.$render).toHaveBeenCalled();
      });

      it("should not rerender nor validate in case view value is not changed", () => {
        ctrl.$formatters.push((value) => "nochange");

        spyOn(ctrl, "$render");
        ctrl.$validators.spyValidator = jasmine.createSpy("spyValidator");
        scope.$apply('value = "first"');
        scope.$apply('value = "second"');
        expect(ctrl.$validators.spyValidator).toHaveBeenCalled();
        expect(ctrl.$render).toHaveBeenCalled();
      });

      it("should always format the viewValue as a string for a blank input type when the value is present", () => {
        const form = $compile(
          '<form name="form"><input name="field" ng-model="val" /></form>',
        )($rootScope);

        $rootScope.val = 123;
        $rootScope.$digest();
        expect($rootScope.form.field.$viewValue).toBe("123");

        $rootScope.val = null;
        $rootScope.$digest();
        expect($rootScope.form.field.$viewValue).toBe(null);

        dealoc(form);
      });

      it("should always format the viewValue as a string for a `text` input type when the value is present", () => {
        const form = $compile(
          '<form name="form"><input type="text" name="field" ng-model="val" /></form>',
        )($rootScope);
        $rootScope.val = 123;
        $rootScope.$digest();
        expect($rootScope.form.field.$viewValue).toBe("123");

        $rootScope.val = null;
        $rootScope.$digest();
        expect($rootScope.form.field.$viewValue).toBe(null);

        dealoc(form);
      });

      it("should always format the viewValue as a string for an `email` input type when the value is present", () => {
        const form = $compile(
          '<form name="form"><input type="email" name="field" ng-model="val" /></form>',
        )($rootScope);
        $rootScope.val = 123;
        $rootScope.$digest();
        expect($rootScope.form.field.$viewValue).toBe("123");

        $rootScope.val = null;
        $rootScope.$digest();
        expect($rootScope.form.field.$viewValue).toBe(null);

        dealoc(form);
      });

      it("should always format the viewValue as a string for a `url` input type when the value is present", () => {
        const form = $compile(
          '<form name="form"><input type="url" name="field" ng-model="val" /></form>',
        )($rootScope);
        $rootScope.val = 123;
        $rootScope.$digest();
        expect($rootScope.form.field.$viewValue).toBe("123");

        $rootScope.val = null;
        $rootScope.$digest();
        expect($rootScope.form.field.$viewValue).toBe(null);

        dealoc(form);
      });

      it("should set NaN as the $modelValue when an asyncValidator is present", () => {
        ctrl.$asyncValidators.test = function () {
          return $q((resolve, reject) => {
            resolve();
          });
        };

        scope.$apply("value = 10");
        expect(ctrl.$modelValue).toBe(10);

        expect(() => {
          scope.$apply(() => {
            scope.value = NaN;
          });
        }).not.toThrow();

        expect(ctrl.$modelValue).toBeNaN();
      });

      describe("$processModelValue", () => {
        // Emulate setting the model on the scope
        function setModelValue(ctrl, value) {
          ctrl.$modelValue = ctrl.$$rawModelValue = value;
          ctrl.$$parserValid = undefined;
        }

        it("should run the model -> view pipeline", () => {
          const log = [];
          const input = ctrl.$$element;

          ctrl.$formatters.unshift((value) => {
            log.push(value);
            return value + 2;
          });

          ctrl.$formatters.unshift((value) => {
            log.push(value);
            return `${value}`;
          });

          spyOn(ctrl, "$render");

          setModelValue(ctrl, 3);

          expect(ctrl.$modelValue).toBe(3);

          ctrl.$processModelValue();

          expect(ctrl.$modelValue).toBe(3);
          expect(log).toEqual([3, 5]);
          expect(ctrl.$viewValue).toBe("5");
          expect(ctrl.$render).toHaveBeenCalled();
        });

        // TODO
        // it("should add the validation and empty-state classes", () => {
        //   const input = $compile(
        //     '<input name="myControl" maxlength="1" ng-model="value" >',
        //   )($rootScope);
        //   $rootScope.$digest();

        //   spyOn($animate, "addClass");
        //   spyOn($animate, "removeClass");

        //   const ctrl = input.controller("ngModel");

        //   expect(input[0].classList.contains("ng-empty")).toBeTrue();
        //   expect(input[0].classList.contains("ng-valid")).toBeTrue();

        //   setModelValue(ctrl, 3);
        //   ctrl.$processModelValue();

        //   // $animate adds / removes classes in the $$postDigest, which
        //   // we cannot trigger with $digest, because that would set the model from the scope,
        //   // so we simply check if the functions have been called
        //   expect($animate.removeClass.calls.mostRecent().args[0][0]).toBe(
        //     input[0],
        //   );
        //   expect($animate.removeClass.calls.mostRecent().args[1]).toBe(
        //     "ng-empty",
        //   );

        //   expect($animate.addClass.calls.mostRecent().args[0][0]).toBe(
        //     input[0],
        //   );
        //   expect($animate.addClass.calls.mostRecent().args[1]).toBe(
        //     "ng-not-empty",
        //   );

        //   $animate.removeClass.calls.reset();
        //   $animate.addClass.calls.reset();

        //   setModelValue(ctrl, 35);
        //   ctrl.$processModelValue();

        //   expect($animate.addClass.calls.argsFor(1)[0][0]).toBe(input[0]);
        //   expect($animate.addClass.calls.argsFor(1)[1]).toBe("ng-invalid");

        //   expect($animate.addClass.calls.argsFor(2)[0][0]).toBe(input[0]);
        //   expect($animate.addClass.calls.argsFor(2)[1]).toBe(
        //     "ng-invalid-maxlength",
        //   );
        // });

        // this is analogue to $setViewValue
        it("should run the model -> view pipeline even if the value has not changed", () => {
          const log = [];

          ctrl.$formatters.unshift((value) => {
            log.push(value);
            return value + 2;
          });

          ctrl.$formatters.unshift((value) => {
            log.push(value);
            return `${value}`;
          });

          spyOn(ctrl, "$render");

          setModelValue(ctrl, 3);
          ctrl.$processModelValue();

          expect(ctrl.$modelValue).toBe(3);
          expect(ctrl.$viewValue).toBe("5");
          expect(log).toEqual([3, 5]);
          expect(ctrl.$render).toHaveBeenCalled();

          ctrl.$processModelValue();
          expect(ctrl.$modelValue).toBe(3);
          expect(ctrl.$viewValue).toBe("5");
          expect(log).toEqual([3, 5, 3, 5]);
          // $render() is not called if the viewValue didn't change
          expect(ctrl.$render).toHaveBeenCalled();
        });
      });
    });

    describe("validation", () => {
      describe("$validate", () => {
        it("should perform validations when $validate() is called", () => {
          scope.$apply('value = ""');

          let validatorResult = false;
          ctrl.$validators.someValidator = function (value) {
            return validatorResult;
          };

          ctrl.$validate();

          expect(ctrl.$valid).toBe(false);

          validatorResult = true;
          ctrl.$validate();

          expect(ctrl.$valid).toBe(true);
        });

        it("should pass the last parsed modelValue to the validators", () => {
          ctrl.$parsers.push((modelValue) => `${modelValue}def`);

          ctrl.$setViewValue("abc");

          ctrl.$validators.test = function (modelValue, viewValue) {
            return true;
          };

          spyOn(ctrl.$validators, "test");

          ctrl.$validate();

          expect(ctrl.$validators.test).toHaveBeenCalledWith("abcdef", "abc");
        });

        it("should set the model to undefined when it becomes invalid", () => {
          let valid = true;
          ctrl.$validators.test = function (modelValue, viewValue) {
            return valid;
          };

          scope.$apply('value = "abc"');
          expect(scope.value).toBe("abc");

          valid = false;
          ctrl.$validate();

          expect(scope.value).toBeUndefined();
        });

        it("should update the model when it becomes valid", () => {
          let valid = true;
          ctrl.$validators.test = function (modelValue, viewValue) {
            return valid;
          };

          scope.$apply('value = "abc"');
          expect(scope.value).toBe("abc");

          valid = false;
          ctrl.$validate();
          expect(scope.value).toBeUndefined();

          valid = true;
          ctrl.$validate();
          expect(scope.value).toBe("abc");
        });

        it("should not update the model when it is valid, but there is a parse error", () => {
          ctrl.$parsers.push((modelValue) => undefined);

          ctrl.$setViewValue("abc");
          expect(ctrl.$error.parse).toBe(true);
          expect(scope.value).toBeUndefined();

          ctrl.$validators.test = function (modelValue, viewValue) {
            return true;
          };

          ctrl.$validate();
          expect(ctrl.$error).toEqual({ parse: true });
          expect(scope.value).toBeUndefined();
        });

        it("should not set an invalid model to undefined when validity is the same", () => {
          ctrl.$validators.test = function () {
            return false;
          };

          scope.$apply('value = "invalid"');
          expect(ctrl.$valid).toBe(false);
          expect(scope.value).toBe("invalid");

          ctrl.$validate();
          expect(ctrl.$valid).toBe(false);
          expect(scope.value).toBe("invalid");
        });

        it("should not change a model that has a formatter", () => {
          ctrl.$validators.test = function () {
            return true;
          };

          ctrl.$formatters.push((modelValue) => "xyz");

          scope.$apply('value = "abc"');
          expect(ctrl.$viewValue).toBe("xyz");

          ctrl.$validate();
          expect(scope.value).toBe("abc");
        });

        it("should not change a model that has a parser", () => {
          ctrl.$validators.test = function () {
            return true;
          };

          ctrl.$parsers.push((modelValue) => "xyz");

          scope.$apply('value = "abc"');

          ctrl.$validate();
          expect(scope.value).toBe("abc");
        });
      });

      describe("view -> model update", () => {
        it("should always perform validations using the parsed model value", () => {
          let captures;
          ctrl.$validators.raw = function () {
            captures = Array.prototype.slice.call(arguments);
            return captures[0];
          };

          ctrl.$parsers.push((value) => value.toUpperCase());

          ctrl.$setViewValue("my-value");

          expect(captures).toEqual(["MY-VALUE", "my-value"]);
        });

        it("should always perform validations using the formatted view value", () => {
          let captures;
          ctrl.$validators.raw = function () {
            captures = Array.prototype.slice.call(arguments);
            return captures[0];
          };

          ctrl.$formatters.push((value) => `${value}...`);

          scope.$apply('value = "matias"');

          expect(captures).toEqual(["matias", "matias..."]);
        });

        it("should only perform validations if the view value is different", () => {
          let count = 0;
          ctrl.$validators.countMe = function () {
            count++;
          };

          ctrl.$setViewValue("my-value");
          expect(count).toBe(1);

          ctrl.$setViewValue("my-value");
          expect(count).toBe(1);

          ctrl.$setViewValue("your-value");
          expect(count).toBe(2);
        });
      });

      it("should perform validations twice each time the model value changes within a digest", () => {
        let count = 0;
        ctrl.$validators.number = function (value) {
          count++;
          return /^\d+$/.test(value);
        };

        scope.$apply('value = ""');
        expect(count).toBe(1);

        scope.$apply("value = 1");
        expect(count).toBe(2);

        scope.$apply("value = 1");
        expect(count).toBe(2);

        scope.$apply('value = ""');
        expect(count).toBe(3);
      });

      it("should only validate to true if all validations are true", () => {
        ctrl.$modelValue = undefined;
        ctrl.$validators.a = valueFn(true);
        ctrl.$validators.b = valueFn(true);
        ctrl.$validators.c = valueFn(false);

        ctrl.$validate();
        expect(ctrl.$valid).toBe(false);

        ctrl.$validators.c = valueFn(true);

        ctrl.$validate();
        expect(ctrl.$valid).toBe(true);
      });

      it("should treat all responses as boolean for synchronous validators", () => {
        const expectValid = function (value, expected) {
          ctrl.$modelValue = undefined;
          ctrl.$validators.a = valueFn(value);

          ctrl.$validate();
          expect(ctrl.$valid).toBe(expected);
        };

        // False tests
        expectValid(false, false);
        expectValid(undefined, false);
        expectValid(null, false);
        expectValid(0, false);
        expectValid(NaN, false);
        expectValid("", false);

        // True tests
        expectValid(true, true);
        expectValid(1, true);
        expectValid("0", true);
        expectValid("false", true);
        expectValid([], true);
        expectValid({}, true);
      });

      it("should register invalid validations on the $error object", () => {
        ctrl.$modelValue = undefined;
        ctrl.$validators.unique = valueFn(false);
        ctrl.$validators.tooLong = valueFn(false);
        ctrl.$validators.notNumeric = valueFn(true);

        ctrl.$validate();

        expect(ctrl.$error.unique).toBe(true);
        expect(ctrl.$error.tooLong).toBe(true);
        expect(ctrl.$error.notNumeric).not.toBe(true);
      });

      it("should render a validator asynchronously when a promise is returned", () => {
        let defer;
        ctrl.$asyncValidators.promiseValidator = function (value) {
          defer = $q.defer();
          return defer.promise;
        };

        scope.$apply('value = ""');

        expect(ctrl.$valid).toBeUndefined();
        expect(ctrl.$invalid).toBeUndefined();
        expect(ctrl.$pending.promiseValidator).toBe(true);

        defer.resolve();
        scope.$digest();

        expect(ctrl.$valid).toBe(true);
        expect(ctrl.$invalid).toBe(false);
        expect(ctrl.$pending).toBeUndefined();

        scope.$apply('value = "123"');

        defer.reject();
        scope.$digest();

        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);
        expect(ctrl.$pending).toBeUndefined();
      });

      it("should throw an error when a promise is not returned for an asynchronous validator", () => {
        ctrl.$asyncValidators.async = function (value) {
          return true;
        };

        expect(() => {
          scope.$apply('value = "123"');
        }).toThrowError(/nopromise/);
      });

      it("should only run the async validators once all the sync validators have passed", () => {
        const stages = {};

        stages.sync = { status1: false, status2: false, count: 0 };
        ctrl.$validators.syncValidator1 = function (modelValue, viewValue) {
          stages.sync.count++;
          return stages.sync.status1;
        };

        ctrl.$validators.syncValidator2 = function (modelValue, viewValue) {
          stages.sync.count++;
          return stages.sync.status2;
        };

        stages.async = { defer: null, count: 0 };
        ctrl.$asyncValidators.asyncValidator = function (
          modelValue,
          viewValue,
        ) {
          stages.async.defer = $q.defer();
          stages.async.count++;
          return stages.async.defer.promise;
        };

        scope.$apply('value = "123"');

        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);

        expect(stages.sync.count).toBe(2);
        expect(stages.async.count).toBe(0);

        stages.sync.status1 = true;

        scope.$apply('value = "456"');

        expect(stages.sync.count).toBe(4);
        expect(stages.async.count).toBe(0);

        stages.sync.status2 = true;

        scope.$apply('value = "789"');

        expect(stages.sync.count).toBe(6);
        expect(stages.async.count).toBe(1);

        stages.async.defer.resolve();
        scope.$apply();

        expect(ctrl.$valid).toBe(true);
        expect(ctrl.$invalid).toBe(false);
      });

      it("should ignore expired async validation promises once delivered", () => {
        let defer;
        let oldDefer;
        let newDefer;
        ctrl.$asyncValidators.async = function (value) {
          defer = $q.defer();
          return defer.promise;
        };

        scope.$apply('value = ""');
        oldDefer = defer;
        scope.$apply('value = "123"');
        newDefer = defer;

        newDefer.reject();
        scope.$digest();
        oldDefer.resolve();
        scope.$digest();

        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);
        expect(ctrl.$pending).toBeUndefined();
      });

      it("should clear and ignore all pending promises when the model value changes", () => {
        ctrl.$validators.sync = function (value) {
          return true;
        };

        const defers = [];
        ctrl.$asyncValidators.async = function (value) {
          const defer = $q.defer();
          defers.push(defer);
          return defer.promise;
        };

        scope.$apply('value = "123"');
        expect(ctrl.$pending).toEqual({ async: true });
        expect(ctrl.$valid).toBeUndefined();
        expect(ctrl.$invalid).toBeUndefined();
        expect(defers.length).toBe(1);
        expect(isObject(ctrl.$pending)).toBe(true);

        scope.$apply('value = "456"');
        expect(ctrl.$pending).toEqual({ async: true });
        expect(ctrl.$valid).toBeUndefined();
        expect(ctrl.$invalid).toBeUndefined();
        expect(defers.length).toBe(2);
        expect(isObject(ctrl.$pending)).toBe(true);

        defers[1].resolve();
        scope.$digest();
        expect(ctrl.$valid).toBe(true);
        expect(ctrl.$invalid).toBe(false);
        expect(isObject(ctrl.$pending)).toBe(false);
      });

      it("should clear and ignore all pending promises when a parser fails", () => {
        let failParser = false;
        ctrl.$parsers.push((value) => (failParser ? undefined : value));

        let defer;
        ctrl.$asyncValidators.async = function (value) {
          defer = $q.defer();
          return defer.promise;
        };

        ctrl.$setViewValue("x..y..z");
        expect(ctrl.$valid).toBeUndefined();
        expect(ctrl.$invalid).toBeUndefined();

        failParser = true;

        ctrl.$setViewValue("1..2..3");
        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);
        expect(isObject(ctrl.$pending)).toBe(false);

        defer.resolve();
        scope.$digest();

        expect(ctrl.$valid).toBe(false);
        expect(ctrl.$invalid).toBe(true);
        expect(isObject(ctrl.$pending)).toBe(false);
      });

      it("should clear all errors from async validators if a parser fails", () => {
        let failParser = false;
        ctrl.$parsers.push((value) => (failParser ? undefined : value));

        ctrl.$asyncValidators.async = function (value) {
          return $q.reject();
        };

        ctrl.$setViewValue("x..y..z");
        expect(ctrl.$error).toEqual({ async: true });

        failParser = true;

        ctrl.$setViewValue("1..2..3");
        expect(ctrl.$error).toEqual({ parse: true });
      });

      it("should clear all errors from async validators if a sync validator fails", () => {
        let failValidator = false;
        ctrl.$validators.sync = function (value) {
          return !failValidator;
        };

        ctrl.$asyncValidators.async = function (value) {
          return $q.reject();
        };

        ctrl.$setViewValue("x..y..z");
        expect(ctrl.$error).toEqual({ async: true });

        failValidator = true;

        ctrl.$setViewValue("1..2..3");
        expect(ctrl.$error).toEqual({ sync: true });
      });

      it("should be possible to extend Object prototype and still be able to do form validation", () => {
        // eslint-disable-next-line no-extend-native
        Object.prototype.someThing = function () {};
        const element = $compile(
          '<form name="myForm">' +
            '<input type="text" name="username" ng-model="username" minlength="10" required />' +
            "</form>",
        )($rootScope);
        const inputElm = element.find("input");

        const formCtrl = $rootScope.myForm;
        const usernameCtrl = formCtrl.username;

        $rootScope.$digest();
        expect(usernameCtrl.$invalid).toBe(true);
        expect(formCtrl.$invalid).toBe(true);

        usernameCtrl.$setViewValue("valid-username");
        $rootScope.$digest();

        expect(usernameCtrl.$invalid).toBe(false);
        expect(formCtrl.$invalid).toBe(false);
        delete Object.prototype.someThing;

        dealoc(element);
      });

      it("should re-evaluate the form validity state once the asynchronous promise has been delivered", () => {
        const element = $compile(
          '<form name="myForm">' +
            '<input type="text" name="username" ng-model="username" minlength="10" required />' +
            '<input type="number" name="age" ng-model="age" min="10" required />' +
            "</form>",
        )($rootScope);
        const inputElm = element.find("input");

        const formCtrl = $rootScope.myForm;
        const usernameCtrl = formCtrl.username;
        const ageCtrl = formCtrl.age;

        let usernameDefer;
        usernameCtrl.$asyncValidators.usernameAvailability = function () {
          usernameDefer = $q.defer();
          return usernameDefer.promise;
        };

        $rootScope.$digest();
        expect(usernameCtrl.$invalid).toBe(true);
        expect(formCtrl.$invalid).toBe(true);

        usernameCtrl.$setViewValue("valid-username");
        $rootScope.$digest();

        expect(formCtrl.$pending.usernameAvailability).toBeTruthy();
        expect(usernameCtrl.$invalid).toBeUndefined();
        expect(formCtrl.$invalid).toBeUndefined();

        usernameDefer.resolve();
        $rootScope.$digest();
        expect(usernameCtrl.$invalid).toBe(false);
        expect(formCtrl.$invalid).toBe(true);

        ageCtrl.$setViewValue(22);
        $rootScope.$digest();

        expect(usernameCtrl.$invalid).toBe(false);
        expect(ageCtrl.$invalid).toBe(false);
        expect(formCtrl.$invalid).toBe(false);

        usernameCtrl.$setViewValue("valid");
        $rootScope.$digest();

        expect(usernameCtrl.$invalid).toBe(true);
        expect(ageCtrl.$invalid).toBe(false);
        expect(formCtrl.$invalid).toBe(true);

        usernameCtrl.$setViewValue("another-valid-username");
        $rootScope.$digest();

        usernameDefer.resolve();
        $rootScope.$digest();

        expect(usernameCtrl.$invalid).toBe(false);
        expect(formCtrl.$invalid).toBe(false);
        expect(formCtrl.$pending).toBeFalsy();
        expect(ageCtrl.$invalid).toBe(false);

        dealoc(element);
      });

      it("should always use the most recent $viewValue for validation", () => {
        ctrl.$parsers.push((value) => {
          if (value && value.substr(-1) === "b") {
            value = "a";
            ctrl.$setViewValue(value);
            ctrl.$render();
          }

          return value;
        });

        ctrl.$validators.mock = function (modelValue) {
          return true;
        };

        spyOn(ctrl.$validators, "mock").and.callThrough();

        ctrl.$setViewValue("ab");

        expect(ctrl.$validators.mock).toHaveBeenCalledWith("a", "a");
        expect(ctrl.$validators.mock).toHaveBeenCalledTimes(2);
      });

      it("should validate even if the modelValue did not change", () => {
        ctrl.$parsers.push((value) => {
          if (value && value.substr(-1) === "b") {
            value = "a";
          }

          return value;
        });

        ctrl.$validators.mock = function (modelValue) {
          return true;
        };

        spyOn(ctrl.$validators, "mock").and.callThrough();

        ctrl.$setViewValue("a");

        expect(ctrl.$validators.mock).toHaveBeenCalledWith("a", "a");
        expect(ctrl.$validators.mock).toHaveBeenCalledTimes(1);

        ctrl.$setViewValue("ab");

        expect(ctrl.$validators.mock).toHaveBeenCalledWith("a", "ab");
        expect(ctrl.$validators.mock).toHaveBeenCalledTimes(2);
      });

      it("should validate correctly when $parser name equals $validator key", () => {
        ctrl.$validators.parserOrValidator = function (value) {
          switch (value) {
            case "allInvalid":
            case "parseValid-validatorsInvalid":
            case "stillParseValid-validatorsInvalid":
              return false;
            default:
              return true;
          }
        };

        ctrl.$validators.validator = function (value) {
          switch (value) {
            case "allInvalid":
            case "parseValid-validatorsInvalid":
            case "stillParseValid-validatorsInvalid":
              return false;
            default:
              return true;
          }
        };

        ctrl.$parsers.push((value) => {
          switch (value) {
            case "allInvalid":
            case "stillAllInvalid":
            case "parseInvalid-validatorsValid":
            case "stillParseInvalid-validatorsValid":
              ctrl.$$parserName = "parserOrValidator";
              return undefined;
            default:
              return value;
          }
        });

        // Parser and validators are invalid
        scope.$apply('value = "allInvalid"');
        expect(scope.value).toBe("allInvalid");
        expect(ctrl.$error).toEqual({
          parserOrValidator: true,
          validator: true,
        });

        ctrl.$validate();
        expect(scope.value).toEqual("allInvalid");
        expect(ctrl.$error).toEqual({
          parserOrValidator: true,
          validator: true,
        });

        ctrl.$setViewValue("stillAllInvalid");
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({ parserOrValidator: true });

        ctrl.$validate();
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({ parserOrValidator: true });

        // Parser is valid, validators are invalid
        scope.$apply('value = "parseValid-validatorsInvalid"');
        expect(scope.value).toBe("parseValid-validatorsInvalid");
        expect(ctrl.$error).toEqual({
          parserOrValidator: true,
          validator: true,
        });

        ctrl.$validate();
        expect(scope.value).toBe("parseValid-validatorsInvalid");
        expect(ctrl.$error).toEqual({
          parserOrValidator: true,
          validator: true,
        });

        ctrl.$setViewValue("stillParseValid-validatorsInvalid");
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({
          parserOrValidator: true,
          validator: true,
        });

        ctrl.$validate();
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({
          parserOrValidator: true,
          validator: true,
        });

        // Parser is invalid, validators are valid
        scope.$apply('value = "parseInvalid-validatorsValid"');
        expect(scope.value).toBe("parseInvalid-validatorsValid");
        expect(ctrl.$error).toEqual({});

        ctrl.$validate();
        expect(scope.value).toBe("parseInvalid-validatorsValid");
        expect(ctrl.$error).toEqual({});

        ctrl.$setViewValue("stillParseInvalid-validatorsValid");
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({ parserOrValidator: true });

        ctrl.$validate();
        expect(scope.value).toBeUndefined();
        expect(ctrl.$error).toEqual({ parserOrValidator: true });
      });
    });

    describe("override ModelOptions", () => {
      it("should replace the previous model options", () => {
        const { $options } = ctrl;
        ctrl.$overrideModelOptions({});
        expect(ctrl.$options).not.toBe($options);
      });

      it("should set the given options", () => {
        const { $options } = ctrl;
        ctrl.$overrideModelOptions({ debounce: 1000, updateOn: "blur" });
        expect(ctrl.$options.getOption("debounce")).toEqual(1000);
        expect(ctrl.$options.getOption("updateOn")).toEqual("blur");
        expect(ctrl.$options.getOption("updateOnDefault")).toBe(false);
      });

      it("should inherit from a parent model options if specified", () => {
        const element = $compile(
          '<form name="form" ng-model-options="{debounce: 1000, updateOn: \'blur\'}">' +
            '  <input ng-model="value" name="input">' +
            "</form>",
        )($rootScope);
        const ctrl = $rootScope.form.input;
        ctrl.$overrideModelOptions({ debounce: 2000, "*": "$inherit" });
        expect(ctrl.$options.getOption("debounce")).toEqual(2000);
        expect(ctrl.$options.getOption("updateOn")).toEqual("blur");
        expect(ctrl.$options.getOption("updateOnDefault")).toBe(false);
        dealoc(element);
      });

      it("should not inherit from a parent model options if not specified", () => {
        const element = $compile(
          '<form name="form" ng-model-options="{debounce: 1000, updateOn: \'blur\'}">' +
            '  <input ng-model="value" name="input">' +
            "</form>",
        )($rootScope);
        const ctrl = $rootScope.form.input;
        ctrl.$overrideModelOptions({ debounce: 2000 });
        expect(ctrl.$options.getOption("debounce")).toEqual(2000);
        expect(ctrl.$options.getOption("updateOn")).toEqual("");
        expect(ctrl.$options.getOption("updateOnDefault")).toBe(true);
        dealoc(element);
      });
    });
  });

  describe("CSS classes", () => {
    const EMAIL_REGEXP =
      /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

    it("should set ng-empty or ng-not-empty when the view value changes", () => {
      const element = $compile('<input ng-model="value" />')($rootScope);

      $rootScope.$digest();
      expect(element.val()).toBe("");

      $rootScope.value = "XXX";
      $rootScope.$digest();
      expect(element.val()).toBe("XXX");

      element.val("");
      browserTrigger(element, "change");
      expect(element.val()).toBe("");

      element.val("YYY");
      browserTrigger(element, "change");
      expect(element.val()).toBe("YYY");
    });

    it("should set css classes (ng-valid, ng-invalid, ng-pristine, ng-dirty, ng-untouched, ng-touched)", () => {
      const element = $compile('<input type="email" ng-model="value" />')(
        $rootScope,
      );

      $rootScope.$digest();
      expect(element[0].classList.contains("ng-valid")).toBeTrue();
      expect(element[0].classList.contains("ng-pristine")).toBeTrue();
      expect(element[0].classList.contains("ng-touched")).toBeFalse();
      expect(element[0].classList.contains("ng-valid-email")).toBe(true);
      expect(element[0].classList.contains("ng-invalid-email")).toBe(false);

      $rootScope.$apply("value = 'invalid-email'");
      expect(element[0].classList.contains("ng-invalid")).toBeTrue();
      expect(element[0].classList.contains("ng-pristine")).toBeTrue();
      expect(element[0].classList.contains("ng-valid-email")).toBe(false);
      expect(element[0].classList.contains("ng-invalid-email")).toBe(true);

      element.val("invalid-again");
      browserTrigger(element, "change");
      expect(element[0].classList.contains("ng-invalid")).toBeTrue();
      expect(element[0].classList.contains("ng-dirty")).toBeTrue();
      expect(element[0].classList.contains("ng-valid-email")).toBe(false);
      expect(element[0].classList.contains("ng-invalid-email")).toBe(true);

      element.val("vojta@google.com");
      browserTrigger(element, "change");
      expect(element[0].classList.contains("ng-valid")).toBeTrue();
      expect(element[0].classList.contains("ng-dirty")).toBeTrue();
      expect(element[0].classList.contains("ng-valid-email")).toBe(true);
      expect(element[0].classList.contains("ng-invalid-email")).toBe(false);

      browserTrigger(element, "blur");

      expect(element[0].classList.contains("ng-touched")).toBeTrue();

      dealoc(element);
    });

    it("should set invalid classes on init", () => {
      const element = $compile(
        '<input type="email" ng-model="value" required />',
      )($rootScope);
      $rootScope.$digest();

      expect(element[0].classList.contains("ng-invalid")).toBeTrue();
      expect(element[0].classList.contains("ng-invalid-required")).toBeTrue();

      dealoc(element);
    });
  });

  describe("custom formatter and parser that are added by a directive in post linking", () => {
    let inputElm;
    let scope;
    let module;

    beforeEach(() => {
      angular = new Angular();
      publishExternalAPI();
      module = window.angular
        .module("myModule", [])
        .directive("customFormat", () => ({
          require: "ngModel",
          link(scope, element, attrs, ngModelCtrl) {
            ngModelCtrl.$formatters.push((value) => value.part);
            ngModelCtrl.$parsers.push((value) => ({ part: value }));
          },
        }));
    });

    afterEach(() => {
      dealoc(inputElm);
    });

    function createInput(type) {
      inputElm = jqLite(`<input type="${type}" ng-model="val" custom-format/>`);
      const injector = angular.bootstrap(inputElm, ["myModule"]);
      scope = injector.get("$rootScope");
    }

    it("should use them after the builtin ones for text inputs", () => {
      createInput("text");
      scope.$apply('val = {part: "a"}');
      expect(inputElm.val()).toBe("a");

      inputElm.val("b");
      browserTrigger(inputElm, "change");
      expect(scope.val).toEqual({ part: "b" });
    });

    it("should use them after the builtin ones for number inputs", () => {
      createInput("number");
      scope.$apply("val = {part: 1}");
      expect(inputElm.val()).toBe("1");

      inputElm.val("2");
      browserTrigger(inputElm, "change");
      expect(scope.val).toEqual({ part: 2 });
    });

    it("should use them after the builtin ones for date inputs", () => {
      createInput("date");
      scope.$apply(() => {
        scope.val = { part: "2000-11-08" };
      });
      expect(inputElm.val()).toBe("2000-11-08");

      inputElm.val("2001-12-09");
      browserTrigger(inputElm, "change");
      expect(scope.val).toEqual({ part: "2001-12-09" });
    });
  });

  describe("$touched", () => {
    it('should set the control touched state on "blur" event', () => {
      const element = $compile(
        '<form name="myForm">' +
          '<input name="myControl" ng-model="value" >' +
          "</form>",
      )($rootScope);
      const inputElm = element.find("input");
      const control = $rootScope.myForm.myControl;

      expect(control.$touched).toBe(false);
      expect(control.$untouched).toBe(true);

      browserTrigger(inputElm, "blur");
      expect(control.$touched).toBe(true);
      expect(control.$untouched).toBe(false);

      dealoc(element);
    });

    it('should not cause a digest on "blur" event if control is already touched', () => {
      const element = $compile(
        '<form name="myForm">' +
          '<input name="myControl" ng-model="value" >' +
          "</form>",
      )($rootScope);
      const inputElm = element.find("input");
      const control = $rootScope.myForm.myControl;

      control.$setTouched();
      spyOn($rootScope, "$apply");
      browserTrigger(inputElm, "blur");

      expect($rootScope.$apply).not.toHaveBeenCalled();

      dealoc(element);
    });

    it('should digest asynchronously on "blur" event if a apply is already in progress', () => {
      const element = $compile(
        '<form name="myForm">' +
          '<input name="myControl" ng-model="value" >' +
          "</form>",
      )($rootScope);
      const inputElm = element.find("input");
      const control = $rootScope.myForm.myControl;

      $rootScope.$apply(() => {
        expect(control.$touched).toBe(false);
        expect(control.$untouched).toBe(true);

        browserTrigger(inputElm, "blur");

        expect(control.$touched).toBe(false);
        expect(control.$untouched).toBe(true);
      });

      expect(control.$touched).toBe(true);
      expect(control.$untouched).toBe(false);

      dealoc(element);
    });
  });

  describe("nested in a form", () => {
    it("should register/deregister a nested ngModel with parent form when entering or leaving DOM", () => {
      const element = $compile(
        '<form name="myForm">' +
          '<input ng-if="inputPresent" name="myControl" ng-model="value" required >' +
          "</form>",
      )($rootScope);
      let isFormValid;

      $rootScope.inputPresent = false;
      $rootScope.$watch("myForm.$valid", (value) => {
        isFormValid = value;
      });

      $rootScope.$apply();

      expect($rootScope.myForm.$valid).toBe(true);
      expect(isFormValid).toBe(true);
      expect($rootScope.myForm.myControl).toBeUndefined();

      $rootScope.inputPresent = true;
      $rootScope.$apply();

      expect($rootScope.myForm.$valid).toBe(false);
      expect(isFormValid).toBe(false);
      expect($rootScope.myForm.myControl).toBeDefined();

      $rootScope.inputPresent = false;
      $rootScope.$apply();

      expect($rootScope.myForm.$valid).toBe(true);
      expect(isFormValid).toBe(true);
      expect($rootScope.myForm.myControl).toBeUndefined();

      dealoc(element);
    });

    it("should register/deregister a nested ngModel with parent form when entering or leaving DOM with animations", () => {
      // ngAnimate performs the dom manipulation after digest, and since the form validity can be affected by a form
      // control going away we must ensure that the deregistration happens during the digest while we are still doing
      // dirty checking.
      // module("ngAnimate");

      const element = $compile(
        '<form name="myForm">' +
          '<input ng-if="inputPresent" name="myControl" ng-model="value" required >' +
          "</form>",
      )($rootScope);
      let isFormValid;

      $rootScope.inputPresent = false;
      // this watch ensure that the form validity gets updated during digest (so that we can observe it)
      $rootScope.$watch("myForm.$valid", (value) => {
        isFormValid = value;
      });

      $rootScope.$apply();

      expect($rootScope.myForm.$valid).toBe(true);
      expect(isFormValid).toBe(true);
      expect($rootScope.myForm.myControl).toBeUndefined();

      $rootScope.inputPresent = true;
      $rootScope.$apply();

      expect($rootScope.myForm.$valid).toBe(false);
      expect(isFormValid).toBe(false);
      expect($rootScope.myForm.myControl).toBeDefined();

      $rootScope.inputPresent = false;
      $rootScope.$apply();

      expect($rootScope.myForm.$valid).toBe(true);
      expect(isFormValid).toBe(true);
      expect($rootScope.myForm.myControl).toBeUndefined();

      dealoc(element);
    });

    it("should keep previously defined watches consistent when changes in validity are made", () => {
      let isFormValid;
      $rootScope.$watch("myForm.$valid", (value) => {
        isFormValid = value;
      });

      const element = $compile(
        '<form name="myForm">' +
          '<input  name="myControl" ng-model="value" required >' +
          "</form>",
      )($rootScope);

      $rootScope.$apply();
      expect(isFormValid).toBe(false);
      expect($rootScope.myForm.$valid).toBe(false);

      $rootScope.value = "value";
      $rootScope.$apply();
      expect(isFormValid).toBe(true);
      expect($rootScope.myForm.$valid).toBe(true);

      dealoc(element);
    });
  });

  // TODO:
  // describe("animations", () => {
  //   function findElementAnimations(element, queue) {
  //     const node = element[0];
  //     const animations = [];
  //     for (let i = 0; i < queue.length; i++) {
  //       const animation = queue[i];
  //       if (animation.element[0] === node) {
  //         animations.push(animation);
  //       }
  //     }
  //     return animations;
  //   }

  //   function assertValidAnimation(animation, event, classNameA, classNameB) {
  //     expect(animation.event).toBe(event);
  //     expect(animation.args[1]).toBe(classNameA);
  //     if (classNameB) expect(animation.args[2]).toBe(classNameB);
  //   }

  //   let doc;
  //   let input;
  //   let scope;
  //   let model;

  //   //beforeEach(module("ngAnimateMock"));

  //   beforeEach(() => {
  //     scope = $rootScope.$new();
  //     doc = jqLite(
  //       '<form name="myForm">' +
  //         '  <input type="text" ng-model="input" name="myInput" />' +
  //         "</form>",
  //     );
  //     $rootElement.append(doc);
  //     $compile(doc)(scope);
  //     $animate.queue = [];

  //     input = doc.find("input");
  //     model = scope.myForm.myInput;
  //   });

  //   afterEach(() => {
  //     dealoc(input);
  //   });

  //   it("should trigger an animation when invalid", () => {
  //     model.$setValidity("required", false);

  //     const animations = findElementAnimations(input, $animate.queue);
  //     assertValidAnimation(animations[0], "removeClass", "ng-valid");
  //     assertValidAnimation(animations[1], "addClass", "ng-invalid");
  //     assertValidAnimation(animations[2], "addClass", "ng-invalid-required");
  //   });

  //   it("should trigger an animation when valid", () => {
  //     model.$setValidity("required", false);

  //     $animate.queue = [];

  //     model.$setValidity("required", true);

  //     const animations = findElementAnimations(input, $animate.queue);
  //     assertValidAnimation(animations[0], "addClass", "ng-valid");
  //     assertValidAnimation(animations[1], "removeClass", "ng-invalid");
  //     assertValidAnimation(animations[2], "addClass", "ng-valid-required");
  //     assertValidAnimation(animations[3], "removeClass", "ng-invalid-required");
  //   });

  //   it("should trigger an animation when dirty", () => {
  //     model.$setViewValue("some dirty value");

  //     const animations = findElementAnimations(input, $animate.queue);
  //     assertValidAnimation(animations[0], "removeClass", "ng-empty");
  //     assertValidAnimation(animations[1], "addClass", "ng-not-empty");
  //     assertValidAnimation(animations[2], "removeClass", "ng-pristine");
  //     assertValidAnimation(animations[3], "addClass", "ng-dirty");
  //   });

  //   it("should trigger an animation when pristine", () => {
  //     model.$setPristine();

  //     const animations = findElementAnimations(input, $animate.queue);
  //     assertValidAnimation(animations[0], "removeClass", "ng-dirty");
  //     assertValidAnimation(animations[1], "addClass", "ng-pristine");
  //   });

  //   it("should trigger an animation when untouched", () => {
  //     model.$setUntouched();

  //     const animations = findElementAnimations(input, $animate.queue);
  //     assertValidAnimation(animations[0], "setClass", "ng-untouched");
  //     expect(animations[0].args[2]).toBe("ng-touched");
  //   });

  //   it("should trigger an animation when touched", () => {
  //     model.$setTouched();

  //     const animations = findElementAnimations(input, $animate.queue);
  //     assertValidAnimation(
  //       animations[0],
  //       "setClass",
  //       "ng-touched",
  //       "ng-untouched",
  //     );
  //     expect(animations[0].args[2]).toBe("ng-untouched");
  //   });

  //   it("should trigger custom errors as addClass/removeClass when invalid/valid", () => {
  //     model.$setValidity("custom-error", false);

  //     let animations = findElementAnimations(input, $animate.queue);
  //     assertValidAnimation(animations[0], "removeClass", "ng-valid");
  //     assertValidAnimation(animations[1], "addClass", "ng-invalid");
  //     assertValidAnimation(
  //       animations[2],
  //       "addClass",
  //       "ng-invalid-custom-error",
  //     );

  //     $animate.queue = [];
  //     model.$setValidity("custom-error", true);

  //     animations = findElementAnimations(input, $animate.queue);
  //     assertValidAnimation(animations[0], "addClass", "ng-valid");
  //     assertValidAnimation(animations[1], "removeClass", "ng-invalid");
  //     assertValidAnimation(animations[2], "addClass", "ng-valid-custom-error");
  //     assertValidAnimation(
  //       animations[3],
  //       "removeClass",
  //       "ng-invalid-custom-error",
  //     );
  //   });
  // });
});
