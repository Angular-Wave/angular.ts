import { Angular } from "../../loader";
import { createInjector } from "../../core/di/injector";
import { dealoc } from "../../shared/jqlite/jqlite";

describe("boolean attr directives", () => {
  let element, $rootScope, $compile, $rootElement;

  beforeEach(() => {
    window.angular = new Angular();
    createInjector([
      "ng",
      ($provide) => {
        $provide.value("$rootElement", window.document.body);
      },
    ]).invoke((_$compile_, _$rootScope_, _$rootElement_) => {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $rootElement = _$rootElement_;
    });
  });

  afterEach(() => {
    dealoc(element);
  });

  it("should properly evaluate 0 as false", () => {
    // jQuery does not treat 0 as false, when setting attr()
    element = $compile('<button ng-disabled="isDisabled">Button</button>')(
      $rootScope,
    );
    $rootScope.isDisabled = 0;
    $rootScope.$digest();
    expect(element.attr("disabled")).toBeFalsy();
    $rootScope.isDisabled = 1;
    $rootScope.$digest();
    expect(element.attr("disabled")).toBeTruthy();
  });

  it("should bind disabled", () => {
    element = $compile('<button ng-disabled="isDisabled">Button</button>')(
      $rootScope,
    );
    $rootScope.isDisabled = false;
    $rootScope.$digest();
    expect(element.attr("disabled")).toBeFalsy();
    $rootScope.isDisabled = true;
    $rootScope.$digest();
    expect(element.attr("disabled")).toBeTruthy();
  });

  it("should bind checked", () => {
    element = $compile('<input type="checkbox" ng-checked="isChecked" />')(
      $rootScope,
    );
    $rootScope.isChecked = false;
    $rootScope.$digest();
    expect(element.attr("checked")).toBeFalsy();
    $rootScope.isChecked = true;
    $rootScope.$digest();
    expect(element.attr("checked")).toBeTruthy();
  });

  it("should not bind checked when ngModel is present", () => {
    // test for https://github.com/angular/angular.js/issues/10662
    element = $compile(
      '<input type="checkbox" ng-model="value" ng-false-value="\'false\'" ' +
        'ng-true-value="\'true\'" ng-checked="value" />',
    )($rootScope);

    $rootScope.value = "true";
    $rootScope.$digest();
    expect(element[0].checked).toBe(true);

    element[0].checked = !element[0].checked;
    element[0].dispatchEvent(new Event("change"));
    expect(element[0].checked).toBe(false);
    expect($rootScope.value).toBe("false");
    element[0].checked = !element[0].checked;
    element[0].dispatchEvent(new Event("change"));
    expect(element[0].checked).toBe(true);
    expect($rootScope.value).toBe("true");
  });

  it("should bind selected", () => {
    element = $compile(
      '<select><option value=""></option><option ng-selected="isSelected">Greetings!</option></select>',
    )($rootScope);
    $rootScope.isSelected = false;
    $rootScope.$digest();
    expect(element.children()[1].selected).toBeFalsy();
    $rootScope.isSelected = true;
    $rootScope.$digest();
    expect(element.children()[1].selected).toBeTruthy();
  });

  it("should bind readonly", () => {
    element = $compile('<input type="text" ng-readonly="isReadonly" />')(
      $rootScope,
    );
    $rootScope.isReadonly = false;
    $rootScope.$digest();
    expect(element.attr("readOnly")).toBeFalsy();
    $rootScope.isReadonly = true;
    $rootScope.$digest();
    expect(element.attr("readOnly")).toBeTruthy();
  });

  it("should bind open", () => {
    element = $compile('<details ng-open="isOpen"></details>')($rootScope);
    $rootScope.isOpen = false;
    $rootScope.$digest();
    expect(element.attr("open")).toBeFalsy();
    $rootScope.isOpen = true;
    $rootScope.$digest();
    expect(element.attr("open")).toBeTruthy();
  });

  describe("multiple", () => {
    it("should NOT bind to multiple via ngMultiple", () => {
      element = $compile('<select ng-multiple="isMultiple"></select>')(
        $rootScope,
      );
      $rootScope.isMultiple = false;
      $rootScope.$digest();
      expect(element.attr("multiple")).toBeFalsy();
      $rootScope.isMultiple = "multiple";
      $rootScope.$digest();
      expect(element.attr("multiple")).toBeFalsy(); // ignore
    });

    it("should throw an exception if binding to multiple attribute", () => {
      expect(() => {
        $compile('<select multiple="{{isMultiple}}"></select>');
      }).toThrowError(/selmulti/);
    });
  });
});
