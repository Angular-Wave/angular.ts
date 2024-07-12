export namespace angular {
    type BootstrapConfig = any;
    type Injectable<T_1> = Function | Array<string | Function>;
    type ComponentOptions = any;
    type ControllerConstructor = Function;
    type OnChangesObject = any;
    type ChangesObject = any;
    type Controller = any;
    type Attributes = {
        [x: string]: any;
    };
    type DirectiveController = angular.Controller | angular.Controller[] | {
        [key: string]: angular.Controller;
    };
    /**
     * Compile function for an AngularJS directive.
     */
    type DirectiveCompileFn<S_1 extends TScope, T_1 extends TElement, A_1 extends TAttributes, C_1 extends unknown> = (templateElement: TElement, templateAttributes: TAttributes, transclude: angular.TranscludeFunction) => any;
    /**
     * Link function for an AngularJS directive.
     */
    type DirectiveLinkFn<TScope, TElement, TAttributes, TController> = (scope: TScope, instanceElement: TElement, instanceAttributes: TAttributes, controller?: TController, transclude?: angular.TranscludeFunction) => void;
    /**
     * Represents the pre and post linking functions of a directive.
     */
    type DirectivePrePost<TScope, TElement, TAttributes, TController> = {
        /**
         * The pre-linking function of the directive.
         */
        pre?: angular.DirectiveLinkFn<TScope, TElement, TAttributes, TController> | undefined;
        /**
         * The post-linking function of the directive.
         */
        post?: angular.DirectiveLinkFn<TScope, TElement, TAttributes, TController> | undefined;
    };
    type Module = any;
}
export type TScope = import("./core/scope/scope").Scope;
export type TElement = import("./shared/jqlite/jqlite").JQLite;
export type TAttributes = angular.Attributes;
export type TController = angular.DirectiveController;
/**
 * Directive definition object.
 */
export type IDirective<TScope, TElement, TAttributes, TController> = {
    /**
     * Compile function for the directive.
     */
    compile?: angular.DirectiveCompileFn<TScope, TElement, TAttributes, TController> | undefined;
    /**
     * Controller constructor or name.
     */
    controller?: string | angular.Injectable<angular.ControllerConstructor> | undefined;
    /**
     * Controller alias.
     */
    controllerAs?: string | undefined;
    /**
     * Bindings to controller.
     */
    bindToController?: boolean | {
        [boundProperty: string]: string;
    } | undefined;
    /**
     * Link function.
     */
    link?: angular.DirectiveLinkFn<TScope, TElement, TAttributes, TController> | angular.DirectivePrePost<TScope, TElement, TAttributes, TController> | undefined;
    /**
     * Multi-element directive flag.
     */
    multiElement?: boolean | undefined;
    /**
     * Directive priority.
     */
    priority?: number | undefined;
    /**
     * Deprecated: Replace flag.
     */
    replace?: boolean | undefined;
    /**
     * Required controllers.
     */
    require?: string | string[] | {
        [controller: string]: string;
    } | undefined;
    /**
     * Restriction mode.
     */
    restrict?: string | undefined;
    /**
     * Scope options.
     */
    scope?: boolean | {
        [boundProperty: string]: string;
    } | undefined;
    /**
     * HTML template.
     */
    template?: string | ((tElement: TElement, tAttrs: TAttributes) => string) | undefined;
    /**
     * Template namespace.
     */
    templateNamespace?: string | undefined;
    /**
     * HTML template URL.
     */
    templateUrl?: string | ((tElement: TElement, tAttrs: TAttributes) => string) | undefined;
    /**
     * Transclusion options.
     */
    transclude?: boolean | "element" | {
        [slot: string]: string;
    } | undefined;
};
/**
 * Factory function for creating directives.
 */
export type IDirectiveFactory<TScope, TElement, TAttributes, TController> = (...args: any[]) => IDirective<TScope, TElement, TAttributes, TController> | angular.DirectiveLinkFn<TScope, TElement, TAttributes, TController>;
