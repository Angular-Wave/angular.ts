export function ngSwitchWhenDirective(): {
    transclude: string;
    priority: number;
    restrict: string;
    require: string;
    link(_scope: any, element: any, attrs: any, ctrl: any, $transclude: any): void;
};
export function ngSwitchDefaultDirective(): {
    restrict: string;
    transclude: string;
    priority: number;
    require: string;
    link(_scope: any, element: any, _attr: any, ctrl: any, $transclude: any): void;
};
export const ngSwitchDirective: (string | (($animate: any) => {
    require: string;
    controller: (string | typeof SwitchController)[];
    /**
     * @param {*} scope
     * @param {*} element
     * @param {*} attr
     * @param {SwitchController} ngSwitchController
     */
    link(scope: any, element: any, attr: any, ngSwitchController: SwitchController): void;
}))[];
export type SwitchCase = {
    element: Element;
    /**
     * - of type "controllersBoundTransclude"
     */
    transclude: Function;
    /**
     * - the comment replacing the element
     */
    comment: Element;
};
export type SwitchCaseScope = {
    scope: import("../../core/scope/scope.js").Scope;
    element: Element;
    comment: Element;
    selectedTransclude: SwitchCase;
};
/**
 * @typedef {Object} SwitchCase
 * @property {Element} element
 * @property {Function} transclude - of type "controllersBoundTransclude"
 * @property {Element} comment - the comment replacing the element
 */
/**
 * @typedef {Object} SwitchCaseScope
 * @property {import("../../core/scope/scope.js").Scope} scope
 * @property {Element} element
 * @property {Element} comment
 * @property {SwitchCase} selectedTransclude
 */
/**
 * @extends import("../../types.js").Controller
 */
declare class SwitchController {
    /**
     * @type {Record<string, Array<SwitchCase>>}
     */
    cases: Record<string, Array<SwitchCase>>;
}
export {};
