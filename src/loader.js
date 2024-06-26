import {
  minErr,
  extend,
  forEach,
  getNgAttribute,
  isFunction,
  isObject,
  ngAttrPrefixes,
  isDefined,
  isDate,
  isElement,
  isNumber,
  isString,
  isUndefined,
  merge,
  bind,
  fromJson,
  toJson,
  identity,
  equals,
  assertNotHasOwnProperty,
  isBoolean,
  isValidObjectMaxDepth,
  minErrConfig,
} from "./shared/utils";
import { jqLite, startingTag } from "./jqLite";
import { createInjector } from "./injector";
import { CACHE } from "./core/cache";

const ngMinErr = minErr("ng");

/** @type {Object.<string, angular.IModule>} */
const moduleCache = {};

/**
 * @type {ng.IAngularStatic}
 */
export class Angular {
  constructor() {
    this.cache = CACHE;
    this.cache.clear(); // a ensure new instance of angular gets a clean cache
    this.version = {
      full: "",
      major: 0,
      minor: 0,
      dot: 0,
      codeName: "",
    };

    // Utility methods kept for backwards purposes
    this.bind = bind;
    this.equals = equals;
    this.element = jqLite;
    this.extend = extend;
    this.forEach = forEach;
    this.fromJson = fromJson;
    this.toJson = toJson;
    this.identity = identity;
    this.isDate = isDate;
    this.isDefined = isDefined;
    this.isElement = isElement;
    this.isFunction = isFunction;
    this.isNumber = isNumber;
    this.isObject = isObject;
    this.isString = isString;
    this.isUndefined = isUndefined;
    this.merge = merge;
    this.errorHandlingConfig = errorHandlingConfig;
  }

  /**
 * @module angular
 * @function bootstrap

 * @description
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
 * @param {Array<string | Function | any[]>=} modules an array of modules to load into the application.
 *     Each item in the array should be the name of a predefined module or a (DI annotated)
 *     function that will be invoked by the injector as a `config` block.
 *     See: {@link angular.module modules}
 * @param {angular.IAngularBootstrapConfig} config an object for defining configuration options for the application. The
 *     following keys are supported:
 *
 * * `strictDi` - disable automatic function annotation for the application. This is meant to
 *   assist in finding bugs which break minified code. Defaults to `false`.
 *
 * @returns {angular.auto.IInjectorService} Returns the newly created injector for this app.
 */
  bootstrap(element, modules, config) {
    // eslint-disable-next-line no-param-reassign
    if (!isObject(config)) config = {};
    const defaultConfig = {
      strictDi: false,
    };
    config = extend(defaultConfig, config);
    this.doBootstrap = function () {
      // @ts-ignore
      element = jqLite(element);

      if (element.injector()) {
        const tag =
          element[0] === window.document ? "document" : startingTag(element);
        // Encode angle brackets to prevent input from being sanitized to empty string #8683.
        throw ngMinErr(
          "btstrpd",
          "App already bootstrapped with this element '{0}'",
          tag.replace(/</, "&lt;").replace(/>/, "&gt;"),
        );
      }

      this.bootsrappedModules = modules || [];
      this.bootsrappedModules.unshift([
        "$provide",
        ($provide) => {
          $provide.value("$rootElement", element);
        },
      ]);

      if (config.debugInfoEnabled) {
        // Pushing so that this overrides `debugInfoEnabled` setting defined in user's `modules`.
        this.bootsrappedModules.push([
          "$compileProvider",
          function ($compileProvider) {
            $compileProvider.debugInfoEnabled(true);
          },
        ]);
      }

      this.bootsrappedModules.unshift("ng");

      const injector = createInjector(this.bootsrappedModules, config.strictDi);
      injector.invoke([
        "$rootScope",
        "$rootElement",
        "$compile",
        "$injector",
        function bootstrapApply(scope, el, compile, $injector) {
          scope.$apply(() => {
            el.data("$injector", $injector);
            compile(el)(scope);
          });
        },
      ]);
      return injector;
    };

    const NG_ENABLE_DEBUG_INFO = /^NG_ENABLE_DEBUG_INFO!/;
    const NG_DEFER_BOOTSTRAP = /^NG_DEFER_BOOTSTRAP!/;

    if (window && NG_ENABLE_DEBUG_INFO.test(window.name)) {
      config.debugInfoEnabled = true;
      window.name = window.name.replace(NG_ENABLE_DEBUG_INFO, "");
    }

    if (window && !NG_DEFER_BOOTSTRAP.test(window.name)) {
      return this.doBootstrap();
    }

    window.name = window.name.replace(NG_DEFER_BOOTSTRAP, "");
    this.resumeBootstrap = function (extraModules) {
      forEach(extraModules, function (module) {
        modules.push(module);
      });
      return this.doBootstrap();
    };

    if (isFunction(this.resumeDeferredBootstrap)) {
      this.resumeDeferredBootstrap();
    }
  }

