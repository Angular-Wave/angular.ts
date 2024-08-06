import { assertArgFn, minErr } from "../../shared/utils";
import { INJECTOR_LITERAL } from "./ng-module";

const ARROW_ARG = /^([^(]+?)=>/;
const FN_ARGS = /^[^(]*\(\s*([^)]*)\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const $injectorMinErr = minErr(INJECTOR_LITERAL);

const providerSuffix = "Provider";
const INSTANTIATING = "INSTANTIATING";

export class ProviderInjector {
  /**
   *
   * @param {Object} cache
   * @param {boolean} strictDi
   */
  constructor(cache, strictDi) {
    this.cache = cache;
    this.strictDi = strictDi;
    this.path = [];
    this.providerCache = cache;
    this.modules = undefined;
  }

  factory(caller) {
    this.path.push(caller);
    // prevents lookups to providers through get
    throw $injectorMinErr(
      "unpr",
      "Unknown provider: {0}",
      this.path.join(" <- "),
    );
  }

  /**
   *
   * @param {String} serviceName
   * @returns {any}
   */
  get(serviceName) {
    if (Object.prototype.hasOwnProperty.call(this.cache, serviceName)) {
      if (this.cache[serviceName] === INSTANTIATING) {
        throw $injectorMinErr(
          "cdep",
          "Circular dependency found: {0}",
          `${serviceName} <- ${this.path.join(" <- ")}`,
        );
      }
      return this.cache[serviceName];
    }

    this.path.unshift(serviceName);
    this.cache[serviceName] = INSTANTIATING;
    try {
      // this goes to line 60
      this.cache[serviceName] = this.factory(serviceName);
    } catch (err) {
      // this is for the error handling being thrown by the providerCache multiple times
      delete this.cache[serviceName];
      throw err;
    }
    return this.cache[serviceName];
  }

  injectionArgs(fn, locals, serviceName) {
    const args = [];
    const $inject = annotate(fn, this.strictDi, serviceName);

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
          : this.get(key),
      );
    }
    return args;
  }

  invoke(fn, self, locals, serviceName) {
    if (typeof locals === "string") {
      serviceName = locals;
      locals = null;
    }

    const args = this.injectionArgs(fn, locals, serviceName);
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

  instantiate(Type, locals, serviceName) {
    // Check if Type is annotated and use just the given function at n-1 as parameter
    // e.g. someModule.factory('greeter', ['$window', function(renamed$window) {}]);
    const ctor = Array.isArray(Type) ? Type[Type.length - 1] : Type;
    const args = this.injectionArgs(Type, locals, serviceName);
    // Empty object at position 0 is ignored for invocation with `new`, but required.
    args.unshift(null);
    return new (Function.prototype.bind.apply(ctor, args))();
  }

  /**
   *
   * @param {String} name
   * @returns {boolean}
   */
  has(name) {
    const hasProvider = Object.prototype.hasOwnProperty.call(
      this.providerCache,
      name + providerSuffix,
    );
    const hasCache = Object.prototype.hasOwnProperty.call(this.cache, name);
    return hasProvider || hasCache;
  }
}

export class InjectorService extends ProviderInjector {
  constructor(cache, strictDi, providerInjector) {
    super(cache, strictDi);
    this.strictDi = strictDi;
    this.providerInjector = providerInjector;
    this.providerCache = providerInjector.cache;
    this.modules = undefined;
  }

  factory(serviceName, caller) {
    const provider = this.providerInjector.get(
      serviceName + providerSuffix,
      caller,
    );
    const res = this.invoke(provider.$get, provider, undefined, serviceName);
    return res;
  }

  // Gets overridden
  loadNewModules() {}
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
