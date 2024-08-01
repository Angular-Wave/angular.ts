import {
  assertArgFn,
  minErr,
  forEach,
  isFunction,
  isString,
  isBoolean,
  isUndefined,
  assertArg,
  valueFn,
  assertNotHasOwnProperty,
  reverseParams,
  isObject,
} from "./shared/utils";

import { InternalInjector } from "./core/di/internal-injector";

var ARROW_ARG = /^([^(]+?)=>/;
var FN_ARGS = /^[^(]*\(\s*([^)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
var $injectorMinErr = minErr("$injector");

function stringifyFn(fn) {
  return Function.prototype.toString.call(fn);
}

function extractArgs(fn) {
  var fnText = stringifyFn(fn).replace(STRIP_COMMENTS, ""),
    args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS);
  return args;
}

function anonFn(fn) {
  // For anonymous functions, showing at the very least the function signature can help in
  // debugging.
  var args = extractArgs(fn);
  if (args) {
    return "function(" + (args[1] || "").replace(/[\s\r\n]+/, " ") + ")";
  }
  return "fn";
}

function annotate(fn, strictDi, name) {
  var $inject, argDecl, last;

  if (typeof fn === "function") {
    if (!($inject = fn.$inject)) {
      $inject = [];
      if (fn.length) {
        if (strictDi) {
          if (!isString(name) || !name) {
            name = fn.name || anonFn(fn);
          }
          throw $injectorMinErr(
            "strictdi",
            "{0} is not using explicit annotation and cannot be invoked in strict mode",
            name,
          );
        }
        argDecl = extractArgs(fn);
        forEach(argDecl[1].split(FN_ARG_SPLIT), function (arg) {
          arg.replace(FN_ARG, function (all, underscore, name) {
            $inject.push(name);
          });
        });
      }
      fn.$inject = $inject;
    }
  } else if (Array.isArray(fn)) {
    last = fn.length - 1;
    assertArgFn(fn[last], "fn");
    $inject = fn.slice(0, last);
  } else {
    assertArgFn(fn, "fn", true);
  }
  return $inject;
}

const providerSuffix = "Provider";
const INSTANTIATING = {};

/**
 *
 * @param {Array<string|any>} modulesToLoad
 * @param {boolean} [strictDi]
 * @returns {import("./types").InjectorService}
 */
export function createInjector(modulesToLoad, strictDi = false) {
  console.assert(Array.isArray(modulesToLoad));
  console.assert(isBoolean(strictDi));

  const path = [];
  const loadedModules = new Map();
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
    function (caller) {
      if (isString(caller)) {
        path.push(caller);
      }
      throw $injectorMinErr("unpr", "Unknown provider: {0}", path.join(" <- "));
    },
  ));
  const instanceCache = {};

  let protoInstanceInjector = createInternalInjector(
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

  providerCache["$injector" + providerSuffix] = {
    $get: valueFn(protoInstanceInjector),
  };
  let instanceInjector = protoInstanceInjector;
  instanceInjector.modules = providerInjector.modules = Object.create(null);
  var runBlocks = loadModules(modulesToLoad);
  instanceInjector = protoInstanceInjector.get("$injector");
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

  function supportObject(delegate) {
    return function (key, value) {
      if (isObject(key)) {
        forEach(key, reverseParams(delegate));
      } else {
        return delegate(key, value);
      }
    };
  }

  function provider(name, provider_) {
    assertNotHasOwnProperty(name, "service");
    if (isFunction(provider_) || Array.isArray(provider_)) {
      provider_ = providerInjector.instantiate(provider_);
    }
    if (!provider_.$get) {
      throw $injectorMinErr(
        "pget",
        "Provider '{0}' must define $get factory method.",
        name,
      );
    }
    return (providerCache[name + providerSuffix] = provider_);
  }

  function enforceReturnValue(name, factory) {
    return function enforcedReturnValue() {
      const result = instanceInjector.invoke(factory, this);
      if (isUndefined(result)) {
        throw $injectorMinErr(
          "undef",
          "Provider '{0}' must return a value from $get factory method.",
          name,
        );
      }
      return result;
    };
  }

  function factory(name, factoryFn, enforce) {
    return provider(name, {
      $get: enforce !== false ? enforceReturnValue(name, factoryFn) : factoryFn,
    });
  }

  function service(name, constructor) {
    return factory(name, [
      "$injector",
      function ($injector) {
        return $injector.instantiate(constructor);
      },
    ]);
  }

  function value(name, val) {
    return factory(name, valueFn(val), false);
  }

  function constant(name, value) {
    assertNotHasOwnProperty(name, "constant");
    providerCache[name] = value;
    instanceCache[name] = value;
  }

  function decorator(serviceName, decorFn) {
    const origProvider = providerInjector.get(serviceName + providerSuffix);
    const orig$get = origProvider.$get;

    origProvider.$get = function () {
      const origInstance = instanceInjector.invoke(orig$get, origProvider);
      return instanceInjector.invoke(decorFn, null, {
        $delegate: origInstance,
      });
    };
  }

  ////////////////////////////////////
  // Module Loading
  ////////////////////////////////////
  function loadModules(modulesToLoad) {
    assertArg(
      isUndefined(modulesToLoad) || Array.isArray(modulesToLoad),
      "modulesToLoad",
      "not an array",
    );
    let runBlocks = [];

    forEach(modulesToLoad, (module) => {
      if (loadedModules.get(module)) return;
      loadedModules.set(module, true);

      function runInvokeQueue(queue) {
        queue.forEach((invokeArgs) => {
          const provider = providerInjector.get(invokeArgs[0]);
          provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
        });
      }

      try {
        if (isString(module)) {
          /** @type {import('./core/di/ng-module').NgModule} */
          let moduleFn = window["angular"].module(module);
          instanceInjector.modules[module] = moduleFn;
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
      try {
        path.unshift(serviceName);
        cache[serviceName] = INSTANTIATING;
        cache[serviceName] = factory(serviceName, caller);
        return cache[serviceName];
      } catch (err) {
        if (cache[serviceName] === INSTANTIATING) {
          delete cache[serviceName];
        }
        throw err;
      } finally {
        path.shift();
      }
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

    function isClass(func) {
      let result = func.$$ngIsClass;
      if (!isBoolean(result)) {
        result = func.$$ngIsClass = /^class\b/.test(stringifyFn(func));
      }
      return result;
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

      if (!isClass(fn)) {
        // http://jsperf.com/angularjs-invoke-apply-vs-switch
        // #5388
        return fn.apply(self, args);
      }
      args.unshift(null);
      return new (Function.prototype.bind.apply(fn, args))();
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

createInjector.$$annotate = annotate;
