import {
  hasCustomToString,
  isArray,
  isFunction,
  isObject,
  isArrayLike,
  isString,
  minErr,
  identity,
} from "../core/utils";

/**
 *
 * @description
 * Returns an array containing the items from the specified `collection`, ordered by a `comparator`
 * function based on the values computed using the `expression` predicate.
 *
 * For example, `[{id: 'foo'}, {id: 'bar'}] | orderBy:'id'` would result in
 * `[{id: 'bar'}, {id: 'foo'}]`.
 *
 * The `collection` can be an Array or array-like object (e.g. NodeList, jQuery object, TypedArray,
 * String, etc).
 *
 * The `expression` can be a single predicate, or a list of predicates each serving as a tie-breaker
 * for the preceding one. The `expression` is evaluated against each item and the output is used
 * for comparing with other items.
 *
 * You can change the sorting order by setting `reverse` to `true`. By default, items are sorted in
 * ascending order.
 *
 * The comparison is done using the `comparator` function. If none is specified, a default, built-in
 * comparator is used (see below for details - in a nutshell, it compares numbers numerically and
 * strings alphabetically).
 *
 * ### Under the hood
 *
 * Ordering the specified `collection` happens in two phases:
 *
 * 1. All items are passed through the predicate (or predicates), and the returned values are saved
 *    along with their type (`string`, `number` etc). For example, an item `{label: 'foo'}`, passed
 *    through a predicate that extracts the value of the `label` property, would be transformed to:
 *    ```
 *    {
 *      value: 'foo',
 *      type: 'string',
 *      index: ...
 *    }
 *    ```
 *    **Note:** `null` values use `'null'` as their type.
 * 2. The comparator function is used to sort the items, based on the derived values, types and
 *    indices.
 *
 * If you use a custom comparator, it will be called with pairs of objects of the form
 * `{value: ..., type: '...', index: ...}` and is expected to return `0` if the objects are equal
 * (as far as the comparator is concerned), `-1` if the 1st one should be ranked higher than the
 * second, or `1` otherwise.
 *
 * In order to ensure that the sorting will be deterministic across platforms, if none of the
 * specified predicates can distinguish between two items, `orderBy` will automatically introduce a
 * dummy predicate that returns the item's index as `value`.
 * (If you are using a custom comparator, make sure it can handle this predicate as well.)
 *
 * If a custom comparator still can't distinguish between two items, then they will be sorted based
 * on their index using the built-in comparator.
 *
 * Finally, in an attempt to simplify things, if a predicate returns an object as the extracted
 * value for an item, `orderBy` will try to convert that object to a primitive value, before passing
 * it to the comparator. The following rules govern the conversion:
 *
 * 1. If the object has a `valueOf()` method that returns a primitive, its return value will be
 *    used instead.<br />
 *    (If the object has a `valueOf()` method that returns another object, then the returned object
 *    will be used in subsequent steps.)
 * 2. If the object has a custom `toString()` method (i.e. not the one inherited from `Object`) that
 *    returns a primitive, its return value will be used instead.<br />
 *    (If the object has a `toString()` method that returns another object, then the returned object
 *    will be used in subsequent steps.)
 * 3. No conversion; the object itself is used.
 *
 * ### The default comparator
 *
 * The default, built-in comparator should be sufficient for most usecases. In short, it compares
 * numbers numerically, strings alphabetically (and case-insensitively), for objects falls back to
 * using their index in the original collection, sorts values of different types by type and puts
 * `undefined` and `null` values at the end of the sorted list.
 *
 * More specifically, it follows these steps to determine the relative order of items:
 *
 * 1. If the compared values are of different types:
 *    - If one of the values is undefined, consider it "greater than" the other.
 *    - Else if one of the values is null, consider it "greater than" the other.
 *    - Else compare the types themselves alphabetically.
 * 2. If both values are of type `string`, compare them alphabetically in a case- and
 *    locale-insensitive way.
 * 3. If both values are objects, compare their indices instead.
 * 4. Otherwise, return:
 *    -  `0`, if the values are equal (by strict equality comparison, i.e. using `===`).
 *    - `-1`, if the 1st value is "less than" the 2nd value (compared using the `<` operator).
 *    -  `1`, otherwise.
 *
 * **Note:** If you notice numbers not being sorted as expected, make sure they are actually being
 *           saved as numbers and not strings.
 * **Note:** For the purpose of sorting, `null` and `undefined` are considered "greater than"
 *           any other value (with undefined "greater than" null). This effectively means that `null`
 *           and `undefined` values end up at the end of a list sorted in ascending order.
 * **Note:** `null` values use `'null'` as their type to be able to distinguish them from objects.
 *
 * @param {Array|ArrayLike} collection - The collection (array or array-like object) to sort.
 * @param {(Function|string|Array.<Function|string>)=} expression - A predicate (or list of
 *    predicates) to be used by the comparator to determine the order of elements.
 *
 *    Can be one of:
 *
 *    - `Function`: A getter function. This function will be called with each item as argument and
 *      the return value will be used for sorting.
 *    - `string`: An AngularJS expression. This expression will be evaluated against each item and the
 *      result will be used for sorting. For example, use `'label'` to sort by a property called
 *      `label` or `'label.substring(0, 3)'` to sort by the first 3 characters of the `label`
 *      property.<br />
 *      (The result of a constant expression is interpreted as a property name to be used for
 *      comparison. For example, use `'"special name"'` (note the extra pair of quotes) to sort by a
 *      property called `special name`.)<br />
 *      An expression can be optionally prefixed with `+` or `-` to control the sorting direction,
 *      ascending or descending. For example, `'+label'` or `'-label'`. If no property is provided,
 *      (e.g. `'+'` or `'-'`), the collection element itself is used in comparisons.
 *    - `Array`: An array of function and/or string predicates. If a predicate cannot determine the
 *      relative order of two items, the next predicate is used as a tie-breaker.
 *
 * **Note:** If the predicate is missing or empty then it defaults to `'+'`.
 *
 * @param {boolean=} reverse - If `true`, reverse the sorting order.
 * @param {(Function)=} comparator - The comparator function used to determine the relative order of
 *    value pairs. If omitted, the built-in comparator will be used.
 *
 * @returns {Array} - The sorted array.
 *
 */
