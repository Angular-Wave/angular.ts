import { directiveNormalize } from "../../shared/utils.js";

/*
 * A collection of directives that allows creation of custom event handlers that are defined as
 * AngularTS expressions and are compiled and executed within the current scope.
 */

/**
 * @type {Record<string, ng.DirectiveFactory>}
 */
export const ngEventDirectives = {};

"click copy cut dblclick focus blur keydown keyup load mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup paste submit touchstart touchend touchmove"
  .split(" ")
  .forEach((eventName) => {
    const directiveName = directiveNormalize(`ng-${eventName}`);
    ngEventDirectives[directiveName] = [
      "$parse",
      "$exceptionHandler",
      /**
       * @param {import("../../core/parse/interface.ts").ParseService} $parse
       * @param {ng.ExceptionHandlerService} $exceptionHandler
       * @returns
       */
      ($parse, $exceptionHandler) => {
        return createEventDirective(
          $parse,
          $exceptionHandler,
          directiveName,
          eventName,
        );
      },
    ];
  });

/**
 *
 * @param {ng.ParseService} $parse
 * @param {ng.ExceptionHandlerService} $exceptionHandler
 * @param {string} directiveName
 * @param {string} eventName
 * @returns {ng.Directive}
 */
export function createEventDirective(
  $parse,
  $exceptionHandler,
  directiveName,
  eventName,
) {
  return {
    restrict: "A",
    compile(_element, attr) {
      const fn = $parse(attr[directiveName]);
      return (scope, element) => {
        const handler = (event) => {
          try {
            fn(scope, { $event: event });
          } catch (error) {
            $exceptionHandler(error);
          }
        };
        element.addEventListener(eventName, handler);

        scope.$on("$destroy", () =>
          element.removeEventListener(eventName, handler),
        );
      };
    },
  };
}
