import { ngDirective } from "./directives";

/**
 * @ngdoc directive
 * @name ngNonBindable
 * @restrict AC
 * @priority 1000
 * @element ANY
 *
 * @description
 * The `ngNonBindable` directive tells AngularJS not to compile or bind the contents of the current
 * DOM element, including directives on the element itself that have a lower priority than
 * `ngNonBindable`. This is useful if the element contains what appears to be AngularJS directives
 * and bindings but which should be ignored by AngularJS. This could be the case if you have a site
 * that displays snippets of code, for instance.
 *
 */
export const ngNonBindableDirective = ngDirective({
  terminal: true,
  priority: 1000,
});
