import { hasAnimate, isObject, isString } from "../../shared/utils.js";

function classDirective(name, selector) {
  name = `ngClass${name}`;
  let indexWatchExpression;

  return [
    "$parse",
    /**
     *
     * @param {import("../../core/parse/parse.js").ParseService} $parse
     * @returns {import("../../types").Directive}
     */
    ($parse) => ({
      restrict: "EA",
      /**
       * @param {import("../../core/scope/scope").Scope} scope
       * @param {import("../../shared/jqlite/jqlite").JQLite} element
       * @param {import("../../core/compile/attributes").Attributes} attr
       */
      link(scope, element, attr) {
        let classCounts = element.data("$classCounts");
        let oldModulo = true;
        let oldClassString;

        if (!classCounts) {
          // Use Object.create(null) to prevent class assumptions involving property
          // names in Object.prototype
          classCounts = Object.create(null);
          element.data("$classCounts", classCounts);
        }

        if (name !== "ngClass") {
          if (!indexWatchExpression) {
            indexWatchExpression = $parse("$index", function moduloTwo($index) {
              return $index & 1;
            });
          }

          scope.$watch(indexWatchExpression, ngClassIndexWatchAction);
        }

        scope.$watch($parse(attr[name], toClassString), ngClassWatchAction);

        function addClasses(classString) {
          classString = digestClassCounts(split(classString), 1);
          if (hasAnimate(element[0])) {
            attr.$addClass(classString);
          } else {
            scope.$$postDigest(() => {
              if (classString !== "") {
                element[0].classList.add(...classString.trim().split(" "));
              }
            });
          }
        }

        function removeClasses(classString) {
          classString = digestClassCounts(split(classString), -1);
          if (hasAnimate(element[0])) {
            attr.$removeClass(classString);
          } else {
            scope.$$postDigest(() => {
              if (classString !== "") {
                element[0].classList.remove(...classString.trim().split(" "));
              }
            });
          }
        }

        function updateClasses(oldClassString, newClassString) {
          const oldClassArray = split(oldClassString);
          const newClassArray = split(newClassString);

          const toRemoveArray = arrayDifference(oldClassArray, newClassArray);
          const toAddArray = arrayDifference(newClassArray, oldClassArray);

          const toRemoveString = digestClassCounts(toRemoveArray, -1);
          const toAddString = digestClassCounts(toAddArray, 1);

          if (hasAnimate(element[0])) {
            attr.$addClass(toAddString);
            attr.$removeClass(toRemoveString);
          } else {
            scope.$$postDigest(() => {
              if (toAddString !== "") {
                element[0].classList.add(...toAddString.trim().split(" "));
              }
              if (toRemoveString !== "") {
                element[0].classList.remove(
                  ...toRemoveString.trim().split(" "),
                );
              }
            });
          }
        }

        function digestClassCounts(classArray, count) {
          const classesToUpdate = [];
          if (classArray) {
            classArray.forEach((className) => {
              if (count > 0 || classCounts[className]) {
                classCounts[className] = (classCounts[className] || 0) + count;
                if (classCounts[className] === +(count > 0)) {
                  classesToUpdate.push(className);
                }
              }
            });
          }
          return classesToUpdate.join(" ");
        }

        function ngClassIndexWatchAction(newModulo) {
          // This watch-action should run before the `ngClassWatchAction()`, thus it
          // adds/removes `oldClassString`. If the `ngClass` expression has changed as well, the
          // `ngClassWatchAction()` will update the classes.
          if (newModulo === selector) {
            addClasses(oldClassString);
          } else {
            removeClasses(oldClassString);
          }

          oldModulo = newModulo;
        }

        function ngClassWatchAction(newClassString) {
          if (oldModulo === selector) {
            updateClasses(oldClassString, newClassString);
          }

          oldClassString = newClassString;
        }
      },
    }),
  ];

  // Helpers
  function arrayDifference(tokens1, tokens2) {
    if (!tokens1 || !tokens1.length) return [];
    if (!tokens2 || !tokens2.length) return tokens1;

    const values = [];

    outer: for (let i = 0; i < tokens1.length; i++) {
      const token = tokens1[i];
      for (let j = 0; j < tokens2.length; j++) {
        if (token === tokens2[j]) continue outer;
      }
      values.push(token);
    }

    return values;
  }

  function split(classString) {
    return classString && classString.split(" ");
  }

  function toClassString(classValue) {
    if (!classValue) return classValue;

    let classString = classValue;

    if (Array.isArray(classValue)) {
      classString = classValue.map(toClassString).join(" ");
    } else if (isObject(classValue)) {
      classString = Object.keys(classValue)
        .filter((key) => classValue[key])
        .join(" ");
    } else if (!isString(classValue)) {
      classString = `${classValue}`;
    }

    return classString;
  }
}

export const ngClassDirective = classDirective("", true);
export const ngClassOddDirective = classDirective("Odd", 0);
export const ngClassEvenDirective = classDirective("Even", 1);
