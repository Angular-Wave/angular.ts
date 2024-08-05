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
} from "../../shared/utils";
import { INJECTOR_LITERAL } from "./ng-module";

const ARROW_ARG = /^([^(]+?)=>/;
const FN_ARGS = /^[^(]*\(\s*([^)]*)\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const $injectorMinErr = minErr(INJECTOR_LITERAL);

const providerSuffix = "Provider";
const INSTANTIATING = {};
/** @type {String[]} Used only for error reporting of circular dependencies*/
const path = [];

/**
 *
 * @param {Array<String|Function>} modulesToLoad
 * @param {boolean} [strictDi]
 * @returns {import("../../types").InjectorService}
 */
export function createInjector(modulesToLoad, strictDi = false) {
  assert(Array.isArray(modulesToLoad), "modules required");

  /** @type {Map<String|Function, boolean>} */
  const loadedModules = new Map(); // Keep track of loaded modules to avoid circular dependencies

  const providerCache = {
    $provide: {
      provider: supportObject(provider),
      factory: supportObject(factory),
      service: supportObject(service),
      value: supportObject(value),
      constant: supportObject(constant),
      decorator,
    },
  };

  const providerInjector = (providerCache.$injector = createInternalInjector(
    providerCache,
    (caller) => {
      path.push(caller);
      // prevents lookups to providers through get
      throw $injectorMinErr("unpr", "Unknown provider: {0}", path.join(" <- "));
    },
  ));
  const instanceCache = {};
  const protoInstanceInjector = createInternalInjector(
    instanceCache,
    (serviceName, caller) => {
      const provider = providerInjector.get(
        serviceName + providerSuffix,
        caller,
      );

      return instanceInjector.invoke(
        provider.$get,
        provider,
        undefined,
        serviceName,
      );
    },
  );

  providerCache.$injectorProvider = {
    // $injectionProvider return instance injector
    $get: () => protoInstanceInjector,
  };
  let instanceInjector = protoInstanceInjector;
  instanceInjector.modules = providerInjector.modules = Object.create(null);
  const runBlocks = loadModules(modulesToLoad);
  instanceInjector = protoInstanceInjector.get(INJECTOR_LITERAL);
  instanceInjector.strictDi = strictDi;
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
  // $provider
  ////////////////////////////////////

  /**
   *
   * @param {string} name
   * @param {import('../../types').ServiceProvider} provider
   * @returns
   */
  function provider(name, provider) {
    assertNotHasOwnProperty(name, "service");
    let newProvider;
    if (isFunction(provider) || Array.isArray(provider)) {
      newProvider = providerInjector.instantiate(provider);
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

  function service(name, constructor) {
    return factory(name, [
      INJECTOR_LITERAL,
      ($injector) => $injector.instantiate(constructor),
    ]);
  }

  /**
   * @param {String} name
   * @param {any} val
   * @returns {import('../../types').ServiceProvider}
   */
  function value(name, val) {
    return (providerCache[name + providerSuffix] = { $get: () => val });
  }

  function constant(name, value) {
    assertNotHasOwnProperty(name, "constant");
    providerCache[name] = value;
    instanceCache[name] = value;
  }

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

  ////////////////////////////////////
  // Module Loading
  ////////////////////////////////////
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

      /**
       *
       * @param {Array<Array<any>>} queue
       */
      function runInvokeQueue(queue) {
        queue.forEach((invokeArgs) => {
          const provider = providerInjector.get(invokeArgs[0]);
          provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
        });
      }

      try {
        if (isString(module)) {
          /** @type {import('./ng-module').NgModule} */
          let moduleFn = window["angular"].module(module);
          instanceInjector.modules[/** @type {string } */ (module)] = moduleFn;
          runBlocks = runBlocks
            .concat(loadModules(moduleFn.requires))
            .concat(moduleFn.runBlocks);
          runInvokeQueue(moduleFn.invokeQueue);
          runInvokeQueue(moduleFn.configBlocks);
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

  ////////////////////////////////////
  // internal Injector
  ////////////////////////////////////

  function createInternalInjector(cache, factory) {
    function get(serviceName, caller) {
      if (Object.prototype.hasOwnProperty.call(cache, serviceName)) {
        if (cache[serviceName] === INSTANTIATING) {
          throw $injectorMinErr(
            "cdep",
            "Circular dependency found: {0}",
            `${serviceName} <- ${path.join(" <- ")}`,
          );
        }
        return cache[serviceName];
      }

      path.unshift(serviceName);
      cache[serviceName] = INSTANTIATING;
      try {
        // this goes to line 60
        cache[serviceName] = factory(serviceName, caller);
      } catch (err) {
        // this is for the error handling being thrown by the providerCache multiple times
        delete cache[serviceName];
        throw err;
      }
      return cache[serviceName];
    }

    function injectionArgs(fn, locals, serviceName) {
      const args = [];
      const $inject = annotate(fn, strictDi, serviceName);

      for (let i = 0, { length } = $inject; i < length; i++) {
        const key = $inject[i];
        if (typeof key !== "string") {
          throw $injectorMinErr(
            "itkn",
            "Incorrect injection token! Expected service name as string, got {0}",
            key,
          );
        }
        args.push(
          locals && Object.prototype.hasOwnProperty.call(locals, key)
            ? locals[key]
            : get(key, serviceName),
        );
      }
      return args;
    }

    function invoke(fn, self, locals, serviceName) {
      if (typeof locals === "string") {
        serviceName = locals;
        locals = null;
      }

      const args = injectionArgs(fn, locals, serviceName);
      if (Array.isArray(fn)) {
        fn = fn[fn.length - 1];
      }

      if (isClass(fn)) {
        args.unshift(null);
        return new (Function.prototype.bind.apply(fn, args))();
      } else {
        return fn.apply(self, args);
      }
    }

    function instantiate(Type, locals, serviceName) {
      // Check if Type is annotated and use just the given function at n-1 as parameter
      // e.g. someModule.factory('greeter', ['$window', function(renamed$window) {}]);
      const ctor = Array.isArray(Type) ? Type[Type.length - 1] : Type;
      const args = injectionArgs(Type, locals, serviceName);
      // Empty object at position 0 is ignored for invocation with `new`, but required.
      args.unshift(null);
      return new (Function.prototype.bind.apply(ctor, args))();
    }

    /**
     *
     * @param {String} name
     * @returns {boolean}
     */
    function has(name) {
      const hasProvider = Object.prototype.hasOwnProperty.call(
        providerCache,
        name + providerSuffix,
      );
      const hasCache = Object.prototype.hasOwnProperty.call(cache, name);
      return hasProvider || hasCache;
    }

    return {
      invoke,
      instantiate,
      get,
      annotate,
      has,
    };
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
 * @param {String} func
 * @returns {boolean}
 */
function isClass(func) {
  return /^class\b/.test(stringifyFn(func));
}

/**
 *
 * @param {any} fn
 * @param {boolean} strictDi
 * @param {String} name
 * @returns {Array<string>}
 */
function annotate(fn, strictDi, name) {
  var $inject, argDecl, last;

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
 * @returns
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
