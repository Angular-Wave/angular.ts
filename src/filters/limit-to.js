import {
  isArrayLike,
  isNumber,
  isNumberNaN,
  isString,
  toInt,
} from "../shared/utils";

/**
 * @returns {angular.IFilterLimitTo}
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
