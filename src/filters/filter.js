import {
  minErr,
  isArrayLike,
  isFunction,
  isUndefined,
  isObject,
  lowercase,
  hasCustomToString,
  equals,
} from "../shared/utils";

/**
 * @returns {angular.IFilterFilter}
 */
export function filterFilter() {
  return function (array, expression, comparator, anyPropertyKey) {
    if (!isArrayLike(array)) {
      if (array == null) {
        return array;
      }
      throw minErr("filter")(
        "notarray",
        "Expected array but received: {0}",
        array,
      );
    }

    anyPropertyKey = anyPropertyKey || "$";
    let predicateFn;
    let matchAgainstAnyProp;

    switch (getTypeForFilter(expression)) {
      case "function":
        predicateFn = expression;
        break;
      case "boolean":
      case "null":
      case "number":
      case "string":
        matchAgainstAnyProp = true;
      // falls through
      case "object":
        predicateFn = createPredicateFn(
          expression,
          comparator,
          anyPropertyKey,
          matchAgainstAnyProp,
        );
        break;
      default:
        return array;
    }

    return Array.prototype.filter.call(array, predicateFn);
  };
}

// Helper functions for `filterFilter`
function createPredicateFn(
  expression,
  comparator,
  anyPropertyKey,
  matchAgainstAnyProp,
) {
  const shouldMatchPrimitives =
    isObject(expression) && anyPropertyKey in expression;
  let predicateFn;

  if (comparator === true) {
    comparator = equals;
  } else if (!isFunction(comparator)) {
    comparator = function (actual, expected) {
      if (isUndefined(actual)) {
        // No substring matching against `undefined`
        return false;
      }
      if (actual === null || expected === null) {
        // No substring matching against `null`; only match against `null`
        return actual === expected;
      }
      if (
        isObject(expected) ||
        (isObject(actual) && !hasCustomToString(actual))
      ) {
        // Should not compare primitives against objects, unless they have custom `toString` method
        return false;
      }

      actual = lowercase(`${actual}`);
      expected = lowercase(`${expected}`);
      return actual.indexOf(expected) !== -1;
    };
  }

  predicateFn = function (item) {
    if (shouldMatchPrimitives && !isObject(item)) {
      return deepCompare(
        item,
        expression[anyPropertyKey],
        comparator,
        anyPropertyKey,
        false,
      );
    }
    return deepCompare(
      item,
      expression,
      comparator,
      anyPropertyKey,
      matchAgainstAnyProp,
    );
  };

  return predicateFn;
}

function deepCompare(
  actual,
  expected,
  comparator,
  anyPropertyKey,
  matchAgainstAnyProp,
  dontMatchWholeObject,
) {
  const actualType = getTypeForFilter(actual);
  const expectedType = getTypeForFilter(expected);

  if (expectedType === "string" && expected.charAt(0) === "!") {
    return !deepCompare(
      actual,
      expected.substring(1),
      comparator,
      anyPropertyKey,
      matchAgainstAnyProp,
    );
  }
  if (Array.isArray(actual)) {
    // In case `actual` is an array, consider it a match
    // if ANY of it's items matches `expected`
    return actual.some((item) =>
      deepCompare(
        item,
        expected,
        comparator,
        anyPropertyKey,
        matchAgainstAnyProp,
      ),
    );
  }

  switch (actualType) {
    case "object":
      var key;
      if (matchAgainstAnyProp) {
        for (key in actual) {
          // Under certain, rare, circumstances, key may not be a string and `charAt` will be undefined
          // See: https://github.com/angular/angular.js/issues/15644
          if (
            key.charAt &&
            key.charAt(0) !== "$" &&
            deepCompare(actual[key], expected, comparator, anyPropertyKey, true)
          ) {
            return true;
          }
        }
        return dontMatchWholeObject
          ? false
          : deepCompare(actual, expected, comparator, anyPropertyKey, false);
      }
      if (expectedType === "object") {
        for (key in expected) {
          const expectedVal = expected[key];
          if (isFunction(expectedVal) || isUndefined(expectedVal)) {
            continue;
          }

          const matchAnyProperty = key === anyPropertyKey;
          const actualVal = matchAnyProperty ? actual : actual[key];
          if (
            !deepCompare(
              actualVal,
              expectedVal,
              comparator,
              anyPropertyKey,
              matchAnyProperty,
              matchAnyProperty,
            )
          ) {
            return false;
          }
        }
        return true;
      }
      return comparator(actual, expected);

    case "function":
      return false;
    default:
      return comparator(actual, expected);
  }
}

// Used for easily differentiating between `null` and actual `object`
function getTypeForFilter(val) {
  return val === null ? "null" : typeof val;
}
