## ngBind Directive

### Description

The `ngBind` attribute tells AngularTS to replace the text content of the specified HTML element with the value of a given expression, and to update the text content when the value of that expression changes.

Typically, you don't use `ngBind` directly, but instead, you use the double curly markup like `{{ expression }}` which is similar but less verbose.

It is preferable to use `ngBind` instead of `{{ expression }}` if a template is momentarily displayed by the browser in its raw state before AngularTS compiles it. Since `ngBind` is an element attribute, it makes the bindings invisible to the user while the page is loading.

An alternative solution to this problem would be using the [`ngCloak`](https://docs.angularjs.org/api/ng/directive/ngCloak) directive.

### Element

ANY

### Parameter

- `ngBind`: [Expression](https://docs.angularjs.org/guide/expression) to evaluate.

### Example

Enter a name in the Live Preview text box; the greeting below the text box changes instantly.

```html
<example module="bindExample" name="ng-bind">
  <file name="index.html">
    <script>
      angular.module("bindExample", []).controller("ExampleController", [
        "$scope",
        function ($scope) {
          $scope.name = "Whirled";
        },
      ]);
    </script>
    <div ng-controller="ExampleController">
      <label>Enter name: <input type="text" ng-model="name" /></label><br />
      Hello <span ng-bind="name"></span>!
    </div>
  </file>
  <file name="protractor.js" type="protractor">
    it('should check ng-bind', function() { var nameInput =
    element(by.model('name'));
    expect(element(by.binding('name')).getText()).toBe('Whirled');
    nameInput.clear(); nameInput.sendKeys('world');
    expect(element(by.binding('name')).getText()).toBe('world'); });
  </file>
</example>
```

## ngBindTemplate Directive

### Description

The `ngBindTemplate` directive specifies that the element text content should be replaced with the interpolation of the template in the `ngBindTemplate` attribute. Unlike `ngBind`, the `ngBindTemplate` can contain multiple `{{ }}` expressions. This directive is necessary since some HTML elements (such as `TITLE` and `OPTION`) cannot contain `SPAN` elements.

### Element

ANY

### Parameter

- `ngBindTemplate`: Template of form `{{ expression }}` to evaluate.

### Example

Try it here: enter text in the text box and watch the greeting change.

````html
<example module="bindExample" name="ng-bind-template">
  <file name="index.html">
    <script>
      angular.module("bindExample", []).controller("ExampleController", [
        "$scope",
        function ($scope) {
          $scope.salutation = "Hello";
          $scope.name = "World";
        },
      ]);
    </script>
    <div ng-controller="ExampleController">
      <label>Salutation: <input type="text" ng-model="salutation" /></label
      ><br />
      <label>Name: <input type="text" ng-model="name" /></label><br />
      <pre ng-bind-template="{{salutation}} {{name}}!"></pre>
    </div>
  </file>
  <file name="protractor.js" type="protractor">
    it('should check ng-bind', function() { var salutationElem =
    element(by.binding('salutation')); var salutationInput =
    element(by.model('salutation')); var nameInput = element(by.model('name'));
    expect(salutationElem.getText()).toBe('Hello World!');
    salutationInput.clear(); salutationInput.sendKeys('Greetings');
    nameInput.clear(); nameInput.sendKeys('user');
    expect(salutationElem.getText()).toBe('Greetings user!'); });
  </file>
</example>

## ngBindHtml Directive ### Description Evaluates the expression and inserts the
resulting HTML into the element in a secure way. By default, the resulting HTML
content will be sanitized using the
[`$sanitize`](https://docs.angularjs.org/api/ngSanitize/service/$sanitize)
service. To utilize this functionality, ensure that `$sanitize` is available,
for example, by including
[`ngSanitize`](https://docs.angularjs.org/api/ngSanitize) in your module's
dependencies (not in core AngularTS). To use `ngSanitize` in your module's
dependencies, you need to include "angular-sanitize.js" in your application. You
may also bypass sanitization for values you know are safe. To do so, bind to an
explicitly trusted value via
[`$sce.trustAsHtml`](https://docs.angularjs.org/api/ng/service/$sce#trustAsHtml).
See the example under [Strict Contextual Escaping
(SCE)](https://docs.angularjs.org/api/ng/service/$sce#show-me-an-example-using-sce).
**Note:** If a `$sanitize` service is unavailable and the bound value isn't
explicitly trusted, you will encounter an exception (instead of an exploit). ###
Element ANY ### Parameter - `ngBindHtml`:
[Expression](https://docs.angularjs.org/guide/expression) to evaluate. ###
Example ```html
<example
  module="bindHtmlExample"
  deps="angular-sanitize.js"
  name="ng-bind-html"
>
  <file name="index.html">
    <div ng-controller="ExampleController">
      <p ng-bind-html="myHTML"></p>
    </div>
  </file>

  <file name="script.js">
    angular.module('bindHtmlExample', ['ngSanitize'])
    .controller('ExampleController', ['$scope', function($scope) { $scope.myHTML
    = 'I am an <code>HTML</code>string with ' + '<a href="#">links!</a> and
    other <em>stuff</em>'; }]);
  </file>

  <file name="protractor.js" type="protractor">
    it('should check ng-bind-html', function() {
    expect(element(by.binding('myHTML')).getText()).toBe( 'I am an HTMLstring
    with links! and other stuff'); });
  </file>
</example>
````
