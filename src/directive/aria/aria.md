/\*\*

- @ngdoc module
- @name ngAria
- @description
-
- The `ngAria` module provides support for common
- [<abbr title="Accessible Rich Internet Applications">ARIA</abbr>](http://www.w3.org/TR/wai-aria/)
- attributes that convey state or semantic information about the application for users
- of assistive technologies, such as screen readers.
-
- ## Usage
-
- For ngAria to do its magic, simply include the module `ngAria` as a dependency. The following
- directives are supported:
- `ngModel`, `ngChecked`, `ngReadonly`, `ngRequired`, `ngValue`, `ngDisabled`, `ngShow`, `ngHide`,
- `ngClick`, `ngDblClick`, and `ngMessages`.
-
- Below is a more detailed breakdown of the attributes handled by ngAria:
-
- | Directive | Supported Attributes |
- |---------------------------------------------|-----------------------------------------------------------------------------------------------------|
- | {@link ng.directive:ngModel ngModel} | aria-checked, aria-valuemin, aria-valuemax, aria-valuenow, aria-invalid, aria-required, input roles |
- | {@link ng.directive:ngDisabled ngDisabled} | aria-disabled |
- | {@link ng.directive:ngRequired ngRequired} | aria-required |
- | {@link ng.directive:ngChecked ngChecked} | aria-checked |
- | {@link ng.directive:ngReadonly ngReadonly} | aria-readonly |
- | {@link ng.directive:ngValue ngValue} | aria-checked |
- | {@link ng.directive:ngShow ngShow} | aria-hidden |
- | {@link ng.directive:ngHide ngHide} | aria-hidden |
- | {@link ng.directive:ngDblclick ngDblclick} | tabindex |
- | {@link module:ngMessages ngMessages} | aria-live |
- | {@link ng.directive:ngClick ngClick} | tabindex, keydown event, button role |
-
- Find out more information about each directive by reading the
- {@link guide/accessibility ngAria Developer Guide}.
-
- ## Example
- Using ngDisabled with ngAria:
- ```html

  ```

- <md-checkbox ng-disabled="disabled">
- ```

  ```

- Becomes:
- ```html

  ```

- <md-checkbox ng-disabled="disabled" aria-disabled="true">
- ```

  ```

-
- ## Disabling Specific Attributes
- It is possible to disable individual attributes added by ngAria with the
- {@link ngAria.$ariaProvider#config config} method. For more details, see the
- {@link guide/accessibility Developer Guide}.
-
- ## Disabling `ngAria` on Specific Elements
- It is possible to make `ngAria` ignore a specific element, by adding the `ng-aria-disable`
- attribute on it. Note that only the element itself (and not its child elements) will be ignored.
  \*/

/\*\*

- @ngdoc service
- @name $aria
-
- @description
-
- The $aria service contains helper methods for applying common
- [ARIA](http://www.w3.org/TR/wai-aria/) attributes to HTML directives.
-
- ngAria injects common accessibility attributes that tell assistive technologies when HTML
- elements are enabled, selected, hidden, and more. To see how this is performed with ngAria,
- let's review a code snippet from ngAria itself:
- \*```js
- ngAriaModule.directive('ngDisabled', ['$aria', function($aria) {
- return $aria.$$watchExpr('ngDisabled', 'aria-disabled', nativeAriaNodeNames, false);
- }])
  \*```
- Shown above, the ngAria module creates a directive with the same signature as the
- traditional `ng-disabled` directive. But this ngAria version is dedicated to
- solely managing accessibility attributes on custom elements. The internal `$aria` service is
- used to watch the boolean attribute `ngDisabled`. If it has not been explicitly set by the
- developer, `aria-disabled` is injected as an attribute with its value synchronized to the
- value in `ngDisabled`.
-
- Because ngAria hooks into the `ng-disabled` directive, developers do not have to do
- anything to enable this feature. The `aria-disabled` attribute is automatically managed
- simply as a silent side-effect of using `ng-disabled` with the ngAria module.
-
- The full list of directives that interface with ngAria:
- - **ngModel**
- - **ngChecked**
- - **ngReadonly**
- - **ngRequired**
- - **ngDisabled**
- - **ngValue**
- - **ngShow**
- - **ngHide**
- - **ngClick**
- - **ngDblclick**
- - **ngMessages**
-
- Read the {@link guide/accessibility ngAria Developer Guide} for a thorough explanation of each
- directive.
-
-
- ## Dependencies
- Requires the {@link ngAria} module to be installed.
  \*/

/\*\*

- @ngdoc method
- @name $ariaProvider#config
-
- @param {object} newConfig object to enable/disable specific ARIA attributes
-
- - **ariaHidden** – `{boolean}` – Enables/disables aria-hidden tags
- - **ariaChecked** – `{boolean}` – Enables/disables aria-checked tags
- - **ariaReadonly** – `{boolean}` – Enables/disables aria-readonly tags
- - **ariaDisabled** – `{boolean}` – Enables/disables aria-disabled tags
- - **ariaRequired** – `{boolean}` – Enables/disables aria-required tags
- - **ariaInvalid** – `{boolean}` – Enables/disables aria-invalid tags
- - **ariaValue** – `{boolean}` – Enables/disables aria-valuemin, aria-valuemax and
- aria-valuenow tags
- - **tabindex** – `{boolean}` – Enables/disables tabindex tags
- - **bindKeydown** – `{boolean}` – Enables/disables keyboard event binding on non-interactive
- elements (such as `div` or `li`) using ng-click, making them more accessible to users of
- assistive technologies
- - **bindRoleForClick** – `{boolean}` – Adds role=button to non-interactive elements (such as
- `div` or `li`) using ng-click, making them more accessible to users of assistive
- technologies
-
- @description
- Enables/disables various ARIA attributes
  \*/
