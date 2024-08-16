import { hasAnimate, isObject, isString } from "../../shared/utils";

function classDirective(name, selector) {
  name = `ngClass${name}`;
  let indexWatchExpression;

  return [
    "$parse",
    ($parse) => ({
      restrict: "EA",
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

/**
 * @ngdoc directive
 * @name ngClass
 * @restrict AC
 * @element ANY
 *
 * @description
 * The `ngClass` directive allows you to dynamically set CSS classes on an HTML element by databinding
 * an expression that represents all classes to be added.
 *
 * The directive operates in three different ways, depending on which of three types the expression
 * evaluates to:
 *
 * 1. If the expression evaluates to a string, the string should be one or more space-delimited class
 * names.
 *
 * 2. If the expression evaluates to an object, then for each key-value pair of the
 * object with a truthy value the corresponding key is used as a class name.
 *
 * 3. If the expression evaluates to an array, each element of the array should either be a string as in
 * type 1 or an object as in type 2. This means that you can mix strings and objects together in an array
 * to give you more control over what CSS classes appear. See the code below for an example of this.
 *
 *
 * The directive won't add duplicate classes if a particular class was already set.
 *
 * When the expression changes, the previously added classes are removed and only then are the
 * new classes added.
 *
 * @knownIssue
 * You should not use {@link guide/interpolation interpolation} in the value of the `class`
 * attribute, when using the `ngClass` directive on the same element.
 * See {@link guide/interpolation#known-issues here} for more info.
 *
 * @animations
 * | Animation                        | Occurs                              |
 * |----------------------------------|-------------------------------------|
 * | {@link ng.$animate#addClass addClass}       | just before the class is applied to the element   |
 * | {@link ng.$animate#removeClass removeClass} | just before the class is removed from the element |
 * | {@link ng.$animate#setClass setClass} | just before classes are added and classes are removed from the element at the same time |
 *
 * ### ngClass and pre-existing CSS3 Transitions/Animations
   The ngClass directive still supports CSS3 Transitions/Animations even if they do not follow the ngAnimate CSS naming structure.
   Upon animation ngAnimate will apply supplementary CSS classes to track the start and end of an animation, but this will not hinder
   any pre-existing CSS transitions already on the element. To get an idea of what happens during a class-based animation, be sure
   to view the step by step details of {@link $animate#addClass $animate.addClass} and
   {@link $animate#removeClass $animate.removeClass}.
 *
 * @param {String} ngClass {@link guide/expression Expression} to eval. The result
 *   of the evaluation can be a string representing space delimited class
 *   names, an array, or a map of class names to boolean values. In the case of a map, the
 *   names of the properties whose values are truthy will be added as css classes to the
 *   element.
 *
 */
export const ngClassDirective = classDirective("", true);

/**
 * @ngdoc directive
 * @name ngClassOdd
 * @restrict AC
 *
 * @description
 * The `ngClassOdd` and `ngClassEven` directives work exactly as
 * {@link ng.directive:ngClass ngClass}, except they work in
 * conjunction with `ngRepeat` and take effect only on odd (even) rows.
 *
 * This directive can be applied only within the scope of an
 * {@link ng.directive:ngRepeat ngRepeat}.
 *
 * @animations
 * | Animation                        | Occurs                              |
 * |----------------------------------|-------------------------------------|
 * | {@link ng.$animate#addClass addClass}       | just before the class is applied to the element   |
 * | {@link ng.$animate#removeClass removeClass} | just before the class is removed from the element |
 *
 * @element ANY
 * @param {String} ngClassOdd {@link guide/expression Expression} to eval. The result
 *   of the evaluation can be a string representing space delimited class names or an array.
 *
 *
 */
export const ngClassOddDirective = classDirective("Odd", 0);

/**
 * @ngdoc directive
 * @name ngClassEven
 * @restrict AC
 *
 * @description
 * The `ngClassOdd` and `ngClassEven` directives work exactly as
 * {@link ng.directive:ngClass ngClass}, except they work in
 * conjunction with `ngRepeat` and take effect only on odd (even) rows.
 *
 * This directive can be applied only within the scope of an
 * {@link ng.directive:ngRepeat ngRepeat}.
 *
 * @animations
 * | Animation                        | Occurs                              |
 * |----------------------------------|-------------------------------------|
 * | {@link ng.$animate#addClass addClass}       | just before the class is applied to the element   |
 * | {@link ng.$animate#removeClass removeClass} | just before the class is removed from the element |
 *
 * @element ANY
 * @param {String} ngClassEven {@link guide/expression Expression} to eval. The
 *   result of the evaluation can be a string representing space delimited class names or an array.
 *
 */
export const ngClassEvenDirective = classDirective("Even", 1);
