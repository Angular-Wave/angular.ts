import { isUndefined, stringify } from "../core/utils";

export const ngBindDirective = [
  "$compile",
  ($compile) => {
    return {
      restrict: "AC",
      compile: (templateElement) => {
        $compile.$$addBindingClass(templateElement);
        return (scope, element, attr) => {
          $compile.$$addBindingInfo(element, attr.ngBind);
          element = element[0];
          scope.$watch(attr.ngBind, function ngBindWatchAction(value) {
            element.textContent = stringify(value);
          });
        };
      },
    };
  },
];

/**
 * @ngdoc directive
 * @name ngBindTemplate
 *
 * @description
 * The `ngBindTemplate` directive specifies that the element
 * text content should be replaced with the interpolation of the template
 * in the `ngBindTemplate` attribute.
 * Unlike `ngBind`, the `ngBindTemplate` can contain multiple `{{` `}}`
 * expressions. This directive is needed since some HTML elements
 * (such as TITLE and OPTION) cannot contain SPAN elements.
 *
 * @element ANY
 * @param {string} ngBindTemplate template of form
 *   <tt>{{</tt> <tt>expression</tt> <tt>}}</tt> to eval.
 *
 * @example
 * Try it here: enter text in text box and watch the greeting change.
   <example module="bindExample" name="ng-bind-template">
     <file name="index.html">
       <script>
         angular.module('bindExample', [])
           .controller('ExampleController', ['$scope', function($scope) {
             $scope.salutation = 'Hello';
             $scope.name = 'World';
           }]);
       </script>
       <div ng-controller="ExampleController">
        <label>Salutation: <input type="text" ng-model="salutation"></label><br>
        <label>Name: <input type="text" ng-model="name"></label><br>
        <pre ng-bind-template="{{salutation}} {{name}}!"></pre>
       </div>
     </file>
     <file name="protractor.js" type="protractor">
       it('should check ng-bind', function() {
         var salutationElem = element(by.binding('salutation'));
         var salutationInput = element(by.model('salutation'));
         var nameInput = element(by.model('name'));

         expect(salutationElem.getText()).toBe('Hello World!');

         salutationInput.clear();
         salutationInput.sendKeys('Greetings');
         nameInput.clear();
         nameInput.sendKeys('user');

         expect(salutationElem.getText()).toBe('Greetings user!');
       });
     </file>
   </example>
 */
export const ngBindTemplateDirective = [
  "$interpolate",
  "$compile",
  ($interpolate, $compile) => {
    return {
      compile: (templateElement) => {
        $compile.$$addBindingClass(templateElement);
        return (scope, element, attr) => {
          var interpolateFn = $interpolate(
            element.attr(attr.$attr.ngBindTemplate),
          );
          $compile.$$addBindingInfo(element, interpolateFn.expressions);
          element = element[0];
          attr.$observe("ngBindTemplate", (value) => {
            element.textContent = isUndefined(value) ? "" : value;
          });
        };
      },
    };
  },
];

/**
 * @ngdoc directive
 * @name ngBindHtml
 *
 * @description
 * Evaluates the expression and inserts the resulting HTML into the element in a secure way. By default,
 * the resulting HTML content will be sanitized using the {@link ngSanitize.$sanitize $sanitize} service.
 * To utilize this functionality, ensure that `$sanitize` is available, for example, by including {@link
 * ngSanitize} in your module's dependencies (not in core AngularJS). In order to use {@link ngSanitize}
 * in your module's dependencies, you need to include "angular-sanitize.js" in your application.
 *
 * You may also bypass sanitization for values you know are safe. To do so, bind to
 * an explicitly trusted value via {@link ng.$sce#trustAsHtml $sce.trustAsHtml}.  See the example
 * under {@link ng.$sce#show-me-an-example-using-sce- Strict Contextual Escaping (SCE)}.
 *
 * Note: If a `$sanitize` service is unavailable and the bound value isn't explicitly trusted, you
 * will have an exception (instead of an exploit.)
 *
 * @element ANY
 * @param {string} ngBindHtml {@link guide/expression Expression} to evaluate.
 *
 * @example

   <example module="bindHtmlExample" deps="angular-sanitize.js" name="ng-bind-html">
     <file name="index.html">
       <div ng-controller="ExampleController">
        <p ng-bind-html="myHTML"></p>
       </div>
     </file>

     <file name="script.js">
       angular.module('bindHtmlExample', ['ngSanitize'])
         .controller('ExampleController', ['$scope', function($scope) {
           $scope.myHTML =
              'I am an <code>HTML</code>string with ' +
              '<a href="#">links!</a> and other <em>stuff</em>';
         }]);
     </file>

     <file name="protractor.js" type="protractor">
       it('should check ng-bind-html', function() {
         expect(element(by.binding('myHTML')).getText()).toBe(
             'I am an HTMLstring with links! and other stuff');
       });
     </file>
   </example>
 */
export const ngBindHtmlDirective = [
  "$parse",
  "$compile",
  ($parse, $compile) => {
    return {
      restrict: "A",
      compile: (tElement, tAttrs) => {
        var ngBindHtmlGetter = $parse(tAttrs.ngBindHtml);
        var ngBindHtmlWatch = $parse(
          tAttrs.ngBindHtml,
          function sceValueOf(val) {
            // Unwrap the value to compare the actual inner safe value, not the wrapper object.
            return val;
          },
        );
        $compile.$$addBindingClass(tElement);

        return (scope, element, attr) => {
          $compile.$$addBindingInfo(element, attr.ngBindHtml);

          scope.$watch(ngBindHtmlWatch, () => {
            // The watched value is the unwrapped value. To avoid re-escaping, use the direct getter.
            var value = ngBindHtmlGetter(scope);
            element.html(value || "");
          });
        };
      },
    };
  },
];
