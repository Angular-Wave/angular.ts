import { isString } from "../shared/utils.js";
import { NG_ANIMATE_CHILDREN_DATA } from "./shared";

$$AnimateChildrenDirective.$inject = ["$interpolate"];

/**
 * @param {*} $interpolate
 * @returns {import("../types").Directive}
 */
export function $$AnimateChildrenDirective($interpolate) {
  return {
    link(scope, element, attrs) {
      const val = attrs.ngAnimateChildren;
      if (isString(val) && val.length === 0) {
        // empty attribute
        element.data(NG_ANIMATE_CHILDREN_DATA, true);
      } else {
        // Interpolate and set the value, so that it is available to
        // animations that run right after compilation
        setData($interpolate(val)(scope));
        attrs.$observe("ngAnimateChildren", setData);
      }

      function setData(value) {
        value = value === "on" || value === "true";
        element.data(NG_ANIMATE_CHILDREN_DATA, value);
      }
    },
  };
}
