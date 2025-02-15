import { isDefined } from "../../shared/utils.js";
import { domInsert } from "../../shared//dom.js";
import { hasAnimate } from "../../shared/utils.js";

ngIncludeDirective.$inject = ["$templateRequest", "$anchorScroll", "$animate"];

/**
 *
 * @param {*} $templateRequest
 * @param {import("../../services/anchor-scroll.js").AnchorScrollFunction} $anchorScroll
 * @param {*} $animate
 * @returns
 */
export function ngIncludeDirective($templateRequest, $anchorScroll, $animate) {
  return {
    restrict: "EA",
    priority: 400,
    terminal: true,
    transclude: "element",
    controller: () => {},
    compile(_element, attr) {
      const srcExp = attr.ngInclude || attr.src;
      const onloadExp = attr.onload || "";
      const autoScrollExp = attr.autoscroll;

      return (scope, $element, _$attr, ctrl, $transclude) => {
        function maybeScroll() {
          if (
            isDefined(autoScrollExp) &&
            (!autoScrollExp || scope.$eval(autoScrollExp))
          ) {
            $anchorScroll();
          }
        }

        let changeCounter = 0;
        let currentScope;
        let previousElement;
        let currentElement;
        const cleanupLastIncludeContent = () => {
          if (previousElement) {
            previousElement.remove();
            previousElement = null;
          }
          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }
          if (currentElement) {
            if (hasAnimate(currentElement[0])) {
              $animate.leave(currentElement).done((response) => {
                if (response !== false) previousElement = null;
              });
            } else {
              currentElement.remove();
            }

            previousElement = currentElement;
            currentElement = null;
          }
        };

        scope.$watch(srcExp, (src) => {
          const afterAnimation = function (response) {
            response !== false && maybeScroll();
          };

          const thisChangeId = ++changeCounter;
          if (src) {
            // set the 2nd param to true to ignore the template request error so that the inner
            // contents and scope can be cleaned up.
            $templateRequest(src, true).then(
              (response) => {
                if (scope.$$destroyed) return;

                if (thisChangeId !== changeCounter) return;
                const newScope = scope.$new();
                ctrl.template = response;

                // Note: This will also link all children of ng-include that were contained in the original
                // html. If that content contains controllers, ... they could pollute/change the scope.
                // However, using ng-include on an element with additional content does not make sense...
                // Note: We can't remove them in the cloneAttchFn of $transclude as that
                // function is called before linking the content, which would apply child
                // directives to non existing elements.
                const clone = $transclude(newScope, (clone) => {
                  cleanupLastIncludeContent();
                  if (hasAnimate(clone[0])) {
                    $animate.enter(clone, null, $element).done(afterAnimation);
                  } else {
                    domInsert(clone[0], null, $element);
                    maybeScroll();
                  }
                });

                currentScope = newScope;
                currentElement = clone;
                currentScope.$emit("$includeContentLoaded", src);
                scope.$eval(onloadExp);
              },
              () => {
                if (scope.$$destroyed) return;

                if (thisChangeId === changeCounter) {
                  cleanupLastIncludeContent();
                  scope.$emit("$includeContentError", src);
                }
              },
            );
            scope.$emit("$includeContentRequested", src);
          } else {
            cleanupLastIncludeContent();
            ctrl.template = null;
          }
        });
      };
    },
  };
}

// This directive is called during the $transclude call of the first `ngInclude` directive.
// It will replace and compile the content of the element with the loaded template.
// We need this directive so that the element content is already filled when
// the link function of another directive on the same element as ngInclude
// is called.
ngIncludeFillContentDirective.$inject = ["$compile"];

/**
 * @param {import("../../core/compile/compile.js").CompileFn} $compile
 * @returns {import("../../types.js").Directive}
 */
export function ngIncludeFillContentDirective($compile) {
  return {
    restrict: "EA",
    priority: -400,
    require: "ngInclude",
    link(scope, $element, _$attr, ctrl) {
      $element.innerHTML = ctrl["template"];
      Array.from($element.childNodes).forEach((el) => {
        $compile(el)(scope);
      });
    },
  };
}
