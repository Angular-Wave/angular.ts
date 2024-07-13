/**
 * @returns {import('../../types').Directive}
 */
export function ngBindDirective(): import("../../types").Directive;
/**
 * @returns {import('../../types').Directive}
 */
export function ngBindTemplateDirective(): import("../../types").Directive;
/**
 * TODO: add type
 */
export const ngBindHtmlDirective: (string | (($parse: any) => {
    restrict: string;
    compile: (_tElement: any, tAttrs: any) => (scope: any, element: any) => void;
}))[];
