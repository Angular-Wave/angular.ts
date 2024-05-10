import { isArrayLike, isNumber, isNumberNaN, isString, toInt } from "../utils";

/**
 * @ngdoc filter
 * @name limitTo
 * @kind function
 *
 * @description
 * Creates a new array or string containing only a specified number of elements. The elements are
 * taken from either the beginning or the end of the source array, string or number, as specified by
 * the value and sign (positive or negative) of `limit`. Other array-like objects are also supported
 * (e.g. array subclasses, NodeLists, jqLite/jQuery collections etc). If a number is used as input,
 * it is converted to a string.
 *
 * @param {Array|ArrayLike|string|number} input - Array/array-like, string or number to be limited.
 * @param {string|number} limit - The length of the returned array or string. If the `limit` number
 *     is positive, `limit` number of items from the beginning of the source array/string are copied.
 *     If the number is negative, `limit` number  of items from the end of the source array/string
 *     are copied. The `limit` will be trimmed if it exceeds `array.length`. If `limit` is undefined,
 *     the input will be returned unchanged.
 * @param {(string|number)=} begin - Index at which to begin limitation. As a negative index,
 *     `begin` indicates an offset from the end of `input`. Defaults to `0`.
 * @returns {Array|string} A new sub-array or substring of length `limit` or less if the input had
 *     less than `limit` elements.
 */
export function limitToFilter() {
  return function (input, limit, begin) {
    if (Math.abs(Number(limit)) === Infinity) {
      limit = Number(limit);
    } else {
      limit = toInt(limit);
    }
    if (isNumberNaN(limit)) return input;

    if (isNumber(input)) input = input.toString();
    if (!isArrayLike(input)) return input;

    begin = !begin || isNaN(begin) ? 0 : toInt(begin);
    begin = begin < 0 ? Math.max(0, input.length + begin) : begin;

    if (limit >= 0) {
      return sliceFn(input, begin, begin + limit);
    } else {
      if (begin === 0) {
        return sliceFn(input, limit, input.length);
      } else {
        return sliceFn(input, Math.max(0, begin + limit), begin);
      }
    }
  };
}

function sliceFn(input, begin, end) {
  if (isString(input)) return input.slice(begin, end);

  return [].slice.call(input, begin, end);
}
