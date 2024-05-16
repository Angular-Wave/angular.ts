import { forEach, isArray, isUndefined, trim } from "../core/utils";

/**
 * @ngdoc directive
 * @name ngList
 * @restrict A
 * @priority 100
 *
 * @param {string=} ngList optional delimiter that should be used to split the value.
 *
 * @description
 * Text input that converts between a delimited string and an array of strings. The default
 * delimiter is a comma followed by a space - equivalent to `ng-list=", "`. You can specify a custom
 * delimiter as the value of the `ngList` attribute - for example, `ng-list=" | "`.
 *
 * The behaviour of the directive is affected by the use of the `ngTrim` attribute.
 * * If `ngTrim` is set to `"false"` then whitespace around both the separator and each
 *   list item is respected. This implies that the user of the directive is responsible for
 *   dealing with whitespace but also allows you to use whitespace as a delimiter, such as a
 *   tab or newline character.
 * * Otherwise whitespace around the delimiter is ignored when splitting (although it is respected
 *   when joining the list items back together) and whitespace around each list item is stripped
 *   before it is added to the model.
 *
 */
export function ngListDirective() {
  return {
    restrict: "A",
    priority: 100,
    require: "ngModel",
    link(scope, element, attr, ctrl) {
      const ngList = attr.ngList || ", ";
      const trimValues = attr.ngTrim !== "false";
      const separator = trimValues ? trim(ngList) : ngList;

      const parse = function (viewValue) {
        // If the viewValue is invalid (say required but empty) it will be `undefined`
        if (isUndefined(viewValue)) return;

        const list = [];

        if (viewValue) {
          forEach(viewValue.split(separator), (value) => {
            if (value) list.push(trimValues ? trim(value) : value);
          });
        }

        return list;
      };

      ctrl.$parsers.push(parse);
      ctrl.$formatters.push((value) => {
        if (isArray(value)) {
          return value.join(ngList);
        }

        return undefined;
      });

      // Override the standard $isEmpty because an empty array means the input is empty.
      ctrl.$isEmpty = function (value) {
        return !value || !value.length;
      };
    },
  };
}
