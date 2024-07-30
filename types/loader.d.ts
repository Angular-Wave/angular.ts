/**
 * @ngdoc directive
 * @name ngApp
 *
 * @element ANY
 * @param {import('./types').Module} ngApp an optional application
 *   {@link angular.module module} name to load.
 * @param {boolean=} ngStrictDi if this attribute is present on the app element, the injector will be
 *   created in "strict-di" mode. This means that the application will fail to invoke functions which
 *   do not use explicit function annotation (and are thus unsuitable for minification), as described
 *   in {@link guide/di the Dependency Injection guide}, and useful debugging info will assist in
 *   tracking down the root of these bugs.
 *
 * @description
 *
 * Use this directive to **auto-bootstrap** an AngularJS application. The `ngApp` directive
 * designates the **root element** of the application and is typically placed near the root element
 * of the page - e.g. on the `<body>` or `<html>` tags.
 *
 * There are a few things to keep in mind when using `ngApp`:
 * - only one AngularJS application can be auto-bootstrapped per HTML document. The first `ngApp`
 *   found in the document will be used to define the root element to auto-bootstrap as an
 *   application. To run multiple applications in an HTML document you must manually bootstrap them using
 *   {@link angular.bootstrap} instead.
 * - AngularJS applications cannot be nested within each other.
 * - Do not use a directive that uses {@link ng.$compile#transclusion transclusion} on the same element as `ngApp`.
 *   This includes directives such as {@link ng.ngIf `ngIf`}, {@link ng.ngInclude `ngInclude`} and
 *   {@link ngRoute.ngView `ngView`}.
 *   Doing this misplaces the app {@link ng.$rootElement `$rootElement`} and the app's {@link auto.$injector injector},
 *   causing animations to stop working and making the injector inaccessible from outside the app.
 *
 * You can specify an **AngularJS module** to be used as the root module for the application.  This
 * module will be loaded into the {@link auto.$injector} when the application is bootstrapped. It
 * should contain the application code needed or have dependencies on other modules that will
 * contain the code. See {@link angular.module} for more information.
 *
 * In the example below if the `ngApp` directive were not placed on the `html` element then the
 * document would not be compiled, the `AppController` would not be instantiated and the `{{ a+b }}`
 * would not be resolved to `3`.
 *
 * @example
 *
 * ### Simple Usage
 *
 * `ngApp` is the easiest, and most common way to bootstrap an application.
 *
 <example module="ngAppDemo" name="ng-app">
   <file name="index.html">
   <div ng-controller="ngAppDemoController">
     I can add: {{a}} + {{b}} =  {{ a+b }}
   </div>
   </file>
   <file name="script.js">
   angular.module('ngAppDemo', []).controller('ngAppDemoController', function($scope) {
     $scope.a = 1;
     $scope.b = 2;
   });
   </file>
 </example>
 *
 * @example
 *
 * ### With `ngStrictDi`
 *
 * Using `ngStrictDi`, you would see something like this:
 *
 <example ng-app-included="true" name="strict-di">
   <file name="index.html">
   <div ng-app="ngAppStrictDemo" ng-strict-di>
       <div ng-controller="GoodController1">
           I can add: {{a}} + {{b}} =  {{ a+b }}

           <p>This renders because the controller does not fail to
              instantiate, by using explicit annotation style (see
              script.js for details)
           </p>
       </div>

       <div ng-controller="GoodController2">
           Name: <input ng-model="name"><br />
           Hello, {{name}}!

           <p>This renders because the controller does not fail to
              instantiate, by using explicit annotation style
              (see script.js for details)
           </p>
       </div>

       <div ng-controller="BadController">
           I can add: {{a}} + {{b}} =  {{ a+b }}

           <p>The controller could not be instantiated, due to relying
              on automatic function annotations (which are disabled in
              strict mode). As such, the content of this section is not
              interpolated, and there should be an error in your web console.
           </p>
       </div>
   </div>
   </file>
   <file name="script.js">
   angular.module('ngAppStrictDemo', [])
     // BadController will fail to instantiate, due to relying on automatic function annotation,
     // rather than an explicit annotation
     .controller('BadController', function($scope) {
       $scope.a = 1;
       $scope.b = 2;
     })
     // Unlike BadController, GoodController1 and GoodController2 will not fail to be instantiated,
     // due to using explicit annotations using the array style and $inject property, respectively.
     .controller('GoodController1', ['$scope', function($scope) {
       $scope.a = 1;
       $scope.b = 2;
     }])
     .controller('GoodController2', GoodController2);
     function GoodController2($scope) {
       $scope.name = 'World';
     }
     GoodController2.$inject = ['$scope'];
   </file>
   <file name="style.css">
   div[ng-controller] {
       margin-bottom: 1em;
       -webkit-border-radius: 4px;
       border-radius: 4px;
       border: 1px solid;
       padding: .5em;
   }
   div[ng-controller^=Good] {
       border-color: #d6e9c6;
       background-color: #dff0d8;
       color: #3c763d;
   }
   div[ng-controller^=Bad] {
       border-color: #ebccd1;
       background-color: #f2dede;
       color: #a94442;
       margin-bottom: 0;
   }
   </file>
 </example>
 */
/**
 * @param {Element} element
 */
export function angularInit(element: Element): void;
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
     * For more information, see the {@link guide/bootstrap Bootstrap guide}.
     *
     * AngularJS will detect if it has been loaded into the browser more than once and only allow the
     * first loaded script to be bootstrapped and will report a warning to the browser console for
     * each of the subsequent scripts. This prevents strange results in applications, where otherwise
     * multiple instances of AngularJS try to work on the DOM.
     *
     * <div class="alert alert-warning">
     * **Note:** Protractor based end-to-end tests cannot use this function to bootstrap manually.
     * They must use {@link ng.directive:ngApp ngApp}.
     * </div>
     *
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
     *
     * The `angular.module` is a global place for creating, registering and retrieving AngularJS
     * modules.
     * All modules (AngularJS core or 3rd party) that should be available to an application must be
     * registered using this mechanism.
     *
     * Passing one argument retrieves an existing {@link import('./types').Module},
     * whereas passing more than one argument creates a new {@link import('./types').Module}
     *
     *
     * # Module
     *
     * A module is a collection of services, directives, controllers, filters, and configuration information.
     * `angular.module` is used to configure the {@link auto.$injector $injector}.
     *
     * ```js
     * // Create a new module
     * let myModule = angular.module('myModule', []);
     *
     * // register a new service
     * myModule.value('appName', 'MyCoolApp');
     *
     * // configure existing services inside initialization blocks.
     * myModule.config(['$locationProvider', function($locationProvider) {
     *   // Configure existing providers
     *   $locationProvider.hashPrefix('!');
     * }]);
     * ```
     *
     * Then you can create an injector and load your modules like this:
     *
     * ```js
     * let injector = angular.injector(['ng', 'myModule'])
     * ```
     *
     * However it's more likely that you'll just use
     * {@link ng.directive:ngApp ngApp} or
     * {@link angular.bootstrap} to simplify this process for you.
     *
     * @param {!string} name The name of the module to create or retrieve.
     * @param {!Array.<string>=} requires If specified then new module is being created. If
     *        unspecified then the module is being retrieved for further configuration.
     * @param {Function=} configFn Optional configuration function for the module. Same as
     *        {@link import('./types').Module#config Module#config()}.
     * @returns {import('./types').Module} new module with the {@link import('./types').Module} api.
     */
    module(name: string, requires?: Array<string> | undefined, configFn?: Function | undefined): import("./types").Module;
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