  /**
   *
   * @param {any[]} modules
   * @param {boolean?} strictDi
   * @returns {angular.auto.IInjectorService}
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
   * Passing one argument retrieves an existing {@link angular.IModule},
   * whereas passing more than one argument creates a new {@link angular.IModule}
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
   *        {@link angular.IModule#config Module#config()}.
   * @returns {angular.IModule} new module with the {@link angular.IModule} api.
   */
  module(name, requires, configFn) {
    const $injectorMinErr = minErr("$injector");
    let info = {};

    assertNotHasOwnProperty(name, "module");
    if (requires && Object.prototype.hasOwnProperty.call(moduleCache, name)) {
      moduleCache[name] = null;
    }

    function ensure(obj, name, factory) {
      // eslint-disable-next-line no-return-assign, no-param-reassign
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

      // eslint-disable-next-line no-use-before-define
      const config = invokeLater("$injector", "invoke", "push", configBlocks);

      /** @type {angular.IModule} */
      const moduleInstance = {
        // Private state

        _invokeQueue: invokeQueue,
        _configBlocks: configBlocks,
        _runBlocks: runBlocks,

        /**
         * @ngdoc method
         * @name angular.IModule#info
         * @module ng
         *
         * @param {Object=} value Information about the module
         * @returns {Object|angular.IModule} The current info object for this module if called as a getter,
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
         * @name angular.IModule#requires
         * @module ng
         *
         * @description
         * Holds the list of modules which the injector will load before the current module is
         * loaded.
         */
        requires,

        /**
         * @ngdoc property
         * @name angular.IModule#name
         * @module ng
         *
         * @description
         * Name of the module.
         */
        name,

        /**
         * @ngdoc method
         * @name angular.IModule#provider
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
         * @name angular.IModule#factory
         * @module ng
         * @param {string} name service name
         * @param {Function} providerFunction Function for creating new instance of the service.
         * @description
         * See {@link auto.$provide#factory $provide.factory()}.
         */
        factory: invokeLaterAndSetModuleName("$provide", "factory"),

        /**
         * @ngdoc method
         * @name angular.IModule#service
         * @module ng
         * @param {string} name service name
         * @param {Function} constructor A constructor function that will be instantiated.
         * @description
         * See {@link auto.$provide#service $provide.service()}.
         */
        service: invokeLaterAndSetModuleName("$provide", "service"),

        /**
         * @ngdoc method
         * @name angular.IModule#value
         * @module ng
         * @param {string} name service name
         * @param {*} object Service instance object.
         * @description
         * See {@link auto.$provide#value $provide.value()}.
         */
        value: invokeLater("$provide", "value"),

        /**
         * @ngdoc method
         * @name angular.IModule#constant
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
         * @name angular.IModule#decorator
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
         * @name angular.IModule#animation
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
         * @name angular.IModule#filter
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
         * @name angular.IModule#controller
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
         * @name angular.IModule#directive
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
         * @name angular.IModule#component
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
         * @name angular.IModule#config
         * @module ng
         * @param {Function} configFn Execute this function on module load. Useful for service
         *    configuration.
         * @description
         * Use this method to configure services by injecting their
         * {@link angular.IModule#provider `providers`}, e.g. for adding routes to the
         * {@link ngRoute.$routeProvider $routeProvider}.
         *
         * Note that you can only inject {@link angular.IModule#provider `providers`} and
         * {@link angular.IModule#constant `constants`} into this function.
         *
         * For more about how to configure services, see
         * {@link providers#provider-recipe Provider Recipe}.
         */
        config,

        /**
         * @ngdoc method
         * @name angular.IModule#run
         * @module ng
         * @param {Function} initializationFn Execute this function after injector creation.
         *    Useful for application initialization.
         * @description
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
       * @param {String=} insertMethod
       * @returns {angular.IModule}
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
       * @returns {angular.IModule}
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
 * @param {angular.IModule} ngApp an optional application
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
    // Angular init is called manually, so why is this check here
    // if (!confGlobal.isAutoBootstrapAllowed) {
    //   window.console.error(
    //     "AngularJS: disabling automatic bootstrap. <script> protocol indicates an extension, document.location.href does not match.",
    //   );
    //   return;
    // }
    config.strictDi = getNgAttribute(appElement, "strict-di") !== null;
    //TODO maybe angular should be initialized here?
    window.angular.bootstrap(appElement, module ? [module] : [], config);
  }
}

/**
 * @ngdoc type
 * @name angular.IModule
 * @module ng
 * @description
 *
 * Interface for configuring AngularJS {@link angular.module modules}.
 */
export function setupModuleLoader(window) {
  const $injectorMinErr = minErr("$injector");

  function ensure(obj, name, factory) {
    // eslint-disable-next-line no-return-assign
    return obj[name] || (obj[name] = factory());
  }

  const angular = ensure(window, "angular", Object);

  // We need to expose `angular.$$minErr` to modules such as `ngResource` that reference it during bootstrap
  angular.$$minErr = angular.$$minErr || minErr;

  return ensure(angular, "module", () => {
    /** @type {Object.<string, angular.IModule>} */
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
     * Passing one argument retrieves an existing {@link angular.IModule},
     * whereas passing more than one argument creates a new {@link angular.IModule}
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
     *        {@link angular.IModule#config Module#config()}.
     * @returns {angular.IModule} new module with the {@link angular.IModule} api.
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

        // eslint-disable-next-line no-use-before-define
        const config = invokeLater("$injector", "invoke", "push", configBlocks);

        /** @type {angular.IModule} */
        const moduleInstance = {
          // Private state
          _invokeQueue: invokeQueue,
          _configBlocks: configBlocks,
          _runBlocks: runBlocks,

          /**
           * @ngdoc method
           * @name angular.IModule#info
           * @module ng
           *
           * @param {Object=} info Information about the module
           * @returns {Object|Module} The current info object for this module if called as a getter,
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
           * @name angular.IModule#requires
           * @module ng
           *
           * @description
           * Holds the list of modules which the injector will load before the current module is
           * loaded.
           */
          requires,

          /**
           * @ngdoc property
           * @name angular.IModule#name
           * @module ng
           *
           * @description
           * Name of the module.
           */
          name,

          /**
           * @ngdoc method
           * @name angular.IModule#provider
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
           * @name angular.IModule#factory
           * @module ng
           * @param {string} name service name
           * @param {Function} providerFunction Function for creating new instance of the service.
           * @description
           * See {@link auto.$provide#factory $provide.factory()}.
           */
          factory: invokeLaterAndSetModuleName("$provide", "factory"),

          /**
           * @ngdoc method
           * @name angular.IModule#service
           * @module ng
           * @param {string} name service name
           * @param {Function} constructor A constructor function that will be instantiated.
           * @description
           * See {@link auto.$provide#service $provide.service()}.
           */
          service: invokeLaterAndSetModuleName("$provide", "service"),

          /**
           * @ngdoc method
           * @name angular.IModule#value
           * @module ng
           * @param {string} name service name
           * @param {*} object Service instance object.
           * @description
           * See {@link auto.$provide#value $provide.value()}.
           */
          value: invokeLater("$provide", "value"),

          /**
           * @ngdoc method
           * @name angular.IModule#constant
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
           * @name angular.IModule#decorator
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
           * @name angular.IModule#animation
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
          animation: invokeLaterAndSetModuleName(
            "$animateProvider",
            "register",
          ),

          /**
           * @ngdoc method
           * @name angular.IModule#filter
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
           * @name angular.IModule#controller
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
           * @name angular.IModule#directive
           * @module ng
           * @param {string|Object} name Directive name, or an object map of directives where the
           *    keys are the names and the values are the factories.
           * @param {Function} directiveFactory Factory function for creating new instance of
           * directives.
           * @description
           * See {@link ng.$compileProvider#directive $compileProvider.directive()}.
           */
          directive: invokeLaterAndSetModuleName(
            "$compileProvider",
            "directive",
          ),

          /**
           * @ngdoc method
           * @name angular.IModule#component
           * @module ng
           * @param {string|Object} name Name of the component in camelCase (i.e. `myComp` which will match `<my-comp>`),
           *    or an object map of components where the keys are the names and the values are the component definition objects.
           * @param {Object} options Component definition object (a simplified
           *    {@link ng.$compile#directive-definition-object directive definition object})
           *
           * @description
           * See {@link ng.$compileProvider#component $compileProvider.component()}.
           */
          component: invokeLaterAndSetModuleName(
            "$compileProvider",
            "component",
          ),

          /**
           * @ngdoc method
           * @name angular.IModule#config
           * @module ng
           * @param {Function} configFn Execute this function on module load. Useful for service
           *    configuration.
           * @description
           * Use this method to configure services by injecting their
           * {@link angular.IModule#provider `providers`}, e.g. for adding routes to the
           * {@link ngRoute.$routeProvider $routeProvider}.
           *
           * Note that you can only inject {@link angular.IModule#provider `providers`} and
           * {@link angular.IModule#constant `constants`} into this function.
           *
           * For more about how to configure services, see
           * {@link providers#provider-recipe Provider Recipe}.
           */
          config,

          /**
           * @ngdoc method
           * @name angular.IModule#run
           * @module ng
           * @param {Function} initializationFn Execute this function after injector creation.
           *    Useful for application initialization.
           * @description
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
         * @param {String=} insertMethod
         * @returns {angular.IModule}
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
         * @returns {angular.IModule}
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

/**
 * @ngdoc function
 * @name angular.errorHandlingConfig
 * @module ng
 * @kind function
 *
 * @description
 * Configure several aspects of error handling in AngularJS if used as a setter or return the
 * current configuration if used as a getter. The following options are supported:
 *
 * - **objectMaxDepth**: The maximum depth to which objects are traversed when stringified for error messages.
 *
 * Omitted or undefined options will leave the corresponding configuration values unchanged.
 *
 * @param {Object=} config - The configuration object. May only contain the options that need to be
 *     updated. Supported keys:
 *
 * * `objectMaxDepth`  **{Number}** - The max depth for stringifying objects. Setting to a
 *   non-positive or non-numeric value, removes the max depth limit.
 *   Default: 5
 *
 * * `urlErrorParamsEnabled`  **{Boolean}** - Specifies whether the generated error url will
 *   contain the parameters of the thrown error. Disabling the parameters can be useful if the
 *   generated error url is very long.
 *
 *   Default: true. When used without argument, it returns the current value.
 */
export function errorHandlingConfig(config) {
  if (isObject(config)) {
    if (isDefined(config.objectMaxDepth)) {
      minErrConfig.objectMaxDepth = isValidObjectMaxDepth(config.objectMaxDepth)
        ? config.objectMaxDepth
        : NaN;
    }
    if (
      isDefined(config.urlErrorParamsEnabled) &&
      isBoolean(config.urlErrorParamsEnabled)
    ) {
      minErrConfig.urlErrorParamsEnabled = config.urlErrorParamsEnabled;
    }
  }
  return minErrConfig;
}
