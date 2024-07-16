/\*\*

- @ngdoc directive
- @name ngHref
- @restrict A
- @priority 99
-
- @description
- Using AngularJS markup like `{{hash}}` in an href attribute will
- make the link go to the wrong URL if the user clicks it before
- AngularJS has a chance to replace the `{{hash}}` markup with its
- value. Until AngularJS replaces the markup the link will be broken
- and will most likely return a 404 error. The `ngHref` directive
- solves this problem.
-
- The wrong way to write it:
- ```html

  ```

- <a href="http://www.gravatar.com/avatar/{{hash}}">link1</a>
- ```

  ```

-
- The correct way to write it:
- ```html

  ```

- <a ng-href="http://www.gravatar.com/avatar/{{hash}}">link1</a>
- ```

  ```

-
- @element A
- @param {template} ngHref any string which can contain `{{}}` markup.
- \*/

/\*\*

- @ngdoc directive
- @name ngSrc
- @restrict A
- @priority 99
-
- @description
- Using AngularJS markup like `{{hash}}` in a `src` attribute doesn't
- work right: The browser will fetch from the URL with the literal
- text `{{hash}}` until AngularJS replaces the expression inside
- `{{hash}}`. The `ngSrc` directive solves this problem.
-
- The buggy way to write it:
- ```html

  ```

- <img src="http://www.gravatar.com/avatar/{{hash}}" alt="Description"/>
- ```

  ```

-
- The correct way to write it:
- ```html

  ```

- <img ng-src="http://www.gravatar.com/avatar/{{hash}}" alt="Description" />
- ```

  ```

-
- @element IMG
- @param {template} ngSrc any string which can contain `{{}}` markup.
  \*/

/\*\*

- @ngdoc directive
- @name ngSrcset
- @restrict A
- @priority 99
-
- @description
- Using AngularJS markup like `{{hash}}` in a `srcset` attribute doesn't
- work right: The browser will fetch from the URL with the literal
- text `{{hash}}` until AngularJS replaces the expression inside
- `{{hash}}`. The `ngSrcset` directive solves this problem.
-
- The buggy way to write it:
- ```html

  ```

- <img srcset="http://www.gravatar.com/avatar/{{hash}} 2x" alt="Description"/>
- ```

  ```

-
- The correct way to write it:
- ```html

  ```

- <img ng-srcset="http://www.gravatar.com/avatar/{{hash}} 2x" alt="Description" />
- ```

  ```

-
- @element IMG
- @param {template} ngSrcset any string which can contain `{{}}` markup.
  \*/

/\*\*

- @ngdoc directive
- @name ngDisabled
- @restrict A
- @priority 100
-
- @description
-
- This directive sets the `disabled` attribute on the element (typically a form control,
- e.g. `input`, `button`, `select` etc.) if the
- {@link guide/expression expression} inside `ngDisabled` evaluates to truthy.
-
- A special directive is necessary because we cannot use interpolation inside the `disabled`
- attribute. See the {@link guide/interpolation interpolation guide} for more info.
-
- @param {string} ngDisabled If the {@link guide/expression expression} is truthy,
-     then the `disabled` attribute will be set on the element
  \*/

/\*\*

- @ngdoc directive
- @name ngChecked
- @restrict A
- @priority 100
-
- @description
- Sets the `checked` attribute on the element, if the expression inside `ngChecked` is truthy.
-
- Note that this directive should not be used together with {@link ngModel `ngModel`},
- as this can lead to unexpected behavior.
-
- A special directive is necessary because we cannot use interpolation inside the `checked`
- attribute. See the {@link guide/interpolation interpolation guide} for more info.
-
- @element INPUT
- @param {string} ngChecked If the {@link guide/expression expression} is truthy,
-     then the `checked` attribute will be set on the element
  \*/

/\*\*

-
- @description
-
- Sets the `readonly` attribute on the element, if the expression inside `ngReadonly` is truthy.
- Note that `readonly` applies only to `input` elements with specific types. [See the input docs on
- MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-readonly) for more information.
-
- A special directive is necessary because we cannot use interpolation inside the `readonly`
- attribute. See the {@link guide/interpolation interpolation guide} for more info.
- @element INPUT
- @param {string} ngReadonly If the {@link guide/expression expression} is truthy,
-     then special attribute "readonly" will be set on the element
  \*/

/\*\*

- @ngdoc directive
- @name ngSelected
- @restrict A
- @priority 100
-
- @description
-
- Sets the `selected` attribute on the element, if the expression inside `ngSelected` is truthy.
-
- A special directive is necessary because we cannot use interpolation inside the `selected`
- attribute. See the {@link guide/interpolation interpolation guide} for more info.
-
- <div class="alert alert-warning">
- **Note:** `ngSelected` does not interact with the `select` and `ngModel` directives, it only
- sets the `selected` attribute on the element. If you are using `ngModel` on the select, you
- should not use `ngSelected` on the options, as `ngModel` will set the select value and
- selected options.
- </div>
- @element OPTION
- @param {string} ngSelected If the {@link guide/expression expression} is truthy,
-     then special attribute "selected" will be set on the element
  \*/

/\*\*

- @ngdoc directive
- @name ngOpen
- @restrict A
- @priority 100
-
- @description
-
- Sets the `open` attribute on the element, if the expression inside `ngOpen` is truthy.
-
- A special directive is necessary because we cannot use interpolation inside the `open`
- attribute. See the {@link guide/interpolation interpolation guide} for more info.
-
- ## A note about browser compatibility
-
- Internet Explorer and Edge do not support the `details` element, it is
- recommended to use {@link ng.ngShow} and {@link ng.ngHide} instead.
-
- @element DETAILS
- @param {string} ngOpen If the {@link guide/expression expression} is truthy,
-     then special attribute "open" will be set on the element
  \*/
