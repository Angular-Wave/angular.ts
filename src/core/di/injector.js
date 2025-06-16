import {
  assertArgFn,
  minErr,
  isFunction,
  isString,
  isUndefined,
  assertArg,
  assertNotHasOwnProperty,
  isObject,
  assert,
} from "../../shared/utils.js";
import { INJECTOR_LITERAL } from "./ng-module";
import { ProviderInjector, InjectorService } from "./internal-injector";

const ARROW_ARG = /^([^(]+?)=>/;
const FN_ARGS = /^[^(]*\(\s*([^)]*)\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const $injectorMinErr = minErr(INJECTOR_LITERAL);

const providerSuffix = "Provider";
/** @type {String[]} Used only for error reporting of circular dependencies*/
export const path = [];

/**
 *
 * @param {Array<String|Function>} modulesToLoad
 * @param {boolean} [strictDi]
 * @returns {InjectorService}
 */
export function createInjector(modulesToLoad, strictDi = false) {
  assert(Array.isArray(modulesToLoad), "modules required");

  /** @type {Map<String|Function, boolean>} */
  const loadedModules = new Map(); // Keep track of loaded modules to avoid circular dependencies

  const providerCache = {
    /**
     * @type {import('../../interface.ts').Provider}
     */
    $provide: {
      provider: supportObject(provider),
      factory: supportObject(factory),
      service: supportObject(service),
      value: supportObject(value),
      constant: supportObject(constant),
      decorator,
    },
  };

  const providerInjector = (providerCache.$injector = new ProviderInjector(
    providerCache,
    strictDi,
  ));

  const protoInstanceInjector = new InjectorService(strictDi, providerInjector);

  providerCache.$injectorProvider = {
    // $injectionProvider return instance injector
    $get: () => protoInstanceInjector,
  };

  let instanceInjector = protoInstanceInjector;
  const runBlocks = loadModules(modulesToLoad);
  instanceInjector = protoInstanceInjector.get(INJECTOR_LITERAL);

  runBlocks.forEach((fn) => {
    if (fn) instanceInjector.invoke(fn);
  });

  instanceInjector.loadNewModules = function (mods) {
    loadModules(mods).forEach((fn) => {
      if (fn) instanceInjector.invoke(fn);
    });
  };

  return instanceInjector;

  ////////////////////////////////////
  // $provide methods
  ////////////////////////////////////

  /**
   * Registers a provider.
   * @param {string} name
   * @param {import('../../interface.ts').ServiceProvider | import('../../interface.ts').InjectableFactory} provider
   * @returns {import('../../interface.ts').ServiceProvider}
   */
  function provider(name, provider) {
    assertNotHasOwnProperty(name, "service");
    let newProvider;
    if (isFunction(provider) || Array.isArray(provider)) {
      newProvider = providerInjector.instantiate(
        /** @type {Function} */ (provider),
      );
    } else {
      newProvider = provider;
    }
    if (!newProvider.$get) {
      throw $injectorMinErr(
        "pget",
        "Provider '{0}' must define $get factory method.",
        name,
      );
    }
    providerCache[name + providerSuffix] = newProvider;
    return newProvider;
  }

  /**
   * Registers a factory.
   * @param {string} name
   * @param {(string|(function(*): *))[]} factoryFn
   * @returns {import('../../interface.js').ServiceProvider}
   */
  function factory(name, factoryFn) {
    return provider(name, {
      $get: () => {
        const result = instanceInjector.invoke(factoryFn, this);
        if (isUndefined(result)) {
          throw $injectorMinErr(
            "undef",
            "Provider '{0}' must return a value from $get factory method.",
            name,
          );
        }
        return result;
      },
    });
  }

  /**
   * Registers a service constructor.
   * @param {string} name
   * @param {Function} constructor
   * @returns {import('../../interface.js').ServiceProvider}
   */
  function service(name, constructor) {
    return factory(name, [
      INJECTOR_LITERAL,
      ($injector) => $injector.instantiate(constructor),
    ]);
  }

  /**
   * Register a fixed value as a service.
   * @param {String} name
   * @param {any} val
   * @returns {import('../../interface.ts').ServiceProvider}
   */
  function value(name, val) {
    return (providerCache[name + providerSuffix] = { $get: () => val });
  }

  /**
   * Register a constant value (available during config).
   * @param {string} name
   * @param {any} value
   * @returns {void}
   */
  function constant(name, value) {
    assertNotHasOwnProperty(name, "constant");
    providerInjector.cache[name] = value;
    protoInstanceInjector.cache[name] = value;
  }

  /**
   * Register a decorator function to modify or replace an existing service.
   * @param name - The name of the service to decorate.
   * @param fn - A function that takes `$delegate` and returns a decorated service.
   * @returns {void}
   */
  function decorator(serviceName, decorFn) {
    const origProvider = providerInjector.get(serviceName + providerSuffix);
    const origGet = origProvider.$get;

    origProvider.$get = function () {
      const origInstance = instanceInjector.invoke(origGet, origProvider);
      return instanceInjector.invoke(decorFn, null, {
        $delegate: origInstance,
      });
    };
  }

  /**
   *
   * @param {Array<String|Function>} modulesToLoad
   * @returns
   */
  function loadModules(modulesToLoad) {
    assertArg(
      isUndefined(modulesToLoad) || Array.isArray(modulesToLoad),
      "modulesToLoad",
      "not an array",
    );
    let runBlocks = [];

    modulesToLoad.forEach((module) => {
      if (loadedModules.get(module)) return;
      loadedModules.set(module, true);

      try {
        if (isString(module)) {
          /** @type {import('./ng-module').NgModule} */
          const moduleFn = window["angular"].module(module);
          instanceInjector.modules[/** @type {string } */ (module)] = moduleFn;
          runBlocks = runBlocks
            .concat(loadModules(moduleFn.requires))
            .concat(moduleFn.runBlocks);

          const invokeQueue = moduleFn.invokeQueue.concat(
            moduleFn.configBlocks,
          );
          invokeQueue.forEach((invokeArgs) => {
            const provider = providerInjector.get(invokeArgs[0]);
            provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
          });
        } else if (isFunction(module)) {
          runBlocks.push(providerInjector.invoke(module));
        } else if (Array.isArray(module)) {
          runBlocks.push(providerInjector.invoke(module));
        } else {
          assertArgFn(module, "module");
        }
      } catch (e) {
        if (Array.isArray(module)) {
          module = module[module.length - 1];
        }
        if (e.message && e.stack && e.stack.indexOf(e.message) === -1) {
          // Safari & FF's stack traces don't contain error.message content
          // unlike those of Chrome and IE
          // So if stack doesn't contain message, we create a new string that contains both.
          // Since error.stack is read-only in Safari, I'm overriding e and not e.stack here.

          e.message = `${e.message}\n${e.stack}`;
        }
        throw $injectorMinErr(
          "modulerr",
          "Failed to instantiate module {0} due to:\n{1}",
          module,
          e.stack || e.message || e,
        );
      }
    });
    return runBlocks;
  }
}

// Helpers

/**
 * @param {String} fn
 * @returns {String}
 */
function stringifyFn(fn) {
  return Function.prototype.toString.call(fn);
}

/**
 * @param {String} fn
 * @returns {Array<any>}
 */
function extractArgs(fn) {
  const fnText = stringifyFn(fn).replace(STRIP_COMMENTS, "");
  const args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS);
  return args;
}

/**
 *
 * @param {any} fn
 * @param {boolean} [strictDi]
 * @param {String} [name]
 * @returns {Array<string>}
 */
export function annotate(fn, strictDi, name) {
  let $inject, argDecl, last;

  if (typeof fn === "function") {
    if (!($inject = fn.$inject)) {
      $inject = [];
      if (fn.length) {
        if (strictDi) {
          throw $injectorMinErr(
            "strictdi",
            "{0} is not using explicit annotation and cannot be invoked in strict mode",
            name,
          );
        }
        argDecl = extractArgs(/** @type {String} */ (fn));
        argDecl[1].split(FN_ARG_SPLIT).forEach(function (arg) {
          arg.replace(FN_ARG, function (all, underscore, name) {
            $inject.push(name);
          });
        });
      }
      fn.$inject = $inject;
    }
  } else if (Array.isArray(fn)) {
    last = /** @type {Array} */ (fn).length - 1;
    assertArgFn(fn[last], "fn");
    $inject = /** @type {Array} */ (fn).slice(0, last);
  } else {
    assertArgFn(fn, "fn", true);
  }
  return $inject;
}

/**
 * @param {function(string, any):any} delegate
 * @returns {any}
 */
function supportObject(delegate) {
  return function (key, value) {
    if (isObject(key)) {
      Object.entries(key).forEach(([k, v]) => {
        delegate(k, v);
      });
    } else {
      return delegate(key, value);
    }
  };
}
