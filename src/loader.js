import {
  minErr,
  forEach,
  getNgAttribute,
  isFunction,
  isObject,
  ngAttrPrefixes,
  isDefined,
  assertNotHasOwnProperty,
  errorHandlingConfig,
} from "./shared/utils";
import { JQLite } from "./shared/jqlite/jqlite";
import { createInjector } from "./injector";
import { CACHE } from "./core/cache/cache";

/**
 * @type {string} `version` from `package.json`, injected by Rollup plugin
 */
export const VERSION = "[VI]{version}[/VI]";

const ngMinErr = minErr("ng");

/** @type {Object.<string, import('./types').Module>} */
const moduleCache = {};

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
  constructor() {
    CACHE.clear(); // a ensure new instance of angular gets a clean cache

    /** @type {Map<number, import("./core/cache/cache").ExpandoStore>} */
    this.cache = CACHE;

    /** @type {string} */
    this.version = VERSION;

    /** @type {typeof import('./shared/jqlite/jqlite').JQLite} */
    this.element = JQLite;

    /** @type {!Array<string|any>} */
    this.bootsrappedModules = [];

    /** @type {Function} */
    this.doBootstrap;
  }

  /**
   * Configure several aspects of error handling if used as a setter or return the
   * current configuration if used as a getter.
   *
   * Omitted or undefined options will leave the corresponding configuration values unchanged.
   *
   * @param {import('./shared/utils').ErrorHandlingConfig} [config]
   * @returns {import('./shared/utils').ErrorHandlingConfig}
   */
  errorHandlingConfig(config) {
    return errorHandlingConfig(config);
  }

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
  bootstrap(element, modules, config) {
    config = config || {
      strictDi: false,
    };

    this.doBootstrap = function () {
      var jqLite = JQLite(element);

      if (jqLite.injector()) {
        throw ngMinErr("btstrpd", "App already bootstrapped");
      }

      if (Array.isArray(modules)) {
        this.bootsrappedModules = modules;
      }

      this.bootsrappedModules.unshift([
        "$provide",
        ($provide) => {
          $provide.value("$rootElement", jqLite);
        },
      ]);

      this.bootsrappedModules.unshift("ng");

      const injector = createInjector(this.bootsrappedModules, config.strictDi);
      injector.invoke([
        "$rootScope",
        "$rootElement",
        "$compile",
        "$injector",
        /**
         *
         * @param {*} scope
         * @param {JQLite} el
         * @param {*} compile
         * @param {*} $injector
         */
        function (scope, el, compile, $injector) {
          scope.$apply(() => {
            el.data("$injector", $injector);
            compile(el)(scope);
          });
        },
      ]);
      return injector;
    };

    const NG_DEFER_BOOTSTRAP = /^NG_DEFER_BOOTSTRAP!/;

    if (window && !NG_DEFER_BOOTSTRAP.test(window.name)) {
      return this.doBootstrap();
    }

    window.name = window.name.replace(NG_DEFER_BOOTSTRAP, "");
    this.resumeBootstrap = function (extraModules) {
      if (Array.isArray(extraModules)) {
        extraModules.forEach((module) => modules.push(module));
      }
      return this.doBootstrap();
    };
  }

  /**
   *
   * @param {any[]} modules
   * @param {boolean?} strictDi
   * @returns {import("./types").InjectorService}
   */
  injector(modules, strictDi) {
    return createInjector(modules, strictDi);
  }

  resumeBootstrap(extraModules) {
    forEach(extraModules, (module) => {
      this.bootsrappedModules.push(module);
    });
    return this.doBootstrap();
  }

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
  module(name, requires, configFn) {
    const $injectorMinErr = minErr("$injector");
    let info = {};

    assertNotHasOwnProperty(name, "module");
    if (requires && Object.prototype.hasOwnProperty.call(moduleCache, name)) {
      moduleCache[name] = null;
    }

    function ensure(obj, name, factory) {
      return obj[name] || (obj[name] = factory());
    }

    return ensure(moduleCache, name, () => {
      if (!requires) {
        throw $injectorMinErr(
          "nomod",
          "Module '{0}' is not available! You either misspelled " +
            "the module name or forgot to load it. If registering a module ensure that you " +
            "specify the dependencies as the second argument.",
          name,
        );
      }

      /** @type {!Array.<Array.<*>>} */
      const invokeQueue = [];

      /** @type {!Array.<Function>} */
      const configBlocks = [];

      /** @type {!Array.<Function>} */
      const runBlocks = [];

      const config = invokeLater("$injector", "invoke", "push", configBlocks);

      /** @type {import('./types').Module} */
      const moduleInstance = {
        // Private state

        _invokeQueue: invokeQueue,
        _configBlocks: configBlocks,
        _runBlocks: runBlocks,

        /**
         * @ngdoc method
         * @name import('./types').Module#info
         * @module ng
         *
         * @param {Object=} value Information about the module
         * @returns {Object|import('./types').Module} The current info object for this module if called as a getter,
         *                          or `this` if called as a setter.
         *
         * @description
         * Read and write custom information about this module.
         * For example you could put the version of the module in here.
         *
         * ```js
         * angular.module('myModule', []).info({ version: '1.0.0' });
         * ```
         *
         * The version could then be read back out by accessing the module elsewhere:
         *
         * ```
         * let version = angular.module('myModule').info().version;
         * ```
         *
         * You can also retrieve this information during runtime via the
         * {@link $injector#modules `$injector.modules`} property:
         *
         * ```js
         * let version = $injector.modules['myModule'].info().version;
         * ```
         */
        info(value) {
          if (isDefined(value)) {
            if (!isObject(value))
              throw ngMinErr(
                "aobj",
                "Argument '{0}' must be an object",
                "value",
              );
            info = value;
            return this;
          }
          return info;
        },

        /**
         * @ngdoc property
         * @type import('./types').Module#requires
         * @module ng
         *
         * @description
         * Holds the list of modules which the injector will load before the current module is
         * loaded.
         */
        requires,

        /**
         * @ngdoc property
         * @name import('./types').Module#name
         * @module ng
         *
         * @description
         * Name of the module.
         */
        name,

        /**
         * @ngdoc method
         * @name import('./types').Module#provider
         * @module ng
         * @param {string} name service name
         * @param {Function} providerType Construction function for creating new instance of the
         *                                service.
         * @description
         * See {@link auto.$provide#provider $provide.provider()}.
         */
        provider: invokeLaterAndSetModuleName("$provide", "provider"),

        /**
         * @ngdoc method
         * @name import('./types').Module#factory
         * @module ng
         * @param {string} name service name
         * @param {Function} providerFunction Function for creating new instance of the service.
         * @description
         * See {@link auto.$provide#factory $provide.factory()}.
         */
        factory: invokeLaterAndSetModuleName("$provide", "factory"),

        /**
         * @ngdoc method
         * @name import('./types').Module#service
         * @module ng
         * @param {string} name service name
         * @param {Function} constructor A constructor function that will be instantiated.
         * @description
         * See {@link auto.$provide#service $provide.service()}.
         */
        service: invokeLaterAndSetModuleName("$provide", "service"),

        /**
         * @name import('./types').Module#value
         * @param {string} name service name
         * @param {*} object Service instance object.
         * @description
         * See {@link auto.$provide#value $provide.value()}.
         */
        value: invokeLater("$provide", "value"),

        /**
         * @ngdoc method
         * @name import('./types').Module#constant
         * @module ng
         * @param {string} name constant name
         * @param {*} object Constant value.
         * @description
         * Because the constants are fixed, they get applied before other provide methods.
         * See {@link auto.$provide#constant $provide.constant()}.
         */
        constant: invokeLater("$provide", "constant", "unshift"),

        /**
         * @ngdoc method
         * @name import('./types').Module#decorator
         * @module ng
         * @param {string} name The name of the service to decorate.
         * @param {Function} decorFn This function will be invoked when the service needs to be
         *                           instantiated and should return the decorated service instance.
         * @description
         * See {@link auto.$provide#decorator $provide.decorator()}.
         */
        decorator: invokeLaterAndSetModuleName(
          "$provide",
          "decorator",
          configBlocks,
        ),

        /**
         * @ngdoc method
         * @name import('./types').Module#animation
         * @module ng
         * @param {string} name animation name
         * @param {Function} animationFactory Factory function for creating new instance of an
         *                                    animation.
         * @description
         *
         * **NOTE**: animations take effect only if the **ngAnimate** module is loaded.
         *
         *
         * Defines an animation hook that can be later used with
         * {@link $animate $animate} service and directives that use this service.
         *
         * ```js
         * module.animation('.animation-name', function($inject1, $inject2) {
         *   return {
         *     eventName : function(element, done) {
         *       //code to run the animation
         *       //once complete, then run done()
         *       return function cancellationFunction(element) {
         *         //code to cancel the animation
         *       }
         *     }
         *   }
         * })
         * ```
         *
         * See {@link ng.$animateProvider#register $animateProvider.register()} and
         * {@link ngAnimate ngAnimate module} for more information.
         */
        animation: invokeLaterAndSetModuleName("$animateProvider", "register"),

        /**
         * @ngdoc method
         * @name import('./types').Module#filter
         * @module ng
         * @param {string} name Filter name - this must be a valid AngularJS expression identifier
         * @param {Function} filterFactory Factory function for creating new instance of filter.
         * @description
         * See {@link ng.$filterProvider#register $filterProvider.register()}.
         *
         * <div class="alert alert-warning">
         * **Note:** Filter names must be valid AngularJS {@link expression} identifiers, such as `uppercase` or `orderBy`.
         * Names with special characters, such as hyphens and dots, are not allowed. If you wish to namespace
         * your filters, then you can use capitalization (`myappSubsectionFilterx`) or underscores
         * (`myapp_subsection_filterx`).
         * </div>
         */
        filter: invokeLaterAndSetModuleName("$filterProvider", "register"),

        /**
         * @ngdoc method
         * @name import('./types').Module#controller
         * @module ng
         * @param {string|Object} name Controller name, or an object map of controllers where the
         *    keys are the names and the values are the constructors.
         * @param {Function} constructor Controller constructor function.
         * @description
         * See {@link ng.$controllerProvider#register $controllerProvider.register()}.
         */
        controller: invokeLaterAndSetModuleName(
          "$controllerProvider",
          "register",
        ),

        /**
         * @ngdoc method
         * @name import('./types').Module#directive
         * @module ng
         * @param {string|Object} name Directive name, or an object map of directives where the
         *    keys are the names and the values are the factories.
         * @param {Function} directiveFactory Factory function for creating new instance of
         * directives.
         * @description
         * See {@link ng.$compileProvider#directive $compileProvider.directive()}.
         */
        directive: invokeLaterAndSetModuleName("$compileProvider", "directive"),

        /**
         * @ngdoc method
         * @name import('./types').Module#component
         * @module ng
         * @param {string|Object} name Name of the component in camelCase (i.e. `myComp` which will match `<my-comp>`),
         *    or an object map of components where the keys are the names and the values are the component definition objects.
         * @param {Object} options Component definition object (a simplified
         *    {@link ng.$compile#directive-definition-object directive definition object})
         *
         * @description
         * See {@link ng.$compileProvider#component $compileProvider.component()}.
         */
        component: invokeLaterAndSetModuleName("$compileProvider", "component"),

        /**
         * @ngdoc method
         * @name import('./types').Module#config
         * @module ng
         * @param {Function} configFn Execute this function on module load. Useful for service
         *    configuration.
         * @description
         * Use this method to configure services by injecting their
         * {@link import('./types').Module#provider `providers`}, e.g. for adding routes to the
         * {@link ngRoute.$routeProvider $routeProvider}.
         *
         * Note that you can only inject {@link import('./types').Module#provider `providers`} and
         * {@link import('./types').Module#constant `constants`} into this function.
         *
         * For more about how to configure services, see
         * {@link providers#provider-recipe Provider Recipe}.
         */
        config,

        /**
         * @ngdoc method
         * @name import('./types').Module#run
         * @module ng
         * @param {Function} initializationFn Execute this function after injector creation.
         *    Useful for application initialization.
         * @description
         * Use this method to register work which should be performed when the injector is done
         * loading all modules.
         */
        run(initializationFn) {
          runBlocks.push(initializationFn);
          return this;
        },
      };

      if (configFn) {
        config(configFn);
      }

      return moduleInstance;

      /**
       * @param {string} provider
       * @param {string} method
       * @param {String=} insertMethod
       * @param {Array<any>} [queue]
       * @returns {import('./types').Module}
       */
      function invokeLater(provider, method, insertMethod, queue) {
        if (!queue) queue = invokeQueue;
        return function () {
          queue[insertMethod || "push"]([provider, method, arguments]);
          return moduleInstance;
        };
      }

      /**
       * @param {string} provider
       * @param {string} method
       * @returns {import('./types').Module}
       */
      function invokeLaterAndSetModuleName(provider, method, queue) {
        if (!queue) queue = invokeQueue;
        return function (recipeName, factoryFunction) {
          if (factoryFunction && isFunction(factoryFunction))
            factoryFunction.$$moduleName = name;
          queue.push([provider, method, arguments]);
          return moduleInstance;
        };
      }
    });
  }

  /**
 * @module angular
 * @function reloadWithDebugInfo

 * @description
 * Use this function to reload the current application with debug information turned on.
 * This takes precedence over a call to `$compileProvider.debugInfoEnabled(false)`.
 *
 * See {@link ng.$compileProvider#debugInfoEnabled} for more.
 */
  reloadWithDebugInfo() {
    window.name = `NG_ENABLE_DEBUG_INFO!${window.name}`;
    window.location.reload();
  }
}

