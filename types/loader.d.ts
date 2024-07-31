/**
 * @ngdoc type
 * @name import('./types').Module
 * @module ng
 * @description
 *
 * Interface for configuring AngularJS {@link angular.module modules}.
 */
export function setupModuleLoader(window: any): any;
/**
 * @type {string} `version` from `package.json`, injected by Rollup plugin
 */
export const VERSION: string;
/**
 * Configuration option for AngularTS bootstrap process.
 *
 * @typedef {Object} AngularBootstrapConfig
 * @property {boolean} [strictDi] - Disable automatic function annotation for the application. This is meant to assist in finding bugs which break minified code. Defaults to `false`.
 */
/**
 * @class
 */
export class Angular {
    /** @type {Map<number, import("./core/cache/cache").ExpandoStore>} */
    cache: Map<number, import("./core/cache/cache").ExpandoStore>;
    /** @type {string} */
    version: string;
    /** @type {typeof import('./shared/jqlite/jqlite').JQLite} */
    element: typeof import("./shared/jqlite/jqlite").JQLite;
    /** @type {!Array<string|any>} */
    bootsrappedModules: Array<string | any>;
    /** @type {Function} */
    doBootstrap: Function;
    /**
     * Configure several aspects of error handling if used as a setter or return the
     * current configuration if used as a getter.
     *
     * Omitted or undefined options will leave the corresponding configuration values unchanged.
     *
     * @param {import('./shared/utils').ErrorHandlingConfig} [config]
     * @returns {import('./shared/utils').ErrorHandlingConfig}
     */
    errorHandlingConfig(config?: import("./shared/utils").ErrorHandlingConfig): import("./shared/utils").ErrorHandlingConfig;
    /**
     * Use this function to manually start up AngularJS application.
     *
     * AngularJS will detect if it has been loaded into the browser more than once and only allow the
     * first loaded script to be bootstrapped and will report a warning to the browser console for
     * each of the subsequent scripts. This prevents strange results in applications, where otherwise
     * multiple instances of AngularJS try to work on the DOM.
     *   *
     * <div class="alert alert-warning">
     * **Note:** Do not bootstrap the app on an element with a directive that uses {@link ng.$compile#transclusion transclusion},
     * such as {@link ng.ngIf `ngIf`}, {@link ng.ngInclude `ngInclude`} and {@link ngRoute.ngView `ngView`}.
     * Doing this misplaces the app {@link ng.$rootElement `$rootElement`} and the app's {@link auto.$injector injector},
     * causing animations to stop working and making the injector inaccessible from outside the app.
     * </div>
     *
     * ```html
     * <!doctype html>
     * <html>
     * <body>
     * <div ng-controller="WelcomeController">
     *   {{greeting}}
     * </div>
     *
     * <script src="angular.js"></script>
     * <script>
     *   let app = angular.module('demo', [])
     *   .controller('WelcomeController', function($scope) {
     *       $scope.greeting = 'Welcome!';
     *   });
     *   angular.bootstrap(document, ['demo']);
     * </script>
     * </body>
     * </html>
     * ```
     *
     * @param {string | Element | Document} element DOM element which is the root of AngularJS application.
     * @param {Array<String|any>} [modules] an array of modules to load into the application.
     *     Each item in the array should be the name of a predefined module or a (DI annotated)
     *     function that will be invoked by the injector as a `config` block.
     *     See: {@link angular.module modules}
     * @param {AngularBootstrapConfig} [config] an object for defining configuration options for the application. The
     *     following keys are supported:
     *
     * * `strictDi` - disable automatic function annotation for the application. This is meant to
     *   assist in finding bugs which break minified code. Defaults to `false`.
     *
     * @returns {any} InjectorService - Returns the newly created injector for this app.
     */
    bootstrap(element: string | Element | Document, modules?: Array<string | any>, config?: AngularBootstrapConfig): any;
    resumeBootstrap(extraModules: any): any;
    /**
     *
     * @param {any[]} modules
     * @param {boolean?} strictDi
     * @returns {import("./types").InjectorService}
     */
    injector(modules: any[], strictDi: boolean | null): import("./types").InjectorService;
    /**
   * @module angular
   * @function reloadWithDebugInfo
  
   * @description
   * Use this function to reload the current application with debug information turned on.
   * This takes precedence over a call to `$compileProvider.debugInfoEnabled(false)`.
   *
   * See {@link ng.$compileProvider#debugInfoEnabled} for more.
   */
    reloadWithDebugInfo(): void;
    /**
     * @param {Element|Document} element
     */
    init(element: Element | Document): void;
}
/**
 * Configuration option for AngularTS bootstrap process.
 */
export type AngularBootstrapConfig = {
    /**
     * - Disable automatic function annotation for the application. This is meant to assist in finding bugs which break minified code. Defaults to `false`.
     */
    strictDi?: boolean;
};
