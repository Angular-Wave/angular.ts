/* global FormController: false */
"use strict";

describe("form", function () {
  var doc, control, scope, $compile, changeInputValue;

  //   beforeEach(module(function($compileProvider) {
  //     $compileProvider.directive('storeModelCtrl', function() {
  //       return {
  //         require: 'ngModel',
  //         link: function(scope, elm, attr, ctrl) {
  //           control = ctrl;
  //         }
  //       };
  //     });
  //   }));

  //   beforeEach(inject(function($injector, $sniffer) {
  //     $compile = $injector.get('$compile');
  //     scope = $injector.get('$rootScope');

  //     changeInputValue = function(elm, value) {
  //       elm.val(value);
  //       browserTrigger(elm, $sniffer.hasEvent('input') ? 'input' : 'change');
  //     };
  //   }));

  it("should emit $destroy event if element removed via remove()", function () {
    var log = "";
    var element = angular.element("<div>A</div>");
    element.on("$destroy", function () {
      log += "destroy;";
    });

    element.remove();
    expect(log).toEqual("destroy;");
  });
});
