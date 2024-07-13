export function $CompileProvider($provide: any, $$sanitizeUriProvider: any): void;
export class $CompileProvider {
    constructor($provide: any, $$sanitizeUriProvider: any);
    /**
     * @ngdoc method
     * @name $compileProvider#directive
     * @kind function
     *
     * @description
     * Register a new directive with the compiler.
     *
     * @param {string|Object} name Name of the directive in camel-case (i.e. `ngBind` which will match
     *    as `ng-bind`), or an object map of directives where the keys are the names and the values
     *    are the factories.
     * @param {Function|Array} directiveFactory An injectable directive factory function. See the
     *    {@link guide/directive directive guide} and the {@link $compile compile API} for more info.
     * @returns {ng.ICompileProvider} Self for chaining.
     */
    directive: (name: string | any, directiveFactory: Function | any[]) => ng.ICompileProvider;
    /**
     * @ngdoc method
     * @name $compileProvider#component
     * @module ng
     * @param {string|Object} name Name of the component in camelCase (i.e. `myComp` which will match `<my-comp>`),
     *    or an object map of components where the keys are the names and the values are the component definition objects.
     * @param {Object} options Component definition object (a simplified
     *    {@link ng.$compile#directive-definition-object directive definition object}),
     *    with the following properties (all optional):
     *
     *    - `controller` – `{(string|function()=}` – controller constructor function that should be
     *      associated with newly created scope or the name of a {@link ng.$compile#-controller-
     *      registered controller} if passed as a string. An empty `noop` function by default.
     *    - `controllerAs` – `{string=}` – identifier name for to reference the controller in the component's scope.
     *      If present, the controller will be published to scope under the `controllerAs` name.
     *      If not present, this will default to be `$ctrl`.
     *    - `template` – `{string=|function()=}` – html template as a string or a function that
     *      returns an html template as a string which should be used as the contents of this component.
     *      Empty string by default.
     *
     *      If `template` is a function, then it is {@link auto.$injector#invoke injected} with
     *      the following locals:
     *
     *      - `$element` - Current element
     *      - `$attrs` - Current attributes object for the element
     *
     *    - `templateUrl` – `{string=|function()=}` – path or function that returns a path to an html
     *      template that should be used  as the contents of this component.
     *
     *      If `templateUrl` is a function, then it is {@link auto.$injector#invoke injected} with
     *      the following locals:
     *
     *      - `$element` - Current element
     *      - `$attrs` - Current attributes object for the element
     *
     *    - `bindings` – `{object=}` – defines bindings between DOM attributes and component properties.
     *      Component properties are always bound to the component controller and not to the scope.
     *      See {@link ng.$compile#-bindtocontroller- `bindToController`}.
     *    - `transclude` – `{boolean=}` – whether {@link $compile#transclusion content transclusion} is enabled.
     *      Disabled by default.
     *    - `require` - `{Object<string, string>=}` - requires the controllers of other directives and binds them to
     *      this component's controller. The object keys specify the property names under which the required
     *      controllers (object values) will be bound. See {@link ng.$compile#-require- `require`}.
     *    - `$...` – additional properties to attach to the directive factory function and the controller
     *      constructor function. (This is used by the component router to annotate)
     *
     * @returns {ng.$compileProvider} the compile provider itself, for chaining of function calls.
     * @description
     * Register a **component definition** with the compiler. This is a shorthand for registering a special
     * type of directive, which represents a self-contained UI component in your application. Such components
     * are always isolated (i.e. `scope: {}`) and are always restricted to elements (i.e. `restrict: 'E'`).
     *
     * Component definitions are very simple and do not require as much configuration as defining general
     * directives. Component definitions usually consist only of a template and a controller backing it.
     *
     * In order to make the definition easier, components enforce best practices like use of `controllerAs`,
     * `bindToController`. They always have **isolate scope** and are restricted to elements.
     *
     * Here are a few examples of how you would usually define components:
     *
     * ```js
     *   let myMod = angular.module(...);
     *   myMod.component('myComp', {
     *     template: '<div>My name is {{$ctrl.name}}</div>',
     *     controller: function() {
     *       this.name = 'shahar';
     *     }
     *   });
     *
     *   myMod.component('myComp', {
     *     template: '<div>My name is {{$ctrl.name}}</div>',
     *     bindings: {name: '@'}
     *   });
     *
     *   myMod.component('myComp', {
     *     templateUrl: 'views/my-comp.html',
     *     controller: 'MyCtrl',
     *     controllerAs: 'ctrl',
     *     bindings: {name: '@'}
     *   });
     *
     * ```
     * For more examples, and an in-depth guide, see the {@link guide/component component guide}.
     *
     * <br />
     * See also {@link ng.$compileProvider#directive $compileProvider.directive()}.
     */
    component: (name: string | any, options: any) => ng.$compileProvider;
    /**
     * @ngdoc method
     * @name $compileProvider#aHrefSanitizationTrustedUrlList
     * @kind function
     *
     * @description
     * Retrieves or overrides the default regular expression that is used for determining trusted safe
     * urls during a[href] sanitization.
     *
     * The sanitization is a security measure aimed at preventing XSS attacks via html links.
     *
     * Any url about to be assigned to a[href] via data-binding is first normalized and turned into
     * an absolute url. Afterwards, the url is matched against the `aHrefSanitizationTrustedUrlList`
     * regular expression. If a match is found, the original url is written into the dom. Otherwise,
     * the absolute url is prefixed with `'unsafe:'` string and only then is it written into the DOM.
     *
     * @param {RegExp=} regexp New regexp to trust urls with.
     * @returns {RegExp|ng.ICompileProvider} Current RegExp if called without value or self for
     *    chaining otherwise.
     */
    aHrefSanitizationTrustedUrlList: (regexp?: RegExp | undefined) => RegExp | ng.ICompileProvider;
    /**
     * @ngdoc method
     * @name $compileProvider#imgSrcSanitizationTrustedUrlList
     * @kind function
     *
     * @description
     * Retrieves or overrides the default regular expression that is used for determining trusted safe
     * urls during img[src] sanitization.
     *
     * The sanitization is a security measure aimed at prevent XSS attacks via html links.
     *
     * Any url about to be assigned to img[src] via data-binding is first normalized and turned into
     * an absolute url. Afterwards, the url is matched against the `imgSrcSanitizationTrustedUrlList`
     * regular expression. If a match is found, the original url is written into the dom. Otherwise,
     * the absolute url is prefixed with `'unsafe:'` string and only then is it written into the DOM.
     *
     * @param {RegExp=} regexp New regexp to trust urls with.
     * @returns {RegExp|ng.ICompileProvider} Current RegExp if called without value or self for
     *    chaining otherwise.
     */
    imgSrcSanitizationTrustedUrlList: (regexp?: RegExp | undefined) => RegExp | ng.ICompileProvider;
    debugInfoEnabled: (enabled: any) => boolean | this;
    strictComponentBindingsEnabled: (enabled: any) => boolean | this;
    /**
     * @ngdoc method
     * @name $compileProvider#addPropertySecurityContext
     * @description
     *
     * Defines the security context for DOM properties bound by ng-prop-*.
     *
     * @param {string} elementName The element name or '*' to match any element.
     * @param {string} propertyName The DOM property name.
     * @param {string} ctx The {@link $sce} security context in which this value is safe for use, e.g. `$sce.URL`
     * @returns {object} `this` for chaining
     */
    addPropertySecurityContext: (elementName: string, propertyName: string, ctx: string) => object;
    $get: (string | (($injector: any, $interpolate: any, $exceptionHandler: any, $templateRequest: any, $parse: any, $controller: any, $rootScope: any, $sce: any, $animate: any) => ($compileNodes: string | NodeList, transcludeFn: any, maxPriority: any, ignoreDirective: any, previousCompileContext: any) => (scope: any, cloneConnectFn: any, options: any) => string | NodeList | JQLite))[];
}
export namespace $CompileProvider {
    let $inject: string[];
}
/**
 * Function that aggregates all linking fns for a compilation root (nodeList)
 */
export type CompositeLinkFn = Function;
import { JQLite } from "../../shared/jqlite/jqlite";
