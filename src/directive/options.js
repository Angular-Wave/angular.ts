import { jqLite, jqLiteRemove, startingTag } from "../jqLite";
import {
  equals,
  forEach,
  hashKey,
  includes,
  isArrayLike,
  isDefined,
  minErr,
} from "../shared/utils";

const ngOptionsMinErr = minErr("ngOptions");

/**
 * @ngdoc directive
 * @name ngOptions
 * @restrict A
 *
 * @description
 *
 * The `ngOptions` attribute can be used to dynamically generate a list of `<option>`
 * elements for the `<select>` element using the array or object obtained by evaluating the
 * `ngOptions` comprehension expression.
 *
 * In many cases, {@link ng.directive:ngRepeat ngRepeat} can be used on `<option>` elements instead of
 * `ngOptions` to achieve a similar result. However, `ngOptions` provides some benefits:
 * - more flexibility in how the `<select>`'s model is assigned via the `select` **`as`** part of the
 * comprehension expression
 * - reduced memory consumption by not creating a new scope for each repeated instance
 * - increased render speed by creating the options in a documentFragment instead of individually
 *
 * When an item in the `<select>` menu is selected, the array element or object property
 * represented by the selected option will be bound to the model identified by the `ngModel`
 * directive.
 *
 * Optionally, a single hard-coded `<option>` element, with the value set to an empty string, can
 * be nested into the `<select>` element. This element will then represent the `null` or "not selected"
 * option. See example below for demonstration.
 *
 * ## Complex Models (objects or collections)
 *
 * By default, `ngModel` watches the model by reference, not value. This is important to know when
 * binding the select to a model that is an object or a collection.
 *
 * One issue occurs if you want to preselect an option. For example, if you set
 * the model to an object that is equal to an object in your collection, `ngOptions` won't be able to set the selection,
 * because the objects are not identical. So by default, you should always reference the item in your collection
 * for preselections, e.g.: `$scope.selected = $scope.collection[3]`.
 *
 * Another solution is to use a `track by` clause, because then `ngOptions` will track the identity
 * of the item not by reference, but by the result of the `track by` expression. For example, if your
 * collection items have an id property, you would `track by item.id`.
 *
 * A different issue with objects or collections is that ngModel won't detect if an object property or
 * a collection item changes. For that reason, `ngOptions` additionally watches the model using
 * `$watchCollection`, when the expression contains a `track by` clause or the the select has the `multiple` attribute.
 * This allows ngOptions to trigger a re-rendering of the options even if the actual object/collection
 * has not changed identity, but only a property on the object or an item in the collection changes.
 *
 * Note that `$watchCollection` does a shallow comparison of the properties of the object (or the items in the collection
 * if the model is an array). This means that changing a property deeper than the first level inside the
 * object/collection will not trigger a re-rendering.
 *
 * ## `select` **`as`**
 *
 * Using `select` **`as`** will bind the result of the `select` expression to the model, but
 * the value of the `<select>` and `<option>` html elements will be either the index (for array data sources)
 * or property name (for object data sources) of the value within the collection. If a **`track by`** expression
 * is used, the result of that expression will be set as the value of the `option` and `select` elements.
 *
 *
 * ### `select` **`as`** and **`track by`**
 *
 * <div class="alert alert-warning">
 * Be careful when using `select` **`as`** and **`track by`** in the same expression.
 * </div>
 *
 * Given this array of items on the $scope:
 *
 * ```js
 * $scope.items = [{
 *   id: 1,
 *   label: 'aLabel',
 *   subItem: { name: 'aSubItem' }
 * }, {
 *   id: 2,
 *   label: 'bLabel',
 *   subItem: { name: 'bSubItem' }
 * }];
 * ```
 *
 * This will work:
 *
 * ```html
 * <select ng-options="item as item.label for item in items track by item.id" ng-model="selected"></select>
 * ```
 * ```js
 * $scope.selected = $scope.items[0];
 * ```
 *
 * but this will not work:
 *
 * ```html
 * <select ng-options="item.subItem as item.label for item in items track by item.id" ng-model="selected"></select>
 * ```
 * ```js
 * $scope.selected = $scope.items[0].subItem;
 * ```
 *
 * In both examples, the **`track by`** expression is applied successfully to each `item` in the
 * `items` array. Because the selected option has been set programmatically in the controller, the
 * **`track by`** expression is also applied to the `ngModel` value. In the first example, the
 * `ngModel` value is `items[0]` and the **`track by`** expression evaluates to `items[0].id` with
 * no issue. In the second example, the `ngModel` value is `items[0].subItem` and the **`track by`**
 * expression evaluates to `items[0].subItem.id` (which is undefined). As a result, the model value
 * is not matched against any `<option>` and the `<select>` appears as having no selected value.
 *
 *
 * @param {string} ngModel Assignable AngularJS expression to data-bind to.
 * @param {comprehension_expression} ngOptions in one of the following forms:
 *
 *   * for array data sources:
 *     * `label` **`for`** `value` **`in`** `array`
 *     * `select` **`as`** `label` **`for`** `value` **`in`** `array`
 *     * `label` **`group by`** `group` **`for`** `value` **`in`** `array`
 *     * `label` **`disable when`** `disable` **`for`** `value` **`in`** `array`
 *     * `label` **`group by`** `group` **`for`** `value` **`in`** `array` **`track by`** `trackexpr`
 *     * `label` **`disable when`** `disable` **`for`** `value` **`in`** `array` **`track by`** `trackexpr`
 *     * `label` **`for`** `value` **`in`** `array` | orderBy:`orderexpr` **`track by`** `trackexpr`
 *        (for including a filter with `track by`)
 *   * for object data sources:
 *     * `label` **`for (`**`key` **`,`** `value`**`) in`** `object`
 *     * `select` **`as`** `label` **`for (`**`key` **`,`** `value`**`) in`** `object`
 *     * `label` **`group by`** `group` **`for (`**`key`**`,`** `value`**`) in`** `object`
 *     * `label` **`disable when`** `disable` **`for (`**`key`**`,`** `value`**`) in`** `object`
 *     * `select` **`as`** `label` **`group by`** `group`
 *         **`for` `(`**`key`**`,`** `value`**`) in`** `object`
 *     * `select` **`as`** `label` **`disable when`** `disable`
 *         **`for` `(`**`key`**`,`** `value`**`) in`** `object`
 *
 * Where:
 *
 *   * `array` / `object`: an expression which evaluates to an array / object to iterate over.
 *   * `value`: local variable which will refer to each item in the `array` or each property value
 *      of `object` during iteration.
 *   * `key`: local variable which will refer to a property name in `object` during iteration.
 *   * `label`: The result of this expression will be the label for `<option>` element. The
 *     `expression` will most likely refer to the `value` variable (e.g. `value.propertyName`).
 *   * `select`: The result of this expression will be bound to the model of the parent `<select>`
 *      element. If not specified, `select` expression will default to `value`.
 *   * `group`: The result of this expression will be used to group options using the `<optgroup>`
 *      DOM element.
 *   * `disable`: The result of this expression will be used to disable the rendered `<option>`
 *      element. Return `true` to disable.
 *   * `trackexpr`: Used when working with an array of objects. The result of this expression will be
 *      used to identify the objects in the array. The `trackexpr` will most likely refer to the
 *     `value` variable (e.g. `value.propertyName`). With this the selection is preserved
 *      even when the options are recreated (e.g. reloaded from the server).
 * @param {string=} name Property name of the form under which the control is published.
 * @param {string=} required The control is considered valid only if value is entered.
 * @param {string=} ngRequired Adds `required` attribute and `required` validation constraint to
 *    the element when the ngRequired expression evaluates to true. Use `ngRequired` instead of
 *    `required` when you want to data-bind to the `required` attribute.
 * @param {string=} ngAttrSize sets the size of the select element dynamically. Uses the
 * {@link guide/interpolation#-ngattr-for-binding-to-arbitrary-attributes ngAttr} directive.
 *
 */