orderByFilter.$inject = ["$parse"];
export function orderByFilter($parse) {
  return function (array, sortPredicate, reverseOrder, compareFn) {
    if (array == null) return array;
    if (!isArrayLike(array)) {
      throw minErr("orderBy")(
        "notarray",
        "Expected array but received: {0}",
        array,
      );
    }

    if (!isArray(sortPredicate)) {
      sortPredicate = [sortPredicate];
    }
    if (sortPredicate.length === 0) {
      sortPredicate = ["+"];
    }

    const predicates = processPredicates(sortPredicate);

    const descending = reverseOrder ? -1 : 1;

    // Define the `compare()` function. Use a default comparator if none is specified.
    const compare = isFunction(compareFn) ? compareFn : defaultCompare;

    // The next three lines are a version of a Swartzian Transform idiom from Perl
    // (sometimes called the Decorate-Sort-Undecorate idiom)
    // See https://en.wikipedia.org/wiki/Schwartzian_transform
    const compareValues = Array.prototype.map.call(array, getComparisonObject);
    compareValues.sort(doComparison);
    array = compareValues.map((item) => item.value);

    return array;

    function getComparisonObject(value, index) {
      // NOTE: We are adding an extra `tieBreaker` value based on the element's index.
      // This will be used to keep the sort stable when none of the input predicates can
      // distinguish between two elements.
      return {
        value,
        tieBreaker: { value: index, type: "number", index },
        predicateValues: predicates.map((predicate) =>
          getPredicateValue(predicate.get(value), index),
        ),
      };
    }

    function doComparison(v1, v2) {
      for (let i = 0, ii = predicates.length; i < ii; i++) {
        const result = compare(v1.predicateValues[i], v2.predicateValues[i]);
        if (result) {
          return result * predicates[i].descending * descending;
        }
      }

      return (
        (compare(v1.tieBreaker, v2.tieBreaker) ||
          defaultCompare(v1.tieBreaker, v2.tieBreaker)) * descending
      );
    }
  };

  function processPredicates(sortPredicates) {
    return sortPredicates.map((predicate) => {
      let descending = 1;
      let get = identity;

      if (isFunction(predicate)) {
        get = predicate;
      } else if (isString(predicate)) {
        if (predicate.charAt(0) === "+" || predicate.charAt(0) === "-") {
          descending = predicate.charAt(0) === "-" ? -1 : 1;
          predicate = predicate.substring(1);
        }
        if (predicate !== "") {
          get = $parse(predicate);
          if (get.constant) {
            const key = get();
            get = function (value) {
              return value[key];
            };
          }
        }
      }
      return { get, descending };
    });
  }

  function isPrimitive(value) {
    switch (typeof value) {
      case "number": /* falls through */
      case "boolean": /* falls through */
      case "string":
        return true;
      default:
        return false;
    }
  }

  function objectValue(value) {
    // If `valueOf` is a valid function use that
    if (isFunction(value.valueOf)) {
      value = value.valueOf();
      if (isPrimitive(value)) return value;
    }
    // If `toString` is a valid function and not the one from `Object.prototype` use that
    if (hasCustomToString(value)) {
      value = value.toString();
      if (isPrimitive(value)) return value;
    }

    return value;
  }

  function getPredicateValue(value, index) {
    let type = typeof value;
    if (value === null) {
      type = "null";
    } else if (type === "object") {
      value = objectValue(value);
    }
    return { value, type, index };
  }

  function defaultCompare(v1, v2) {
    let result = 0;
    const type1 = v1.type;
    const type2 = v2.type;

    if (type1 === type2) {
      let value1 = v1.value;
      let value2 = v2.value;

      if (type1 === "string") {
        // Compare strings case-insensitively
        value1 = value1.toLowerCase();
        value2 = value2.toLowerCase();
      } else if (type1 === "object") {
        // For basic objects, use the position of the object
        // in the collection instead of the value
        if (isObject(value1)) value1 = v1.index;
        if (isObject(value2)) value2 = v2.index;
      }

      if (value1 !== value2) {
        result = value1 < value2 ? -1 : 1;
      }
    } else {
      result =
        type1 === "undefined"
          ? 1
          : type2 === "undefined"
            ? -1
            : type1 === "null"
              ? 1
              : type2 === "null"
                ? -1
                : type1 < type2
                  ? -1
                  : 1;
    }

    return result;
  }
}
