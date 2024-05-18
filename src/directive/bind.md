## ngBind Directive

### Description

The `ngBind` attribute tells AngularJS to replace the text content of the specified HTML element with the value of a given expression, and to update the text content when the value of that expression changes.

Typically, you don't use `ngBind` directly, but instead, you use the double curly markup like `{{ expression }}` which is similar but less verbose.

It is preferable to use `ngBind` instead of `{{ expression }}` if a template is momentarily displayed by the browser in its raw state before AngularJS compiles it. Since `ngBind` is an element attribute, it makes the bindings invisible to the user while the page is loading.

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
