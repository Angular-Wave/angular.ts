/**
 * Prints ng-router Transition trace information to the console.
 */
export class Trace {
    _enabled: {};
    approximateDigests: number;
    _set(enabled: any, categories: any): void;
    enable(...categories: any[]): void;
    disable(...categories: any[]): void;
    /**
     * Retrieves the enabled stateus of a [[Category]]
     *
     * ```js
     * trace.enabled("VIEWCONFIG"); // true or false
     * ```
     *
     * @returns boolean true if the category is enabled
     */
    enabled(category: any): boolean;
    /** @internal called by ui-router code */
    traceTransitionStart(trans: any): void;
    /** @internal called by ui-router code */
    traceTransitionIgnored(trans: any): void;
    /** @internal called by ui-router code */
    traceHookInvocation(step: any, trans: any, options: any): void;
    /** @internal called by ui-router code */
    traceHookResult(hookResult: any, trans: any): void;
    /** @internal called by ui-router code */
    traceResolvePath(path: any, when: any, trans: any): void;
    /** @internal called by ui-router code */
    traceResolvableResolved(resolvable: any, trans: any): void;
    /** @internal called by ui-router code */
    traceError(reason: any, trans: any): void;
    /** @internal called by ui-router code */
    traceSuccess(finalState: any, trans: any): void;
    /** @internal called by ui-router code */
    traceUIViewEvent(event: any, viewData: any, extra?: string): void;
    /** @internal called by ui-router code */
    traceUIViewConfigUpdated(viewData: any, context: any): void;
    /** @internal called by ui-router code */
    traceUIViewFill(viewData: any, html: any): void;
    /** @internal called by ui-router code */
    traceViewSync(pairs: any): void;
    /** @internal called by ui-router code */
    traceViewServiceEvent(event: any, viewConfig: any): void;
    /** @internal called by ui-router code */
    traceViewServiceUIViewEvent(event: any, viewData: any): void;
}
/**
 * The [[Trace]] singleton
 *
 * #### Example:
 * ```js
 * import {trace} from "@uirouter/core/index";
 * trace.enable(1, 5);
 * ```
 */
export const trace: Trace;
/**
 * Trace categories Enum
 *
 * Enable or disable a category using [[Trace.enable]] or [[Trace.disable]]
 *
 * `trace.enable(Category.TRANSITION)`
 *
 * These can also be provided using a matching string, or position ordinal
 *
 * `trace.enable("TRANSITION")`
 *
 * `trace.enable(1)`
 */
export var Category: any;