const NG_OPTIONS_REGEXP =
  /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?(?:\s+disable\s+when\s+([\s\S]+?))?\s+for\s+(?:([$\w][$\w]*)|(?:\(\s*([$\w][$\w]*)\s*,\s*([$\w][$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;
// 1: value expression (valueFn)
// 2: label expression (displayFn)
// 3: group by expression (groupByFn)
// 4: disable when expression (disableWhenFn)
// 5: array item variable name
// 6: object item key variable name
// 7: object item value variable name
// 8: collection expression
// 9: track by expression

export const ngOptionsDirective = [
  "$compile",
  "$document",
  "$parse",
  function ($compile, $document, $parse) {
    function parseOptionsExpression(optionsExp, selectElement, scope) {
      const match = optionsExp.match(NG_OPTIONS_REGEXP);
      if (!match) {
        throw ngOptionsMinErr(
          "iexp",
          "Expected expression in form of " +
            "'_select_ (as _label_)? for (_key_,)?_value_ in _collection_'" +
            " but got '{0}'. Element: {1}",
          optionsExp,
          startingTag(selectElement),
        );
      }

      // Extract the parts from the ngOptions expression

      // The variable name for the value of the item in the collection
      const valueName = match[5] || match[7];
      // The variable name for the key of the item in the collection
      const keyName = match[6];

      // An expression that generates the viewValue for an option if there is a label expression
      const selectAs = / as /.test(match[0]) && match[1];
      // An expression that is used to track the id of each object in the options collection
      const trackBy = match[9];
      // An expression that generates the viewValue for an option if there is no label expression
      const valueFn = $parse(match[2] ? match[1] : valueName);
      const selectAsFn = selectAs && $parse(selectAs);
      const viewValueFn = selectAsFn || valueFn;
      const trackByFn = trackBy && $parse(trackBy);

      // Get the value by which we are going to track the option
      // if we have a trackFn then use that (passing scope and locals)
      // otherwise just hash the given viewValue
      const getTrackByValueFn = trackBy
        ? function (value, locals) {
            return trackByFn(scope, locals);
          }
        : function getHashOfValue(value) {
            return hashKey(value);
          };
      const getTrackByValue = function (value, key) {
        return getTrackByValueFn(value, getLocals(value, key));
      };

      const displayFn = $parse(match[2] || match[1]);
      const groupByFn = $parse(match[3] || "");
      const disableWhenFn = $parse(match[4] || "");
      const valuesFn = $parse(match[8]);

      const locals = {};
      let getLocals = keyName
        ? function (value, key) {
            locals[keyName] = key;
            locals[valueName] = value;
            return locals;
          }
        : function (value) {
            locals[valueName] = value;
            return locals;
          };

      function Option(selectValue, viewValue, label, group, disabled) {
        this.selectValue = selectValue;
        this.viewValue = viewValue;
        this.label = label;
        this.group = group;
        this.disabled = disabled;
      }

      function getOptionValuesKeys(optionValues) {
        let optionValuesKeys;

        if (!keyName && isArrayLike(optionValues)) {
          optionValuesKeys = optionValues;
        } else {
          // if object, extract keys, in enumeration order, unsorted
          optionValuesKeys = [];
          for (const itemKey in optionValues) {
            if (
              Object.prototype.hasOwnProperty.call(optionValues, itemKey) &&
              itemKey.charAt(0) !== "$"
            ) {
              optionValuesKeys.push(itemKey);
            }
          }
        }
        return optionValuesKeys;
      }

      return {
        trackBy,
        getTrackByValue,
        getWatchables: $parse(valuesFn, (optionValues) => {
          // Create a collection of things that we would like to watch (watchedArray)
          // so that they can all be watched using a single $watchCollection
          // that only runs the handler once if anything changes
          const watchedArray = [];
          optionValues = optionValues || [];

          const optionValuesKeys = getOptionValuesKeys(optionValues);
          const optionValuesLength = optionValuesKeys.length;
          for (let index = 0; index < optionValuesLength; index++) {
            const key =
              optionValues === optionValuesKeys
                ? index
                : optionValuesKeys[index];
            const value = optionValues[key];

            const locals = getLocals(value, key);
            const selectValue = getTrackByValueFn(value, locals);
            watchedArray.push(selectValue);

            // Only need to watch the displayFn if there is a specific label expression
            if (match[2] || match[1]) {
              const label = displayFn(scope, locals);
              watchedArray.push(label);
            }

            // Only need to watch the disableWhenFn if there is a specific disable expression
            if (match[4]) {
              const disableWhen = disableWhenFn(scope, locals);
              watchedArray.push(disableWhen);
            }
          }
          return watchedArray;
        }),

        getOptions() {
          const optionItems = [];
          const selectValueMap = {};

          // The option values were already computed in the `getWatchables` fn,
          // which must have been called to trigger `getOptions`
          const optionValues = valuesFn(scope) || [];
          const optionValuesKeys = getOptionValuesKeys(optionValues);
          const optionValuesLength = optionValuesKeys.length;

          for (let index = 0; index < optionValuesLength; index++) {
            const key =
              optionValues === optionValuesKeys
                ? index
                : optionValuesKeys[index];
            const value = optionValues[key];
            const locals = getLocals(value, key);
            const viewValue = viewValueFn(scope, locals);
            const selectValue = getTrackByValueFn(viewValue, locals);
            const label = displayFn(scope, locals);
            const group = groupByFn(scope, locals);
            const disabled = disableWhenFn(scope, locals);
            const optionItem = new Option(
              selectValue,
              viewValue,
              label,
              group,
              disabled,
            );

            optionItems.push(optionItem);
            selectValueMap[selectValue] = optionItem;
          }

          return {
            items: optionItems,
            selectValueMap,
            getOptionFromViewValue(value) {
              return selectValueMap[getTrackByValue(value)];
            },
            getViewValueFromOption(option) {
              // If the viewValue could be an object that may be mutated by the application,
              // we need to make a copy and not return the reference to the value on the option.
              return trackBy
                ? structuredClone(option.viewValue)
                : option.viewValue;
            },
          };
        },
      };
    }

    // Support: IE 9 only
    // We can't just jqLite('<option>') since jqLite is not smart enough
    // to create it in <select> and IE barfs otherwise.
    const optionTemplate = window.document.createElement("option");
    const optGroupTemplate = window.document.createElement("optgroup");

    function ngOptionsPostLink(scope, selectElement, attr, ctrls) {
      const selectCtrl = ctrls[0];
      const ngModelCtrl = ctrls[1];
      const { multiple } = attr;

      const children = selectElement.childNodes;

      // The emptyOption allows the application developer to provide their own custom "empty"
      // option when the viewValue does not match any of the option values.
      for (let i = 0, ii = children.length; i < ii; i++) {
        if (children[i].value === "") {
          selectCtrl.hasEmptyOption = true;
          selectCtrl.emptyOption = children[i];
          break;
        }
      }

      // The empty option will be compiled and rendered before we first generate the options
      selectElement.empty();

      const providedEmptyOption = !!selectCtrl.emptyOption;

      const unknownOption = jqLite(optionTemplate.cloneNode(false));
      unknownOption.val("?");

      let options;
      const ngOptions = parseOptionsExpression(
        attr.ngOptions,
        selectElement,
        scope,
      );
      // This stores the newly created options before they are appended to the select.
      // Since the contents are removed from the fragment when it is appended,
      // we only need to create it once.
      const listFragment = $document[0].createDocumentFragment();

      // Overwrite the implementation. ngOptions doesn't use hashes
      selectCtrl.generateUnknownOptionValue = () => "?";

      // Update the controller methods for multiple selectable options
      if (!multiple) {
        selectCtrl.writeValue = function writeNgOptionsValue(value) {
          // The options might not be defined yet when ngModel tries to render
          if (!options) return;

          const selectedOption =
            selectElement[0].options[selectElement[0].selectedIndex];
          const option = options.getOptionFromViewValue(value);

          // Make sure to remove the selected attribute from the previously selected option
          // Otherwise, screen readers might get confused
          if (selectedOption) selectedOption.removeAttribute("selected");

          if (option) {
            // Don't update the option when it is already selected.
            // For example, the browser will select the first option by default. In that case,
            // most properties are set automatically - except the `selected` attribute, which we
            // set always

            if (selectElement[0].value !== option.selectValue) {
              selectCtrl.removeUnknownOption();

              selectElement[0].value = option.selectValue;
              option.element.selected = true;
            }

            option.element.setAttribute("selected", "selected");
          } else {
            selectCtrl.selectUnknownOrEmptyOption(value);
          }
        };

        selectCtrl.readValue = function readNgOptionsValue() {
          const selectedOption = options.selectValueMap[selectElement.val()];

          if (selectedOption && !selectedOption.disabled) {
            selectCtrl.unselectEmptyOption();
            selectCtrl.removeUnknownOption();
            return options.getViewValueFromOption(selectedOption);
          }
          return null;
        };

        // If we are using `track by` then we must watch the tracked value on the model
        // since ngModel only watches for object identity change
        // FIXME: When a user selects an option, this watch will fire needlessly
        if (ngOptions.trackBy) {
          scope.$watch(
            () => ngOptions.getTrackByValue(ngModelCtrl.$viewValue),
            () => {
              ngModelCtrl.$render();
            },
          );
        }
      } else {
        selectCtrl.writeValue = function writeNgOptionsMultiple(values) {
          // The options might not be defined yet when ngModel tries to render
          if (!options) return;

          // Only set `<option>.selected` if necessary, in order to prevent some browsers from
          // scrolling to `<option>` elements that are outside the `<select>` element's viewport.
          const selectedOptions =
            (values && values.map(getAndUpdateSelectedOption)) || [];

          options.items.forEach((option) => {
            if (option.element.selected && !includes(selectedOptions, option)) {
              option.element.selected = false;
            }
          });
        };

        selectCtrl.readValue = function readNgOptionsMultiple() {
          const selectedValues = selectElement.val() || [];
          const selections = [];

          forEach(selectedValues, (value) => {
            const option = options.selectValueMap[value];
            if (option && !option.disabled)
              selections.push(options.getViewValueFromOption(option));
          });

          return selections;
        };

        // If we are using `track by` then we must watch these tracked values on the model
        // since ngModel only watches for object identity change
        if (ngOptions.trackBy) {
          scope.$watchCollection(
            () => {
              if (Array.isArray(ngModelCtrl.$viewValue)) {
                return ngModelCtrl.$viewValue.map((value) =>
                  ngOptions.getTrackByValue(value),
                );
              }
            },
            () => {
              ngModelCtrl.$render();
            },
          );
        }
      }

      if (providedEmptyOption) {
        // compile the element since there might be bindings in it
        $compile(selectCtrl.emptyOption)(scope);

        selectElement.prepend(selectCtrl.emptyOption);

        if (selectCtrl.emptyOption[0].nodeType === Node.COMMENT_NODE) {
          // This means the empty option has currently no actual DOM node, probably because
          // it has been modified by a transclusion directive.
          selectCtrl.hasEmptyOption = false;

          // Redefine the registerOption function, which will catch
          // options that are added by ngIf etc. (rendering of the node is async because of
          // lazy transclusion)
          selectCtrl.registerOption = function (optionScope, optionEl) {
            if (optionEl.val() === "") {
              selectCtrl.hasEmptyOption = true;
              selectCtrl.emptyOption = optionEl;
              // This ensures the new empty option is selected if previously no option was selected
              ngModelCtrl.$render();

              optionEl.on("$destroy", () => {
                const needsRerender = selectCtrl.$isEmptyOptionSelected();

                selectCtrl.hasEmptyOption = false;
                selectCtrl.emptyOption = undefined;

                if (needsRerender) ngModelCtrl.$render();
              });
            }
          };
        }
      }

      // We will re-render the option elements if the option values or labels change
      scope.$watchCollection(ngOptions.getWatchables, updateOptions);

      // ------------------------------------------------------------------ //

      function addOptionElement(option, parent) {
        const optionElement = optionTemplate.cloneNode(false);
        parent.appendChild(optionElement);
        updateOptionElement(option, optionElement);
      }

      function getAndUpdateSelectedOption(viewValue) {
        const option = options.getOptionFromViewValue(viewValue);
        const element = option && option.element;

        if (element && !element.selected) element.selected = true;

        return option;
      }

      function updateOptionElement(option, element) {
        option.element = element;
        element.disabled = option.disabled;
        // Support: IE 11 only, Edge 12-13 only
        // NOTE: The label must be set before the value, otherwise IE 11 & Edge create unresponsive
        // selects in certain circumstances when multiple selects are next to each other and display
        // the option list in listbox style, i.e. the select is [multiple], or specifies a [size].
        // See https://github.com/angular/angular.js/issues/11314 for more info.
        // This is unfortunately untestable with unit / e2e tests
        if (option.label !== element.label) {
          element.label = option.label;
          element.textContent = option.label;
        }
        element.value = option.selectValue;
      }

      function updateOptions() {
        const previousValue = options && selectCtrl.readValue();

        // We must remove all current options, but cannot simply set innerHTML = null
        // since the providedEmptyOption might have an ngIf on it that inserts comments which we
        // must preserve.
        // Instead, iterate over the current option elements and remove them or their optgroup
        // parents
        if (options) {
          for (let i = options.items.length - 1; i >= 0; i--) {
            const option = options.items[i];
            if (isDefined(option.group)) {
              jqLiteRemove(option.element.parentNode);
            } else {
              jqLiteRemove(option.element);
            }
          }
        }

        options = ngOptions.getOptions();

        const groupElementMap = {};

        options.items.forEach((option) => {
          let groupElement;

          if (isDefined(option.group)) {
            // This option is to live in a group
            // See if we have already created this group
            groupElement = groupElementMap[option.group];

            if (!groupElement) {
              groupElement = optGroupTemplate.cloneNode(false);
              listFragment.appendChild(groupElement);

              // Update the label on the group element
              // "null" is special cased because of Safari
              groupElement.label =
                option.group === null ? "null" : option.group;

              // Store it for use later
              groupElementMap[option.group] = groupElement;
            }

            addOptionElement(option, groupElement);
          } else {
            // This option is not in a group
            addOptionElement(option, listFragment);
          }
        });

        selectElement[0].appendChild(listFragment);

        ngModelCtrl.$render();

        // Check to see if the value has changed due to the update to the options
        if (!ngModelCtrl.$isEmpty(previousValue)) {
          const nextValue = selectCtrl.readValue();
          const isNotPrimitive = ngOptions.trackBy || multiple;
          if (
            isNotPrimitive
              ? !equals(previousValue, nextValue)
              : previousValue !== nextValue
          ) {
            ngModelCtrl.$setViewValue(nextValue);
            ngModelCtrl.$render();
          }
        }
      }
    }

    return {
      restrict: "A",
      terminal: true,
      require: ["select", "ngModel"],
      link: {
        pre: function ngOptionsPreLink(scope, selectElement, attr, ctrls) {
          // Deactivate the SelectController.register method to prevent
          // option directives from accidentally registering themselves
          // (and unwanted $destroy handlers etc.)
          ctrls[0].registerOption = () => {};
        },
        post: ngOptionsPostLink,
      },
    };
  },
];
