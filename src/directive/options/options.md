/\*\*

-
- The `ngOptions` attribute can be used to dynamically generate a list of `<option>`
- elements for the `<select>` element using the array or object obtained by evaluating the
- `ngOptions` comprehension expression.
-
- In many cases, {@link ng.directive:ngRepeat ngRepeat} can be used on `<option>` elements instead of
- `ngOptions` to achieve a similar result. However, `ngOptions` provides some benefits:
- - more flexibility in how the `<select>`'s model is assigned via the `select` **`as`** part of the
- comprehension expression
- - reduced memory consumption by not creating a new scope for each repeated instance
- - increased render speed by creating the options in a documentFragment instead of individually
-
- When an item in the `<select>` menu is selected, the array element or object property
- represented by the selected option will be bound to the model identified by the `ngModel`
- directive.
-
- Optionally, a single hard-coded `<option>` element, with the value set to an empty string, can
- be nested into the `<select>` element. This element will then represent the `null` or "not selected"
- option. See example below for demonstration.
-
- ## Complex Models (objects or collections)
-
- By default, `ngModel` watches the model by reference, not value. This is important to know when
- binding the select to a model that is an object or a collection.
-
- One issue occurs if you want to preselect an option. For example, if you set
- the model to an object that is equal to an object in your collection, `ngOptions` won't be able to set the selection,
- because the objects are not identical. So by default, you should always reference the item in your collection
- for preselections, e.g.: `$scope.selected = $scope.collection[3]`.
-
- Another solution is to use a `track by` clause, because then `ngOptions` will track the identity
- of the item not by reference, but by the result of the `track by` expression. For example, if your
- collection items have an id property, you would `track by item.id`.
-
- A different issue with objects or collections is that ngModel won't detect if an object property or
- a collection item changes. For that reason, `ngOptions` additionally watches the model using
- `$watchCollection`, when the expression contains a `track by` clause or the the select has the `multiple` attribute.
- This allows ngOptions to trigger a re-rendering of the options even if the actual object/collection
- has not changed identity, but only a property on the object or an item in the collection changes.
-
- Note that `$watchCollection` does a shallow comparison of the properties of the object (or the items in the collection
- if the model is an array). This means that changing a property deeper than the first level inside the
- object/collection will not trigger a re-rendering.
-
- ## `select` **`as`**
-
- Using `select` **`as`** will bind the result of the `select` expression to the model, but
- the value of the `<select>` and `<option>` html elements will be either the index (for array data sources)
- or property name (for object data sources) of the value within the collection. If a **`track by`** expression
- is used, the result of that expression will be set as the value of the `option` and `select` elements.
-
-
- ### `select` **`as`** and **`track by`**
-
- <div class="alert alert-warning">
- Be careful when using `select` **`as`** and **`track by`** in the same expression.
- </div>
-
- Given this array of items on the $scope:
-
- ```js

  ```
- $scope.items = [{
- id: 1,
- label: 'aLabel',
- subItem: { name: 'aSubItem' }
- }, {
- id: 2,
- label: 'bLabel',
- subItem: { name: 'bSubItem' }
- }];
- ```

  ```
-
- This will work:
-
- ```html

  ```
- <select ng-options="item as item.label for item in items track by item.id" ng-model="selected"></select>
- ```

  ```
- ```js

  ```
- $scope.selected = $scope.items[0];
- ```

  ```
-
- but this will not work:
-
- ```html

  ```
- <select ng-options="item.subItem as item.label for item in items track by item.id" ng-model="selected"></select>
- ```

  ```
- ```js

  ```
- $scope.selected = $scope.items[0].subItem;
- ```

  ```
-
- In both examples, the **`track by`** expression is applied successfully to each `item` in the
- `items` array. Because the selected option has been set programmatically in the controller, the
- **`track by`** expression is also applied to the `ngModel` value. In the first example, the
- `ngModel` value is `items[0]` and the **`track by`** expression evaluates to `items[0].id` with
- no issue. In the second example, the `ngModel` value is `items[0].subItem` and the **`track by`**
- expression evaluates to `items[0].subItem.id` (which is undefined). As a result, the model value
- is not matched against any `<option>` and the `<select>` appears as having no selected value.
-
-
- @param {string} ngModel Assignable AngularJS expression to data-bind to.
- @param {string} ngOptions in one of the following forms:
-
- - for array data sources:
-     * `label` **`for`** `value` **`in`** `array`
-     * `select` **`as`** `label` **`for`** `value` **`in`** `array`
-     * `label` **`group by`** `group` **`for`** `value` **`in`** `array`
-     * `label` **`disable when`** `disable` **`for`** `value` **`in`** `array`
-     * `label` **`group by`** `group` **`for`** `value` **`in`** `array` **`track by`** `trackexpr`
-     * `label` **`disable when`** `disable` **`for`** `value` **`in`** `array` **`track by`** `trackexpr`
-     * `label` **`for`** `value` **`in`** `array` | orderBy:`orderexpr` **`track by`** `trackexpr`
-        (for including a filter with `track by`)
- - for object data sources:
-     * `label` **`for (`**`key` **`,`** `value`**`) in`** `object`
-     * `select` **`as`** `label` **`for (`**`key` **`,`** `value`**`) in`** `object`
-     * `label` **`group by`** `group` **`for (`**`key`**`,`** `value`**`) in`** `object`
-     * `label` **`disable when`** `disable` **`for (`**`key`**`,`** `value`**`) in`** `object`
-     * `select` **`as`** `label` **`group by`** `group`
-         **`for` `(`**`key`**`,`** `value`**`) in`** `object`
-     * `select` **`as`** `label` **`disable when`** `disable`
-         **`for` `(`**`key`**`,`** `value`**`) in`** `object`
-
- Where:
-
- - `array` / `object`: an expression which evaluates to an array / object to iterate over.
- - `value`: local variable which will refer to each item in the `array` or each property value
-      of `object` during iteration.
- - `key`: local variable which will refer to a property name in `object` during iteration.
- - `label`: The result of this expression will be the label for `<option>` element. The
-     `expression` will most likely refer to the `value` variable (e.g. `value.propertyName`).
- - `select`: The result of this expression will be bound to the model of the parent `<select>`
-      element. If not specified, `select` expression will default to `value`.
- - `group`: The result of this expression will be used to group options using the `<optgroup>`
-      DOM element.
- - `disable`: The result of this expression will be used to disable the rendered `<option>`
-      element. Return `true` to disable.
- - `trackexpr`: Used when working with an array of objects. The result of this expression will be
-      used to identify the objects in the array. The `trackexpr` will most likely refer to the
-     `value` variable (e.g. `value.propertyName`). With this the selection is preserved
-      even when the options are recreated (e.g. reloaded from the server).
- @param {string=} name Property name of the form under which the control is published.
- @param {string=} required The control is considered valid only if value is entered.
- @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
- the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
- `required` when you want to data-bind to the `required` attribute.
- @param {string=} ngAttrSize sets the size of the select element dynamically. Uses the
- {@link guide/interpolation#-ngattr-for-binding-to-arbitrary-attributes ngAttr} directive.
- \*/
