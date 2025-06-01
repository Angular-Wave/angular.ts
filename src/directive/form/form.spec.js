import { Angular } from "../../loader.js";
import {
  createElementFromHTML,
  dealoc,
  getCacheData,
  getController,
} from "../../shared/dom.js";
import { browserTrigger, wait } from "../../shared/test-utils.js";
import { assert } from "../../shared/utils.js";
import { FormController } from "./form.js";

describe("form", () => {
  let doc;
  let control;
  let scope;
  let $compile;
  let injector;

  beforeEach(() => {
    window.angular = new Angular();
    window.angular
      .module("myModule", ["ng"])
      .decorator("$exceptionHandler", function () {
        return (exception) => {
          throw new Error(exception);
        };
      });
    injector = window.angular.bootstrap(document.getElementById("app"), [
      "myModule",
      ($compileProvider) => {
        $compileProvider.directive("storeModelCtrl", () => ({
          require: "ngModel",
          link(scope, elm, attr, ctrl) {
            control = ctrl;
          },
        }));
      },
    ]);

    injector.invoke((_$compile_, $rootScope) => {
      $compile = _$compile_;
      scope = $rootScope.$new();
    });
  });

  afterEach(() => {
    dealoc(doc);
  });

  it("should instantiate form and attach it to DOM", async () => {
    doc = $compile("<form>")(scope);
    await wait();
    expect(getCacheData(doc, "$formController")).toBeTruthy();
    expect(getCacheData(doc, "$formController") instanceof FormController).toBe(
      true,
    );
  });

  it("should remove form control references from the form when nested control is removed from the DOM", async () => {
    doc = $compile(
      '<form name="myForm">' +
        '<input ng-if="inputPresent" name="alias" ng-model="value" store-model-ctrl/>' +
        "</form>",
    )(scope);
    await wait();
    scope.inputPresent = true;
    const form = scope.myForm;
    await wait();
    control.$setValidity("required", false);
    await wait();

    expect(form.alias).toBe(control);
    expect(form.$error.required).toEqual([control]);

    // remove nested control
    scope.inputPresent = false;
    await wait();
    expect(form.$error.required).toBeFalsy();
    expect(form.alias).toBeUndefined();
  });

  it("should ignore changes in manually removed controls", async () => {
    doc = $compile(
      '<form name="myForm">' +
        '<input name="control" ng-maxlength="1" ng-model="value" store-model-ctrl/>' +
        "</form>",
    )(scope);
    await wait();
    const form = scope.myForm;

    const input = doc.children[0];
    const inputController = getController(input, "ngModel");

    input.setAttribute("value", "ab");
    input.dispatchEvent(new Event("change"));

    // await wait();
    await wait(10);
    expect(form.$error.maxlength).toBeTruthy();
    expect(form.$dirty).toBe(true);
    expect(form.$error.maxlength[0].$name).toBe("control");

    // remove control
    form.$removeControl(form.control);
    expect(form.control).toBeUndefined();
    expect(form.$error.maxlength).toBeFalsy();

    inputController.$setPristine();
    expect(form.$dirty).toBe(true);

    form.$setPristine();

    input.setAttribute("value", "ab");
    input.dispatchEvent(new Event("change"));

    await wait();
    expect(form.$error.maxlength).toBeFalsy();
    expect(form.$dirty).toBe(false);
  });

  it("should react to validation changes in manually added controls", async () => {
    doc = $compile(
      '<form name="myForm">' +
        '<input name="control" ng-maxlength="1" ng-model="value" store-model-ctrl/>' +
        "</form>",
    )(scope);
    await wait();
    const form = scope.myForm;
    const input = doc.children[0];
    // remove control and invalidate it
    form.$removeControl(control);
    expect(form.control).toBeUndefined();
    await wait();
    input.setAttribute("value", "abc");
    input.dispatchEvent(new Event("change"));
    await wait();
    expect(control.$error.maxlength).toBe(true);
    expect(control.$dirty).toBe(true);
    expect(form.$error.maxlength).toBeFalsy();
    expect(form.$dirty).toBe(false);
    // re-add the control; its current validation state is not propagated
    form.$addControl(control);
    await wait();
    expect(form.control).toBe(control);
    expect(form.$error.maxlength).toBeFalsy();
    expect(form.$dirty).toBe(false);

    // Only when the input changes again its validation state is propagated
    input.setAttribute("value", "abcd");
    input.dispatchEvent(new Event("change"));

    expect(form.$error.maxlength[0]).toEqual(control);
    expect(form.$dirty).toBe(false);
  });

  it("should use the correct parent when renaming and removing dynamically added controls", async () => {
    scope.controlName = "childControl";
    scope.hasChildControl = true;

    doc = $compile(
      '<div><form name="myForm">' +
        '<div ng-if="hasChildControl">' +
        '<input name="{{controlName}}" ng-maxlength="1" ng-model="value"/>' +
        "</div>" +
        "</form>" +
        '<form name="otherForm"></form>' +
        "</div>",
    )(scope);
    await wait();
    const form = scope.myForm;
    const { otherForm } = scope;
    const { childControl } = form;

    // remove child form and add it to another form
    form.$removeControl(childControl);
    otherForm.$addControl(childControl);

    expect(form.childControl).toBeUndefined();
    expect(otherForm.childControl).toBe(childControl);

    // rename the childControl
    scope.controlName = "childControlMoved";
    await wait();
    expect(form.childControlMoved).toBeUndefined();
    expect(otherForm.childControl).toBeUndefined();
    expect(otherForm.childControlMoved).toBe(childControl);

    scope.hasChildControl = false;
    await wait();
    expect(form.childControlMoved).toBeUndefined();
    expect(otherForm.childControlMoved).toBeUndefined();
  });

  it("should remove scope reference when form with no parent form is removed from the DOM", async () => {
    let formController;
    scope.ctrl = {};
    doc = $compile(
      '<div><form name="ctrl.myForm" ng-if="formPresent">' +
        '<input name="alias" ng-model="value" />' +
        "</form></div>",
    )(scope);
    await wait();
    expect(scope.ctrl.myForm).toBeUndefined();

    scope.$apply("formPresent = true");
    await wait();

    expect(scope.ctrl.myForm).toBeDefined();

    formController = getController(doc.querySelector("form"), "form");
    expect(scope.ctrl.myForm == formController).toBeTrue();

    scope.$apply("formPresent = false");
    await wait();

    expect(doc.innerText).toBe("");
  });

  it("should use ngForm value as form name", async () => {
    doc = $compile(
      '<div ng-form="myForm">' +
        '<input type="text" name="alias" ng-model="value"/>' +
        "</div>",
    )(scope);
    await wait();

    expect(scope.myForm).toBeDefined();
    expect(scope.myForm.alias).toBeDefined();
  });

  it("should use ngForm value as form name when nested inside form", async () => {
    doc = $compile(
      '<form name="myForm">' +
        '<div ng-form="nestedForm"><input type="text" name="alias" ng-model="value"/></div>' +
        "</form>",
    )(scope);
    await wait();

    expect(scope.myForm).toBeDefined();
    expect(scope.myForm.nestedForm).toBeDefined();
    expect(scope.myForm.nestedForm.alias).toBeDefined();
  });

  it("should publish form to scope when name attr is defined", async () => {
    doc = $compile('<form name="myForm"></form>')(scope);
    await wait();

    expect(scope.myForm).toBeTruthy();
    expect(getCacheData(doc, "$formController")).toBeTruthy();
    expect(getCacheData(doc, "$formController")).toEqual(scope.myForm);
  });

  it("should support expression in form name", async () => {
    doc = $compile('<form name="obj.myForm"></form>')(scope);
    await wait();
    expect(scope.obj).toBeDefined();
    expect(scope.obj.myForm).toBeTruthy();
  });

  it("should support two forms on a single scope", async () => {
    doc = $compile(`
      <div>
        <form name="formA">
          <input name="firstName" ng-model="firstName" required>
        </form>
        <form name="formB">
          <input name="lastName" ng-model="lastName" required>
        </form>
      </div>
    `)(scope);
    await wait();

    expect(scope.formA.$error.required.length).toBe(1);
    expect(scope.formA.$error.required).toEqual([scope.formA.firstName]);
    expect(scope.formB.$error.required.length).toBe(1);
    expect(scope.formB.$error.required).toEqual([scope.formB.lastName]);

    const inputA = doc.querySelectorAll("input")[0];
    const inputB = doc.querySelectorAll("input")[1];

    inputA.setAttribute("value", "val1");
    inputA.dispatchEvent(new Event("change"));
    await wait();
    inputB.setAttribute("value", "val2");
    inputB.dispatchEvent(new Event("change"));
    await wait();
    expect(scope.firstName).toBe("val1");
    expect(scope.lastName).toBe("val2");
    await wait();
    expect(scope.formA.$error.required).toBeFalsy();
    expect(scope.formB.$error.required).toBeFalsy();
  });

  it("should publish widgets", async () => {
    doc = createElementFromHTML(
      '<form name="form"><input type="text" name="w1" ng-model="some" /></form>',
    );
    $compile(doc)(scope);
    await wait();
    const widget = scope.form.w1;
    expect(widget).toBeDefined();
    expect(widget.$pristine).toBe(true);
    expect(widget.$dirty).toBe(false);
    expect(widget.$valid).toBe(true);
    expect(widget.$invalid).toBe(false);
  });

  it('should throw an exception if an input has name="hasOwnProperty"', async () => {
    doc = createElementFromHTML(
      '<form name="form">' +
        '<input name="hasOwnProperty" ng-model="some" />' +
        '<input name="other" ng-model="someOther" />' +
        "</form>",
    );
    expect(() => {
      $compile(doc)(scope);
    }).toThrowError();
  });

  describe("triggering commit value on submit", () => {
    it("should trigger update on form submit", async () => {
      const form = $compile(
        '<form name="test" ng-model-options="{ updateOn: \'submit\' }" >' +
          '<input type="text" ng-model="name" />' +
          "</form>",
      )(scope);
      await wait();
      const inputElm = form.children[0];

      inputElm.setAttribute("value", "a");
      inputElm.dispatchEvent(new Event("change"));
      expect(scope.name).toEqual(undefined);

      form.dispatchEvent(new Event("submit"));
      expect(scope.name).toEqual("a");
    });

    it("should trigger update on form submit with nested forms", async () => {
      const form = $compile(
        '<div><form name="test" ng-model-options="{ updateOn: \'submit\' }" >' +
          '<div ng-form name="child">' +
          '<input type="text" ng-model="name" />' +
          "</div>" +
          "</form></div>",
      )(scope);
      await wait();
      const inputElm = form.querySelector("input");

      inputElm.setAttribute("value", "a");
      inputElm.dispatchEvent(new Event("change"));
      await wait();
      expect(scope.name).toEqual(undefined);
      browserTrigger(form.firstChild, "submit");
      await wait();
      expect(scope.name).toEqual("a");
    });

    it("should trigger update before ng-submit is invoked", async () => {
      const form = $compile(
        '<form name="test" ng-submit="submit()" ' +
          "ng-model-options=\"{ updateOn: 'submit' }\" >" +
          '<input type="text" ng-model="name" />' +
          "</form>",
      )(scope);
      await wait();
      const inputElm = form.children[0];
      inputElm.setAttribute("value", "a");
      inputElm.dispatchEvent(new Event("change"));
      scope.submit = jasmine.createSpy("submit").and.callFake(() => {
        expect(scope.name).toEqual("a");
      });
      // browserTrigger(form, "submit");
      form.dispatchEvent(new Event("submit"));
      expect(scope.submit).toHaveBeenCalled();
    });
  });

  describe("rollback view value", () => {
    it("should trigger rollback on form controls", async () => {
      const form = $compile(
        '<form name="test" ng-model-options="{ updateOn: \'submit\' }" >' +
          '<input type="text" ng-model="name" />' +
          '<button ng-click="test.$rollbackViewValue()" />' +
          "</form>",
      )(scope);
      const inputElm = form.children[0];
      inputElm.setAttribute("value", "a");
      inputElm.dispatchEvent(new Event("click"));
      expect(inputElm.value).toBe("a");
      form.querySelector("button").click();
      expect(inputElm.value).toBe("");
    });

    it("should trigger rollback on form controls with nested forms", async () => {
      const form = $compile(
        '<form name="test" ng-model-options="{ updateOn: \'submit\' }" >' +
          '<div ng-form name="child">' +
          '<input type="text" ng-model="name" />' +
          "</div>" +
          '<button ng-click="test.$rollbackViewValue()" />' +
          "</form>",
      )(scope);
      const inputElm = form.querySelector("input");
      inputElm.setAttribute("value", "a");
      inputElm.dispatchEvent(new Event("click"));
      expect(inputElm.value).toBe("a");
      form.querySelector("button").click();
      await wait();
      expect(inputElm.value).toBe("");
    });
  });

  describe("preventing default submission", () => {
    it("should prevent form submission", (done) => {
      let nextTurn = false;
      let submitted = false;
      let reloadPrevented;

      doc = createElementFromHTML(
        '<form ng-submit="submitMe()">' +
          '<input type="submit" value="submit">' +
          "</form>",
      );
      // Support: Chrome 60+ (on Windows)
      // We need to add the form to the DOM in order for `submit` events to be properly fired.
      document.body.appendChild(doc);

      const assertPreventDefaultListener = function (e) {
        reloadPrevented = e.defaultPrevented || e.returnValue === false;
      };

      $compile(doc)(scope);

      scope.submitMe = function () {
        submitted = true;
      };

      doc.addEventListener("submit", assertPreventDefaultListener);
      doc.querySelector("input").click();

      // let the browser process all events (and potentially reload the page)
      window.setTimeout(() => {
        expect(reloadPrevented).toBe(true);
        expect(submitted).toBe(true);

        // prevent mem leak in test
        doc.removeEventListener("submit", assertPreventDefaultListener);
        done();
      }, 100);
    });

    it("should prevent the default when the form is destroyed by a submission via a click event", (done) => {
      doc = createElementFromHTML(
        "<div>" +
          '<form ng-submit="submitMe()">' +
          '<button type="submit" ng-click="destroy()"></button>' +
          "</form>" +
          "</div>",
      );

      const form = doc.querySelector("form");
      let destroyed = false;
      let nextTurn = false;
      let submitted = false;
      let reloadPrevented = "never called";

      scope.destroy = function () {
        // yes, I know, scope methods should not do direct DOM manipulation, but I wanted to keep
        // this test small. Imagine that the destroy action will cause a model change (e.g.
        // $location change) that will cause some directive to destroy the dom (e.g. ngView+$route)
        doc.innerHTML = "";
        destroyed = true;
      };

      scope.submitMe = function () {
        submitted = true;
      };

      const assertPreventDefaultListener = function (e) {
        reloadPrevented = e.defaultPrevented || e.returnValue === false;
      };

      $compile(doc)(scope);

      form.addEventListener("submit", assertPreventDefaultListener);

      form.querySelector("button").click();

      // let the browser process all events (and potentially reload the page)
      window.setTimeout(() => {
        nextTurn = true;
        expect(doc.innerHTML).toBe("");
        expect(destroyed).toBe(true);
        expect(submitted).toBe(false);
        // this is known corner-case that is not currently handled
        // the issue is that the submit listener is destroyed before
        // the event propagates there. we can fix this if we see
        // the issue in the wild, I'm not going to bother to do it
        // now. (i)

        // Support: Chrome 60+ (on Windows)
        // Chrome 60+ on Windows does not fire `submit` events when the form is not attached to
        // the DOM. Verify that the `submit` listener was either never fired or (if fired) the
        // reload was prevented.
        expect(reloadPrevented).not.toBe(false);

        // prevent mem leak in test
        form.removeEventListener("submit", assertPreventDefaultListener);
        done();
      }, 100);
    });

    it("should NOT prevent form submission if action attribute present", () => {
      const callback = jasmine.createSpy("submit").and.callFake((event) => {
        expect(event.defaultPrevented).toBe(false);
        event.preventDefault();
      });

      doc = $compile('<form action="some.py"></form>')(scope);
      doc.addEventListener("submit", callback);

      //browserTrigger(doc, "submit");
      doc.dispatchEvent(new Event("submit"));
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("nested forms", () => {
    it("should chain nested forms", () => {
      doc = createElementFromHTML(
        '<ng-form name="parent">' +
          '<ng-form name="child">' +
          '<input ng-model="modelA" name="inputA">' +
          '<input ng-model="modelB" name="inputB">' +
          "</ng-form>" +
          "</ng-form>",
      );
      $compile(doc)(scope);

      const { parent } = scope;
      const { child } = scope;
      const { inputA } = child;
      const { inputB } = child;

      inputA.$setValidity("MyError", false);
      inputB.$setValidity("MyError", false);
      expect(parent.$error.MyError).toEqual([child]);
      expect(child.$error.MyError).toEqual([inputA, inputB]);

      inputA.$setValidity("MyError", true);
      expect(parent.$error.MyError).toEqual([child]);
      expect(child.$error.MyError).toEqual([inputB]);

      inputB.$setValidity("MyError", true);
      expect(parent.$error.MyError).toBeFalsy();
      expect(child.$error.MyError).toBeFalsy();

      child.$setDirty();
      expect(parent.$dirty).toBeTruthy();

      child.$setSubmitted();
      expect(parent.$submitted).toBeTruthy();
    });

    it("should set $submitted to true on child forms when parent is submitted", () => {
      doc = createElementFromHTML(
        '<ng-form name="parent">' +
          '<ng-form name="child">' +
          '<input ng-model="modelA" name="inputA">' +
          '<input ng-model="modelB" name="inputB">' +
          "</ng-form>" +
          "</ng-form>",
      );
      $compile(doc)(scope);

      const { parent } = scope;
      const { child } = scope;

      parent.$setSubmitted();
      expect(parent.$submitted).toBeTruthy();
      expect(child.$submitted).toBeTruthy();
    });

    it("should not propagate $submitted state on removed child forms when parent is submitted", async () => {
      doc = createElementFromHTML(
        '<ng-form name="parent">' +
          '<ng-form name="child">' +
          '<ng-form name="grandchild">' +
          '<input ng-model="modelA" name="inputA">' +
          "</ng-form>" +
          "</ng-form>" +
          "</ng-form>",
      );
      $compile(doc)(scope);
      await wait();
      const { parent } = scope;
      const { child } = scope;
      const { grandchild } = scope;
      const ggchild = scope.greatgrandchild;

      parent.$removeControl(child);

      parent.$setSubmitted();
      expect(parent.$submitted).toBeTruthy();
      expect(child.$submitted).not.toBeTruthy();
      expect(grandchild.$submitted).not.toBeTruthy();

      parent.$addControl(child);
      expect(parent.$submitted).toBeTruthy();
      expect(child.$submitted).not.toBeTruthy();
      expect(grandchild.$submitted).not.toBeTruthy();

      parent.$setSubmitted();
      expect(parent.$submitted).toBeTruthy();
      expect(child.$submitted).toBeTruthy();
      expect(grandchild.$submitted).toBeTruthy();

      parent.$removeControl(child);

      expect(parent.$submitted).toBeTruthy();
      expect(child.$submitted).toBeTruthy();
      expect(grandchild.$submitted).toBeTruthy();

      parent.$setPristine(); // sets $submitted to false
      expect(parent.$submitted).not.toBeTruthy();
      expect(child.$submitted).toBeTruthy();
      expect(grandchild.$submitted).toBeTruthy();

      grandchild.$setPristine();
      expect(grandchild.$submitted).not.toBeTruthy();

      child.$setSubmitted();
      expect(parent.$submitted).not.toBeTruthy();
      expect(child.$submitted).toBeTruthy();
      expect(grandchild.$submitted).toBeTruthy();

      child.$setPristine();
      expect(parent.$submitted).not.toBeTruthy();
      expect(child.$submitted).not.toBeTruthy();
      expect(grandchild.$submitted).not.toBeTruthy();

      // Test upwards submission setting
      grandchild.$setSubmitted();
      expect(parent.$submitted).not.toBeTruthy();
      expect(child.$submitted).toBeTruthy();
      expect(grandchild.$submitted).toBeTruthy();
    });

    it("should set $submitted to true on child and parent forms when form is submitted", async () => {
      doc = createElementFromHTML(
        '<ng-form name="parent">' +
          '<ng-form name="child">' +
          '<ng-form name="grandchild">' +
          '<input ng-model="modelA" name="inputA">' +
          '<input ng-model="modelB" name="inputB">' +
          "</ng-form>" +
          "</ng-form>" +
          "</ng-form>",
      );
      $compile(doc)(scope);
      await wait();
      const { parent } = scope;
      const { child } = scope;
      const { grandchild } = scope;

      child.$setSubmitted();

      expect(parent.$submitted).toBeTruthy();
      expect(child.$submitted).toBeTruthy();
      expect(grandchild.$submitted).toBeTruthy();
    });

    // TODO These tests relied on JQ lite to call destroy on the elements being removed
    // xit("should deregister a child form when its DOM is removed", async () => {
    //   doc = createElementFromHTML(
    //     '<form name="parent">' +
    //       '<div ng-form name="child">' +
    //       '<input ng-model="modelA" name="inputA" required>' +
    //       "</div>" +
    //       "</form>",
    //   );
    //   $compile(doc)(scope);
    //   await wait();
    //
    //   const parent = scope.parent,
    //     child = scope.child;
    //
    //   expect(parent).toBeDefined();
    //   expect(child).toBeDefined();
    //   expect(parent.$error.required).toEqual([child]);
    //
    //   doc.replaceChildren(); //remove child
    //   expect(parent.child).toBeUndefined();
    //   expect(scope.child).toBeUndefined();
    //   expect(parent.$error.required).toBeFalsy();
    // });
    //
    // xit("should deregister a child form whose name is an expression when its DOM is removed", async () => {
    //   doc = createElementFromHTML(
    //     '<form name="parent">' +
    //       '<div ng-form name="child.form">' +
    //       '<input ng-model="modelA" name="inputA" required>' +
    //       "</div>" +
    //       "</form>",
    //   );
    //   $compile(doc)(scope);
    //   await wait();
    //
    //   const { parent } = scope;
    //   const child = scope.child.form;
    //   expect(parent).toBeDefined();
    //   expect(child).toBeDefined();
    //   expect(parent.$error.required).toEqual([child]);
    //   doc.replaceChildren(); // remove child
    //
    //   await wait();
    //
    //   expect(parent.child.form).toBeUndefined();
    //   expect(scope.child.form).toBeUndefined();
    //   expect(parent.$error.required).toBeFalsy();
    // });

    it("should deregister a input when it is removed from DOM", async () => {
      doc = createElementFromHTML(
        '<form name="parent">' +
          '<div ng-form name="child">' +
          '<input ng-if="inputPresent" ng-model="modelA" name="inputA" required maxlength="10">' +
          "</div>" +
          "</form>",
      );
      $compile(doc)(scope);
      scope.inputPresent = true;
      await wait();

      const { parent } = scope;
      const { child } = scope;
      const input = child.inputA;

      expect(parent).toBeDefined();
      expect(child).toBeDefined();

      expect(parent.$error.required).toEqual([child]);
      expect(parent.$$success.maxlength).toEqual([child]);

      expect(child.$error.required).toEqual([input]);
      expect(child.$$success.maxlength).toEqual([input]);

      expect(doc.classList.contains("ng-invalid")).toBe(true);
      expect(doc.classList.contains("ng-invalid-required")).toBe(true);
      expect(doc.classList.contains("ng-valid-maxlength")).toBe(true);
      expect(doc.querySelector("div").classList.contains("ng-invalid")).toBe(
        true,
      );
      expect(
        doc.querySelector("div").classList.contains("ng-invalid-required"),
      ).toBe(true);
      expect(
        doc.querySelector("div").classList.contains("ng-valid-maxlength"),
      ).toBe(true);

      // remove child input
      scope.$apply("inputPresent = false");
      await wait();
      expect(parent.$error.required).toBeFalsy();
      expect(parent.$$success.maxlength).toBeFalsy();

      expect(child.$error.required).toBeFalsy();
      expect(child.$$success.maxlength).toBeFalsy();

      expect(doc.classList.contains("ng-valid")).toBe(true);
      expect(doc.classList.contains("ng-valid-required")).toBe(false);
      expect(doc.classList.contains("ng-invalid-required")).toBe(false);
      expect(doc.classList.contains("ng-valid-maxlength")).toBe(false);
      expect(doc.classList.contains("ng-invalid-maxlength")).toBe(false);

      expect(doc.querySelector("div").classList.contains("ng-valid")).toBe(
        true,
      );
      expect(
        doc.querySelector("div").classList.contains("ng-valid-required"),
      ).toBe(false);
      expect(
        doc.querySelector("div").classList.contains("ng-invalid-required"),
      ).toBe(false);
      expect(
        doc.querySelector("div").classList.contains("ng-valid-maxlength"),
      ).toBe(false);
      expect(
        doc.querySelector("div").classList.contains("ng-invalid-maxlength"),
      ).toBe(false);
    });

    it("should deregister a input that is $pending when it is removed from DOM", async () => {
      doc = createElementFromHTML(
        '<form name="parent">' +
          '<div ng-form name="child">' +
          '<input ng-if="inputPresent" ng-model="modelA" name="inputA">' +
          "</div>" +
          "</form>",
      );
      $compile(doc)(scope);
      scope.$apply("inputPresent = true");
      await wait();
      const { parent } = scope;
      const { child } = scope;
      const input = child.inputA;

      child.inputA.$setValidity("fake", undefined);
      await wait();
      expect(parent).toBeDefined();
      expect(child).toBeDefined();

      expect(parent.$pending.fake).toEqual([child]);
      expect(child.$pending.fake).toEqual([input]);

      expect(doc.classList.contains("ng-pending")).toBe(true);
      expect(doc.querySelector("div").classList.contains("ng-pending")).toBe(
        true,
      );

      // remove child input
      scope.$apply("inputPresent = false");
      await wait();
      expect(parent.$pending).toBeUndefined();
      expect(child.$pending).toBeUndefined();

      expect(doc.classList.contains("ng-pending")).toBe(false);
      expect(doc.querySelector("div").classList.contains("ng-pending")).toBe(
        false,
      );
    });

    it("should leave the parent form invalid when deregister a removed input", async () => {
      doc = createElementFromHTML(
        '<form name="parent">' +
          '<div ng-form name="child">' +
          '<input ng-if="inputPresent" ng-model="modelA" name="inputA" required>' +
          '<input ng-model="modelB" name="inputB" required>' +
          "</div>" +
          "</form>",
      );
      $compile(doc)(scope);
      scope.inputPresent = true;
      await wait();

      const { parent } = scope;
      const { child } = scope;
      const { inputA } = child;
      const { inputB } = child;

      expect(parent).toBeDefined();
      expect(child).toBeDefined();
      expect(parent.$error.required).toEqual([child]);
      expect(child.$error.required).toEqual([inputB, inputA]);

      // remove child input
      scope.inputPresent = false;
      await wait();

      expect(parent.$error.required).toEqual([child]);
      expect(child.$error.required).toEqual([inputB]);
    });

    it("should ignore changes in manually removed child forms", async () => {
      doc = $compile(
        '<form name="myForm">' +
          '<ng-form name="childform">' +
          '<input name="childformcontrol" ng-maxlength="1" ng-model="value"/>' +
          "</ng-form>" +
          "</form>",
      )(scope);
      await wait();
      const form = scope.myForm;
      const childformController = getController(
        doc.querySelector("ng-form"),
        "form",
      );

      const input = doc.children[0].firstChild;
      const inputController = getController(input, "ngModel");

      // changeInputValue(input, "ab");
      input.setAttribute("value", "ab");
      input.dispatchEvent(new Event("change"));

      await wait();

      expect(form.$dirty).toBe(true);
      expect(form.$error.maxlength).toBeTruthy();
      expect(form.$error.maxlength[0].$name).toBe("childform");

      inputController.$setPristine();
      await wait();
      expect(form.$dirty).toBe(true);

      form.$setPristine();

      // remove child form
      form.$removeControl(childformController);
      await wait();
      expect(form.childform).toBeUndefined();
      expect(form.$error.maxlength).toBeFalsy();

      // changeInputValue(input, "abc");
      input.setAttribute("value", "abc");
      input.dispatchEvent(new Event("change"));
      await wait();

      expect(form.$error.maxlength).toBeFalsy();
      expect(form.$dirty).toBe(false);
    });

    it("should react to changes in manually added child forms", async () => {
      doc = $compile(
        '<form name="myForm">' +
          '<ng-form name="childForm">' +
          '<input name="childformcontrol" ng-maxlength="1" ng-model="value" />' +
          "</ng-form>" +
          "</form>",
      )(scope);
      await wait();

      const form = scope.myForm;
      const childFormController = getController(
        doc.querySelector("ng-form"),
        "form",
      );

      const input = doc.children[0].firstChild;

      // remove child form so we can add it manually
      form.$removeControl(childFormController);
      // changeInputValue(input, "ab");
      input.setAttribute("value", "ab");
      input.dispatchEvent(new Event("change"));

      expect(form.childForm).toBeUndefined();
      expect(form.$dirty).toBe(false);
      expect(form.$error.maxlength).toBeFalsy();

      // re-add the child form; its current validation state is not propagated
      form.$addControl(childFormController);
      expect(form.childForm).toBe(childFormController);
      expect(form.$error.maxlength).toBeFalsy();
      expect(form.$dirty).toBe(false);

      // Only when the input inside the child form changes, the validation state is propagated
      // changeInputValue(input, "abc");
      input.setAttribute("value", "abc");
      input.dispatchEvent(new Event("change"));
      expect(form.$error.maxlength[0]).toBe(childFormController);
      expect(form.$dirty).toBe(false);
    });

    it("should use the correct parent when renaming and removing dynamically added forms", async () => {
      scope.formName = "childForm";
      scope.hasChildForm = true;

      doc = $compile(
        `<div>
          <form name="myForm">
            <div ng-if="hasChildForm">
              <ng-form name="{{formName}}">
                <input name="childformcontrol" ng-maxlength="1" ng-model="value"/>
              </ng-form>
            </div>
          </form>
          <form name="otherForm"></form>
        </div>`,
      )(scope);

      await wait();
      const form = scope.myForm;
      const childForm = scope.myForm.childForm;
      const otherForm = scope.otherForm;

      // remove child form and add it to another form
      form.$removeControl(childForm);
      otherForm.$addControl(childForm);

      expect(form.childForm).toBeUndefined();
      expect(otherForm.childForm).toBe(childForm);

      // rename the childForm
      scope.formName = "childFormMoved";
      await wait();

      expect(form.childFormMoved).toBeUndefined();
      expect(otherForm.childForm).toBeUndefined();
      expect(otherForm.childFormMoved).toBe(childForm);

      scope.hasChildForm = false;
      await wait();
      expect(form.childFormMoved).toBeUndefined();
      expect(otherForm.childFormMoved).toBeDefined();
    });

    it("should chain nested forms in repeater", async () => {
      doc = createElementFromHTML(
        "<ng-form name=parent>" +
          '<ng-form ng-repeat="f in forms" name=child>' +
          "<input type=text ng-model=text name=text>" +
          "</ng-form>" +
          "</ng-form>",
      );
      $compile(doc)(scope);
      scope.forms = [1];
      await wait();

      const { parent } = scope;
      const child = parent.child;
      const input = child.text;

      expect(parent).toBeDefined();
      expect(child).toBeDefined();
      expect(input).toBeDefined();

      input.$setValidity("myRule", false);
      expect(input.$error.myRule).toEqual(true);
      expect(child.$error.myRule).toEqual([input]);
      expect(parent.$error.myRule).toEqual([child]);

      input.$setValidity("myRule", true);
      expect(parent.$error.myRule).toBeFalsy();
      expect(child.$error.myRule).toBeFalsy();
    });
  });

  describe("validation", () => {
    beforeEach(() => {
      doc = $compile(
        '<form name="form">' +
          '<input ng-model="name" name="name" store-model-ctrl/>' +
          "</form>",
      )(scope);
    });

    it("should have ng-valid/ng-invalid css class", () => {
      expect(doc.classList.contains("ng-valid")).toBeTrue();

      control.$setValidity("error", false);
      expect(doc.classList.contains("ng-invalid")).toBeTrue();
      expect(doc.classList.contains("ng-valid-error")).toBe(false);
      expect(doc.classList.contains("ng-invalid-error")).toBe(true);

      control.$setValidity("another", false);
      expect(doc.classList.contains("ng-valid-error")).toBe(false);
      expect(doc.classList.contains("ng-invalid-error")).toBe(true);
      expect(doc.classList.contains("ng-valid-another")).toBe(false);
      expect(doc.classList.contains("ng-invalid-another")).toBe(true);

      control.$setValidity("error", true);
      expect(doc.classList.contains("ng-invalid")).toBeTrue();
      expect(doc.classList.contains("ng-valid-error")).toBe(true);
      expect(doc.classList.contains("ng-invalid-error")).toBe(false);
      expect(doc.classList.contains("ng-valid-another")).toBe(false);
      expect(doc.classList.contains("ng-invalid-another")).toBe(true);

      control.$setValidity("another", true);
      expect(doc.classList.contains("ng-valid")).toBeTrue();
      expect(doc.classList.contains("ng-valid-error")).toBe(true);
      expect(doc.classList.contains("ng-invalid-error")).toBe(false);
      expect(doc.classList.contains("ng-valid-another")).toBe(true);
      expect(doc.classList.contains("ng-invalid-another")).toBe(false);

      // validators are skipped, e.g. because of a parser error
      control.$setValidity("error", null);
      control.$setValidity("another", null);
      expect(doc.classList.contains("ng-valid-error")).toBe(false);
      expect(doc.classList.contains("ng-invalid-error")).toBe(false);
      expect(doc.classList.contains("ng-valid-another")).toBe(false);
      expect(doc.classList.contains("ng-invalid-another")).toBe(false);
    });

    it("should have ng-pristine/ng-dirty css class", async () => {
      expect(doc.classList.contains("ng-pristine")).toBeTrue();
      expect(doc.classList.contains("ng-dirty")).toBeFalse();

      control.$setViewValue("");
      await wait();
      expect(doc.classList.contains("ng-pristine")).toBeFalse();
      expect(doc.classList.contains("ng-dirty")).toBeTrue();
    });
  });

  describe("$pending", () => {
    beforeEach(() => {
      doc = $compile('<form name="form"></form>')(scope);
    });

    it("should set valid and invalid to undefined when a validation error state is set as pending", () => {
      let defer;
      const form = getCacheData(doc, "$formController");

      const ctrl = {};
      form.$setValidity("matias", undefined, ctrl);

      expect(form.$valid).toBeUndefined();
      expect(form.$invalid).toBeUndefined();
      expect(form.$pending.matias).toEqual([ctrl]);

      form.$setValidity("matias", true, ctrl);

      expect(form.$valid).toBe(true);
      expect(form.$invalid).toBe(false);
      expect(form.$pending).toBeUndefined();

      form.$setValidity("matias", false, ctrl);

      expect(form.$valid).toBe(false);
      expect(form.$invalid).toBe(true);
      expect(form.$pending).toBeUndefined();
    });
  });

  describe("$setPristine", () => {
    it("should reset pristine state of form and controls", async () => {
      doc = $compile(
        '<form name="testForm">' +
          '<input ng-model="named1" name="foo">' +
          '<input ng-model="named2" name="bar">' +
          "</form>",
      )(scope);
      await wait();
      const form = doc;
      const formCtrl = scope.testForm;
      const input1 = form.children[0];
      const input1Ctrl = getController(input1, "ngModel");
      const input2 = form.querySelectorAll("input")[1];
      const input2Ctrl = getController(input2, "ngModel");

      input1Ctrl.$setViewValue("xx");
      input2Ctrl.$setViewValue("yy");
      await wait();
      expect(form.classList.contains("ng-dirty")).toBeTrue();
      expect(input1.classList.contains("ng-dirty")).toBeTrue();
      expect(input2.classList.contains("ng-dirty")).toBeTrue();

      formCtrl.$setPristine();
      expect(form.classList.contains("ng-pristine")).toBeTrue();
      expect(form.classList.contains("ng-dirty")).toBeFalse();
      expect(formCtrl.$pristine).toBe(true);
      expect(formCtrl.$dirty).toBe(false);

      expect(input1.classList.contains("ng-pristine")).toBeTrue();
      expect(input1Ctrl.$pristine).toBe(true);
      expect(input1Ctrl.$dirty).toBe(false);
      expect(input2.classList.contains("ng-pristine")).toBeTrue();
      expect(input2Ctrl.$pristine).toBe(true);
      expect(input2Ctrl.$dirty).toBe(false);
    });

    it("should reset pristine state of anonymous form controls", async () => {
      doc = $compile(
        '<form name="testForm">' + '<input ng-model="anonymous">' + "</form>",
      )(scope);

      const form = doc;
      const formCtrl = scope.testForm;
      const input = form.children[0];
      const inputCtrl = getController(input, "ngModel");

      inputCtrl.$setViewValue("xx");
      await wait();
      expect(form.classList.contains("ng-dirty")).toBeTrue();
      expect(input.classList.contains("ng-dirty")).toBeTrue();

      formCtrl.$setPristine();
      expect(form.classList.contains("ng-pristine")).toBeTrue();
      expect(formCtrl.$pristine).toBe(true);
      expect(formCtrl.$dirty).toBe(false);
      expect(input.classList.contains("ng-pristine")).toBeTrue();
      expect(inputCtrl.$pristine).toBe(true);
      expect(inputCtrl.$dirty).toBe(false);
    });

    it("should reset pristine state of nested forms", async () => {
      doc = $compile(
        '<form name="testForm">' +
          "<div ng-form>" +
          '<input ng-model="named" name="foo">' +
          "</div>" +
          "</form>",
      )(scope);
      await wait();

      const form = doc;
      const formCtrl = scope.testForm;
      const nestedForm = form.querySelector("div");
      assert(nestedForm);
      const nestedFormCtrl = getController(nestedForm, "form");
      assert(nestedFormCtrl);
      const nestedInput = form.children[0].children[0];
      assert(nestedInput);
      const nestedInputCtrl = getController(nestedInput, "ngModel");
      assert(nestedInputCtrl);

      nestedInputCtrl.$setViewValue("xx");
      await wait();
      expect(form.classList.contains("ng-dirty")).toBeTrue();
      expect(nestedForm.classList.contains("ng-dirty")).toBeTrue();
      expect(nestedInput.classList.contains("ng-dirty")).toBeTrue();

      formCtrl.$setPristine();
      expect(form.classList.contains("ng-pristine")).toBeTrue();
      expect(formCtrl.$pristine).toBe(true);
      expect(formCtrl.$dirty).toBe(false);
      expect(nestedForm.classList.contains("ng-pristine")).toBeTrue();
      expect(nestedFormCtrl.$pristine).toBe(true);
      expect(nestedFormCtrl.$dirty).toBe(false);
      expect(nestedInput.classList.contains("ng-pristine")).toBeTrue();
      expect(nestedInputCtrl.$pristine).toBe(true);
      expect(nestedInputCtrl.$dirty).toBe(false);
    });
  });

  describe("$setUntouched", () => {
    it("should trigger setUntouched on form controls", () => {
      const form = $compile(
        '<form name="myForm">' +
          '<input name="alias" type="text" ng-model="name" />' +
          "</form>",
      )(scope);
      scope.myForm.alias.$setTouched();
      expect(scope.myForm.alias.$touched).toBe(true);
      scope.myForm.$setUntouched();
      expect(scope.myForm.alias.$touched).toBe(false);
    });

    it("should trigger setUntouched on form controls with nested forms", () => {
      const form = $compile(
        '<form name="myForm">' +
          '<div ng-form name="childForm">' +
          '<input name="alias" type="text" ng-model="name" />' +
          "</div>" +
          "</form>",
      )(scope);
      scope.myForm.childForm.alias.$setTouched();
      expect(scope.myForm.childForm.alias.$touched).toBe(true);
      scope.myForm.$setUntouched();
      expect(scope.myForm.childForm.alias.$touched).toBe(false);
    });
  });

  describe("$getControls", () => {
    it("should return an empty array if the controller has no controls", () => {
      doc = $compile('<form name="testForm"></form>')(scope);

      const formCtrl = scope.testForm;

      expect(formCtrl.$getControls()).toEqual([]);
    });

    it("should return a shallow copy of the form controls", async () => {
      doc = $compile(
        '<form name="testForm">' +
          '<input ng-model="named" name="foo">' +
          "<div ng-form>" +
          '<input ng-model="named" name="foo">' +
          "</div>" +
          "</form>",
      )(scope);
      await wait();

      const form = doc;
      const formCtrl = scope.testForm;
      const formInput = form.children[0];
      const formInputCtrl = getController(formInput, "ngModel");
      const nestedForm = form.querySelector("div");
      const nestedFormCtrl = getController(nestedForm, "form");
      const nestedInput = nestedForm.children[0];
      const nestedInputCtrl = getController(nestedInput, "ngModel");

      const controls = formCtrl.$getControls();

      expect(controls).not.toBe(formCtrl.$$controls);

      controls.push("something");
      expect(formCtrl.$$controls).not.toContain("something");

      expect(controls[0]).toBe(formInputCtrl);
      expect(controls[1]).toBe(nestedFormCtrl);

      const nestedControls = controls[1].$getControls();

      expect(nestedControls[0]).toBe(nestedInputCtrl);
    });
  });

  it("should rename nested form controls when interpolated name changes", async () => {
    scope.idA = "A";
    scope.idB = "X";

    doc = $compile(
      '<form name="form">' +
        '<div ng-form="nested{{idA}}">' +
        '<div ng-form name="nested{{idB}}"' +
        "</div>" +
        "</div>" +
        "</form>",
    )(scope);
    await wait();
    const formA = scope.form.nestedA;
    expect(formA).toBeDefined();
    expect(formA.$name).toBe("nestedA");

    const formX = formA.nestedX;
    expect(formX).toBeDefined();
    expect(formX.$name).toBe("nestedX");

    scope.idA = "B";
    scope.idB = "Y";
    await wait();
    expect(scope.form.nestedA).toBeUndefined();
    expect(scope.form.nestedB).toBe(formA);
    expect(formA.nestedX).toBeUndefined();
    expect(formA.nestedY).toBe(formX);
  });

  it("should rename forms with no parent when interpolated name changes", async () => {
    const element = $compile('<form name="name{{nameID}}"></form>')(scope);
    const element2 = $compile('<div ng-form="ngform{{nameID}}"></div>')(scope);
    await wait();
    scope.nameID = "A";
    await wait();
    const form = getController(element, "form");
    const form2 = getController(element2, "form");
    expect(scope.nameA).toBe(form);
    expect(scope.ngformA).toBe(form2);
    expect(form.$name).toBe("nameA");
    expect(form2.$name).toBe("ngformA");

    scope.nameID = "B";
    await wait();
    expect(scope.nameA).toBeUndefined();
    expect(scope.ngformA).toBeUndefined();
    expect(scope.nameB).toBe(form);
    expect(scope.ngformB).toBe(form2);
    expect(form.$name).toBe("nameB");
    expect(form2.$name).toBe("ngformB");
  });

  it("should rename forms with an initially blank name", async () => {
    const element = $compile('<form name="{{name}}"></form>')(scope);
    await wait();
    const form = getController(element, "form");
    expect(scope[""]).toBe(form);
    expect(form.$name).toBe("");
    scope.name = "foo";
    await wait();

    expect(scope.foo).toBe(form);
    expect(form.$name).toBe("foo");
    expect(scope.foo).toBe(form);
  });

  describe("$setSubmitted", () => {
    beforeEach(async () => {
      doc = $compile(
        '<form name="form" ng-submit="submitted = true">' +
          '<input type="text" ng-model="name" required />' +
          '<input type="submit" />' +
          "</form>",
      )(scope);
      await wait();
    });

    it("should not init in submitted state", () => {
      expect(scope.form.$submitted).toBe(false);
    });

    it("should be in submitted state when submitted", () => {
      // browserTrigger(doc, "submit");
      doc.dispatchEvent(new Event("submit"));
      expect(scope.form.$submitted).toBe(true);
    });

    it("should revert submitted back to false when $setPristine is called on the form", () => {
      scope.form.$submitted = true;
      scope.form.$setPristine();
      expect(scope.form.$submitted).toBe(false);
    });
  });

  // TODO After animations
  xdescribe("form animations", () => {
    function assertValidAnimation(
      animation,
      event,
      classNameAdded,
      classNameRemoved,
    ) {
      expect(animation.event).toBe(event);
      expect(animation.args[1]).toBe(classNameAdded);
      expect(animation.args[2]).toBe(classNameRemoved);
    }

    let form;
    let $animate;
    let myModule;

    beforeEach(() => {
      let dummy = document.getElementById("app");
      doc = '<form name="myForm"></form>';
      dummy.append(doc);
      let angular = new Angular();
      window.angular = new Angular();
      myModule = window.angular.module("myModule", []);

      injector = angular.bootstrap(dummy, ["myModule"]);
      injector.invoke((_$compile_, $rootScope, _$animate_) => {
        $compile = _$compile_;
        scope = $rootScope.$new();
        $animate = _$animate_;
      });
      form = scope.myForm;
    });

    afterEach(() => {
      dealoc(doc);
      dealoc(dummy);
      document.getElementById("app").innerHTML = "";
    });

    it("should trigger an animation when invalid", (done) => {
      form.$setValidity("required", false);
      setTimeout(() => {
        // assertValidAnimation($animate.queue[0], "removeClass", "ng-valid");
        // assertValidAnimation($animate.queue[1], "addClass", "ng-invalid");
        // assertValidAnimation($animate.queue[2], "addClass", "ng-invalid-required");
        expect(doc.classList.contains("ng-valid")).toBeTrue();
        expect(doc.classList.contains("ng-invalid-add")).toBeTrue();
        expect(doc.classList.contains("ng-invalid-required-add")).toBeTrue();
        done();
      }, 100);
    });

    it("should trigger an animation when valid", (done) => {
      form.$setValidity("required", false);

      form.$setValidity("required", true);

      setTimeout(() => {
        // assertValidAnimation($animate.queue[0], "addClass", "ng-valid");
        // assertValidAnimation($animate.queue[1], "removeClass", "ng-invalid");
        // assertValidAnimation($animate.queue[2], "addClass", "ng-valid-required");
        expect(doc.classList.contains("ng-valid")).toBeTrue();
        expect(doc.classList.contains("ng-invalid-add")).toBeTrue();
        expect(doc.classList.contains("ng-invalid-required-add")).toBeTrue();
        done();
      }, 100);
    });

    it("should trigger an animation when dirty", (done) => {
      form.$setDirty();
      setTimeout(() => {
        // assertValidAnimation($animate.queue[0], "removeClass", "ng-pristine");
        // assertValidAnimation($animate.queue[1], "addClass", "ng-dirty");
        expect(doc.classList.contains("ng-pristine")).toBeTrue();
        expect(doc.classList.contains("ng-dirty-add")).toBeTrue();
        done();
      }, 100);
    });

    it("should trigger an animation when pristine", (done) => {
      form.$setDirty();
      form.$setPristine();
      setTimeout(() => {
        // assertValidAnimation($animate.queue[0], "removeClass", "ng-pristine");
        // assertValidAnimation($animate.queue[1], "addClass", "ng-dirty");
        expect(doc.classList.contains("ng-pristine")).toBeTrue();
        expect(doc.classList.contains("ng-dirty-add")).toBeTrue();
        done();
      }, 100);
    });

    it("should trigger custom errors as addClass/removeClass when invalid/valid", (done) => {
      form.$setValidity("custom-error", false);

      setTimeout(() => {
        // assertValidAnimation($animate.queue[0], "removeClass", "ng-valid");
        // assertValidAnimation($animate.queue[1], "addClass", "ng-invalid");
        // assertValidAnimation(
        //   $animate.queue[2],
        //   "addClass",
        //   "ng-invalid-custom-error",
        // );
        expect(doc.classList.contains("ng-valid")).toBeTrue();
        expect(doc.classList.contains("ng-invalid-add")).toBeTrue();
        expect(
          doc.classList.contains("ng-invalid-custom-error-add"),
        ).toBeTrue();
      }, 100);

      // $animate.queue = [];
      form.$setValidity("custom-error", true);

      setTimeout(() => {
        // assertValidAnimation($animate.queue[0], "removeClass", "ng-valid");
        // assertValidAnimation($animate.queue[1], "addClass", "ng-invalid");
        // assertValidAnimation(
        //   $animate.queue[2],
        //   "addClass",
        //   "ng-invalid-custom-error",
        // );
        expect(doc.classList.contains("ng-valid")).toBeTrue();
        expect(doc.classList.contains("ng-invalid-add")).toBeTrue();
        expect(doc.classList.contains("ng-valid-custom-error-add")).toBeTrue();
        done();
      }, 300);
    });
  });
});
