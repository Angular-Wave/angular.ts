import { isDefined } from "../core/utils";
import { jqLiteBuildFragment } from "../jqLite";
/**
 * @ngdoc directive
 * @name ngInclude
 * @restrict ECA
 * @scope
 * @priority -400
 *
 * @description
 * Fetches, compiles and includes an external HTML fragment.
 *
 * By default, the template URL is restricted to the same domain and protocol as the
 * application document. This is done by calling {@link $sce#getTrustedResourceUrl
 * $sce.getTrustedResourceUrl} on it. To load templates from other domains or protocols
 * you may either add them to your {@link ng.$sceDelegateProvider#trustedResourceUrlList trusted
 * resource URL list} or {@link $sce#trustAsResourceUrl wrap them} as trusted values. Refer to
 * AngularJS's {@link ng.$sce Strict Contextual Escaping}.
 *
 * In addition, the browser's
 * [Same Origin Policy](https://code.google.com/p/browsersec/wiki/Part2#Same-origin_policy_for_XMLHttpRequest)
 * and [Cross-Origin Resource Sharing (CORS)](http://www.w3.org/TR/cors/)
 * policy may further restrict whether the template is successfully loaded.
 * For example, `ngInclude` won't work for cross-domain requests on all browsers and for `file://`
 * access on some browsers.
 *
 * @animations
 * | Animation                        | Occurs                              |
 * |----------------------------------|-------------------------------------|
 * | {@link ng.$animate#enter enter}  | when the expression changes, on the new include |
 * | {@link ng.$animate#leave leave}  | when the expression changes, on the old include |
 *
 * The enter and leave animation occur concurrently.
 *
 * @param {string} ngInclude|src AngularJS expression evaluating to URL. If the source is a string constant,
 *                 make sure you wrap it in **single** quotes, e.g. `src="'myPartialTemplate.html'"`.
 * @param {string=} onload Expression to evaluate when a new partial is loaded.
 *                  <div class="alert alert-warning">
 *                  **Note:** When using onload on SVG elements in IE11, the browser will try to call
 *                  a function with the name on the window element, which will usually throw a
 *                  "function is undefined" error. To fix this, you can instead use `data-onload` or a
 *                  different form that {@link guide/directive#normalization matches} `onload`.
 *                  </div>
 *
 * @param {string=} autoscroll Whether `ngInclude` should call {@link ng.$anchorScroll
 *                  $anchorScroll} to scroll the viewport after the content is loaded.
 *
 *                  - If the attribute is not set, disable scrolling.
 *                  - If the attribute is set without value, enable scrolling.
 *                  - Otherwise enable scrolling only if the expression evaluates to truthy value.
 *
 */

/**
 * @ngdoc event
 * @name ngInclude#$includeContentRequested
 * @eventType emit on the scope ngInclude was declared in
 * @description
 * Emitted every time the ngInclude content is requested.
 *
 * @param {Object} angularEvent Synthetic event object.
 * @param {String} src URL of content to load.
 */

/**
 * @ngdoc event
 * @name ngInclude#$includeContentLoaded
 * @eventType emit on the current ngInclude scope
 * @description
 * Emitted every time the ngInclude content is reloaded.
 *
 * @param {Object} angularEvent Synthetic event object.
 * @param {String} src URL of content to load.
 */

/**
 * @ngdoc event
 * @name ngInclude#$includeContentError
 * @eventType emit on the scope ngInclude was declared in
 * @description
 * Emitted when a template HTTP request yields an erroneous response (status < 200 || status > 299)
 *
 * @param {Object} angularEvent Synthetic event object.
 * @param {String} src URL of content to load.
 */
export const ngIncludeDirective = [
  "$templateRequest",
  "$anchorScroll",
  "$animate",
  ($templateRequest, $anchorScroll, $animate) => ({
    restrict: "ECA",
    priority: 400,
    terminal: true,
    transclude: "element",
    controller: () => {},
    compile(element, attr) {
      const srcExp = attr.ngInclude || attr.src;
      const onloadExp = attr.onload || "";
      const autoScrollExp = attr.autoscroll;

      return (scope, $element, $attr, ctrl, $transclude) => {
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
            $animate.leave(currentElement).done((response) => {
              if (response !== false) previousElement = null;
            });
            previousElement = currentElement;
            currentElement = null;
          }
        };

        scope.$watch(srcExp, (src) => {
          const afterAnimation = function (response) {
            if (
              response !== false &&
              isDefined(autoScrollExp) &&
              (!autoScrollExp || scope.$eval(autoScrollExp))
            ) {
              $anchorScroll();
            }
          };
          // eslint-disable-next-line no-plusplus
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
                  $animate.enter(clone, null, $element).done(afterAnimation);
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
  }),
];

// This directive is called during the $transclude call of the first `ngInclude` directive.
// It will replace and compile the content of the element with the loaded template.
// We need this directive so that the element content is already filled when
// the link function of another directive on the same element as ngInclude
// is called.
export const ngIncludeFillContentDirective = [
  "$compile",
  ($compile) => ({
    restrict: "ECA",
    priority: -400,
    require: "ngInclude",
    link(scope, $element, $attr, ctrl) {
      if (toString.call($element[0]).match(/SVG/)) {
        // WebKit: https://bugs.webkit.org/show_bug.cgi?id=135698 --- SVG elements do not
        // support innerHTML, so detect this here and try to generate the contents
        // specially.
        $element.empty();
        $compile(
          jqLiteBuildFragment(ctrl.template, window.document).childNodes,
        )(
          scope,
          (clone) => {
            $element.append(clone);
          },
          { futureParentElement: $element },
        );
        return;
      }

      $element.html(ctrl.template);
      $compile($element.contents())(scope);
    },
  }),
];
