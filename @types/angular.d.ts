/**
 * Configuration option for AngularTS bootstrap process.
 *
 * @typedef {Object} AngularBootstrapConfig
 * @property {boolean} [strictDi] - Disable automatic function annotation for the application. This is meant to assist in finding bugs which break minified code. Defaults to `false`.
 */
export class Angular {
  $cache: Map<number, import("./interface.ts").ExpandoStore>;
  /** @type {import('./services/pubsub/pubsub.js').PubSub} */
  $eventBus: import("./services/pubsub/pubsub.js").PubSub;
  /**
   * @type {string} `version` from `package.json`
   */
  version: string;
  /** @type {!Array<string|any>} */
  bootsrappedModules: Array<string | any>;
  getController: typeof getController;
  getInjector: typeof getInjector;
  getScope: typeof getScope;
  errorHandlingConfig: typeof errorHandlingConfig;
  $t: Readonly<Record<string, string>>;
  /**
   * Use this function to manually start up AngularTS application.
   *
   * AngularTS will detect if it has been loaded into the browser more than once and only allow the
   * first loaded script to be bootstrapped and will report a warning to the browser console for
   * each of the subsequent scripts. This prevents strange results in applications, where otherwise
   * multiple instances of AngularTS try to work on the DOM.
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
   * @param {string | Element | Document} element DOM element which is the root of AngularTS application.
   * @param {Array<String|any>} [modules] an array of modules to load into the application.
   *     Each item in the array should be the name of a predefined module or a (DI annotated)
   *     function that will be invoked by the injector as a `config` block.
   *     See: {@link angular.module modules}
   * @param {AngularBootstrapConfig} [config]
   * @returns {import('./core/di/internal-injector.js').InjectorService} The created injector instance for this application.
   */
  bootstrap(
    element: string | Element | Document,
    modules?: Array<string | any>,
    config?: AngularBootstrapConfig,
  ): import("./core/di/internal-injector.js").InjectorService;
  $injector: import("./core/di/internal-injector.js").InjectorService;
  /**
   * @param {any[]} modules
   * @param {boolean?} strictDi
   * @returns {import("./core/di/internal-injector.js").InjectorService}
   */
  injector(
    modules: any[],
    strictDi: boolean | null,
  ): import("./core/di/internal-injector.js").InjectorService;
  /**
   * @param {Element|Document} element
   */
  init(element: Element | Document): void;
  /**
   *
   * The `angular.module` is a global place for creating, registering and retrieving AngularTS
   * modules.
   * All modules (AngularTS core or 3rd party) that should be available to an application must be
   * registered using this mechanism.
   *
   * Passing one argument retrieves an existing {@link import('./interface.ts').Module},
   * whereas passing more than one argument creates a new {@link import('./interface.ts').Module}
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
   * @param {string} name The name of the module to create or retrieve.
   * @param {Array.<string>} [requires] If specified then new module is being created. If
   *        unspecified then the module is being retrieved for further configuration.
   * @param {import("./interface.js").Injectable} [configFn] Optional configuration function for the module that gets
   *        passed to {@link NgModule.config NgModule.config()}.
   * @returns {NgModule} A newly registered module.
   */
  module(
    name: string,
    requires?: Array<string>,
    configFn?: import("./interface.js").Injectable,
  ): NgModule;
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
import { getController } from "./shared/dom.js";
import { getInjector } from "./shared/dom.js";
import { getScope } from "./shared/dom.js";
import { errorHandlingConfig } from "./shared/utils.js";
import { NgModule } from "./core/di/ng-module.js";