/// //////////////////////////////////////////////

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
export function angularInit(element) {
  let appElement;
  let module;
  const config = {};

  // The element `element` has priority over any other element.
  ngAttrPrefixes.forEach((prefix) => {
    const name = `${prefix}app`;

    if (!appElement && element.hasAttribute && element.hasAttribute(name)) {
      appElement = element;
      module = element.getAttribute(name);
    }
  });
  ngAttrPrefixes.forEach((prefix) => {
    const name = `${prefix}app`;
    let candidate;

    if (
      !appElement &&
      (candidate = element.querySelector(`[${name.replace(":", "\\:")}]`))
    ) {
      appElement = candidate;
      module = candidate.getAttribute(name);
    }
  });
  if (appElement) {
    config.strictDi = getNgAttribute(appElement, "strict-di") !== null;
    window["angular"].bootstrap(appElement, module ? [module] : [], config);
  }
}

/**
 * @ngdoc type
 * @name import('./types').Module
 * @module ng
 * @description
 *
 * Interface for configuring AngularJS {@link angular.module modules}.
 */
export function setupModuleLoader(window) {
  const $injectorMinErr = minErr("$injector");

  function ensure(obj, name, factory) {
    return obj[name] || (obj[name] = factory());
  }

  const angular = ensure(window, "angular", Object);

  // We need to expose `angular.$$minErr` to modules such as `ngResource` that reference it during bootstrap
  angular.$$minErr = angular.$$minErr || minErr;

  return ensure(angular, "module", () => {
    /** @type {Object.<string, import('./types').Module>} */
    const modules = {};

    /**
     * @ngdoc function
     * @name angular.module
     * @module ng
     * @description
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
    return function module(name, requires, configFn) {
      let info = {};

      assertNotHasOwnProperty(name, "module");
      if (requires && Object.prototype.hasOwnProperty.call(modules, name)) {
        modules[name] = null;
      }
      return ensure(modules, name, () => {
        if (!requires) {
          throw $injectorMinErr(
            "nomod",
            "Module '{0}' is not available! You either misspelled " +
              "the module name or forgot to load it. If registering a module ensure that you " +
              "specify the dependencies as the second argument.",
            name,
          );
        }

        /** @type {!Array.<Array.<*>>} */
        const invokeQueue = [];

        /** @type {!Array.<Function>} */
        const configBlocks = [];

        /** @type {!Array.<Function>} */
        const runBlocks = [];

        const config = invokeLater("$injector", "invoke", "push", configBlocks);

        /** @type {import('./types').Module} */
        const moduleInstance = {
          // Private state
          _invokeQueue: invokeQueue,
          _configBlocks: configBlocks,
          _runBlocks: runBlocks,

          /**
           * @name import('./types').Module#info
           * @module ng
           *
           * @param {Object=} value Information about the module
           * @returns {Object|import('./types').Module} The current info object for this module if called as a getter,
           *                          or `this` if called as a setter.
           *
           * Read and write custom information about this module.
           * For example you could put the version of the module in here.
           *
           * ```js
           * angular.module('myModule', []).info({ version: '1.0.0' });
           * ```
           *
           * The version could then be read back out by accessing the module elsewhere:
           *
           * ```
           * let version = angular.module('myModule').info().version;
           * ```
           *
           * You can also retrieve this information during runtime via the
           * {@link $injector#modules `$injector.modules`} property:
           *
           * ```js
           * let version = $injector.modules['myModule'].info().version;
           * ```
           */
          info(value) {
            if (isDefined(value)) {
              if (!isObject(value))
                throw ngMinErr(
                  "aobj",
                  "Argument '{0}' must be an object",
                  "value",
                );
              info = value;
              return this;
            }
            return info;
          },

          /**
           * @ngdoc property
           * @name import('./types').Module#requires
           * @module ng
           *
           * Holds the list of modules which the injector will load before the current module is
           * loaded.
           */
          requires,

          /**
           * @ngdoc property
           * @name import('./types').Module#name
           * @module ng
           *
           * Name of the module.
           */
          name,

          /**
           * @name import('./types').Module#provider
           * @param {string} name service name
           * @param {Function} providerType Construction function for creating new instance of the
           *                                service.
           * See {@link auto.$provide#provider $provide.provider()}.
           */
          provider: invokeLaterAndSetModuleName("$provide", "provider"),

          /**
           * @name import('./types').Module#factory
           * @param {string} name service name
           * @param {Function} providerFunction Function for creating new instance of the service.
           * See {@link auto.$provide#factory $provide.factory()}.
           */
          factory: invokeLaterAndSetModuleName("$provide", "factory"),

          /**
           * @name import('./types').Module#service
           * @param {string} name service name
           * @param {Function} constructor A constructor function that will be instantiated.
           * See {@link auto.$provide#service $provide.service()}.
           */
          service: invokeLaterAndSetModuleName("$provide", "service"),

          /**
           * @name import('./types').Module#value
           * @param {string} name service name
           * @param {*} object Service instance object.
           * See {@link auto.$provide#value $provide.value()}.
           */
          value: invokeLater("$provide", "value"),

          /**
           * @name import('./types').Module#constant
           * @param {string} name constant name
           * @param {*} object Constant value.
           * Because the constants are fixed, they get applied before other provide methods.
           * See {@link auto.$provide#constant $provide.constant()}.
           */
          constant: invokeLater("$provide", "constant", "unshift"),

          /**
           * @name import('./types').Module#decorator
           * @param {string} name The name of the service to decorate.
           * @param {Function} decorFn This function will be invoked when the service needs to be
           *                           instantiated and should return the decorated service instance.
           * See {@link auto.$provide#decorator $provide.decorator()}.
           */
          decorator: invokeLaterAndSetModuleName(
            "$provide",
            "decorator",
            configBlocks,
          ),

          /**
           * @name import('./types').Module#animation
           * @param {string} name animation name
           * @param {Function} animationFactory Factory function for creating new instance of an
           *                                    animation.
           *
           * **NOTE**: animations take effect only if the **ngAnimate** module is loaded.
           *
           *
           * Defines an animation hook that can be later used with
           * {@link $animate $animate} service and directives that use this service.
           *
           * ```js
           * module.animation('.animation-name', function($inject1, $inject2) {
           *   return {
           *     eventName : function(element, done) {
           *       //code to run the animation
           *       //once complete, then run done()
           *       return function cancellationFunction(element) {
           *         //code to cancel the animation
           *       }
           *     }
           *   }
           * })
           * ```
           *
           * See {@link ng.$animateProvider#register $animateProvider.register()} and
           * {@link ngAnimate ngAnimate module} for more information.
           */
          animation: invokeLaterAndSetModuleName(
            "$animateProvider",
            "register",
          ),

          /**
           * @name import('./types').Module#filter
           * @param {string} name Filter name - this must be a valid AngularJS expression identifier
           * @param {Function} filterFactory Factory function for creating new instance of filter.
           * See {@link ng.$filterProvider#register $filterProvider.register()}.
           *
           * <div class="alert alert-warning">
           * **Note:** Filter names must be valid AngularJS {@link expression} identifiers, such as `uppercase` or `orderBy`.
           * Names with special characters, such as hyphens and dots, are not allowed. If you wish to namespace
           * your filters, then you can use capitalization (`myappSubsectionFilterx`) or underscores
           * (`myapp_subsection_filterx`).
           * </div>
           */
          filter: invokeLaterAndSetModuleName("$filterProvider", "register"),

          /**
           * @name import('./types').Module#controller
           * @param {string|Object} name Controller name, or an object map of controllers where the
           *    keys are the names and the values are the constructors.
           * @param {Function} constructor Controller constructor function.
           * See {@link ng.$controllerProvider#register $controllerProvider.register()}.
           */
          controller: invokeLaterAndSetModuleName(
            "$controllerProvider",
            "register",
          ),

          /**
           * @name import('./types').Module#directive
           * @param {string|Object} name Directive name, or an object map of directives where the
           *    keys are the names and the values are the factories.
           * @param {Function} directiveFactory Factory function for creating new instance of
           * directives.
           * See {@link ng.$compileProvider#directive $compileProvider.directive()}.
           */
          directive: invokeLaterAndSetModuleName(
            "$compileProvider",
            "directive",
          ),

          /**
           * @name import('./types').Module#component
           * @param {string|Object} name Name of the component in camelCase (i.e. `myComp` which will match `<my-comp>`),
           *    or an object map of components where the keys are the names and the values are the component definition objects.
           * @param {Object} options Component definition object (a simplified
           *    {@link ng.$compile#directive-definition-object directive definition object})
           *
           * See {@link ng.$compileProvider#component $compileProvider.component()}.
           */
          component: invokeLaterAndSetModuleName(
            "$compileProvider",
            "component",
          ),

          /**
           * @name import('./types').Module#config
           * @param {Function} configFn Execute this function on module load. Useful for service
           *    configuration.
           * Use this method to configure services by injecting their
           * {@link import('./types').Module#provider `providers`}, e.g. for adding routes to the
           * {@link ngRoute.$routeProvider $routeProvider}.
           *
           * Note that you can only inject {@link import('./types').Module#provider `providers`} and
           * {@link import('./types').Module#constant `constants`} into this function.
           *
           * For more about how to configure services, see
           * {@link providers#provider-recipe Provider Recipe}.
           */
          config,

          /**
           * @name import('./types').Module#run
           * @param {Function} block Execute this function after injector creation.
           *    Useful for application initialization.
           * Use this method to register work which should be performed when the injector is done
           * loading all modules.
           */
          run(block) {
            runBlocks.push(block);
            return this;
          },
        };

        if (configFn) {
          config(configFn);
        }

        return moduleInstance;

        /**
         * @param {string} provider
         * @param {string} method
         * @param {String=} [insertMethod]
         * @param {Array<any>} [queue]
         * @returns {import('./types').Module}
         */
        function invokeLater(provider, method, insertMethod, queue) {
          if (!queue) queue = invokeQueue;
          return function () {
            queue[insertMethod || "push"]([provider, method, arguments]);
            return moduleInstance;
          };
        }

        /**
         * @param {string} provider
         * @param {string} method
         * @returns {import('./types').Module}
         */
        function invokeLaterAndSetModuleName(provider, method, queue) {
          if (!queue) queue = invokeQueue;
          return function (recipeName, factoryFunction) {
            if (factoryFunction && isFunction(factoryFunction))
              factoryFunction.$$moduleName = name;
            queue.push([provider, method, arguments]);
            return moduleInstance;
          };
        }
      });
    };
  });
}
