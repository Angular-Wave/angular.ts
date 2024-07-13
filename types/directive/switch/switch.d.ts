/**
 * @returns {import('../../types').Directive}
 */
export function ngSwitchWhenDirective(): import("../../types").Directive;
/**
 * @returns {import('../../types').Directive}
 */
export function ngSwitchDefaultDirective(): import("../../types").Directive;
export const ngSwitchDirective: (string | (($animate: any) => {
    require: string;
    controller: (string | {
        new (): {
            cases: {};
        };
    })[];
    link(scope: any, _element: any, attr: any, ngSwitchController: any): void;
}))[];
