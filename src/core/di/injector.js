import {
  isBoolean,
  isDefined,
  isString,
  minErr,
  valueFn,
  isObject,
  forEach,
  reverseParams,
  isUndefined,
  isFunction,
  assertNotHasOwnProperty,
  assertArgFn,
  assertArg,
} from "../../shared/utils";
import { InternalInjector } from "./internal-injector";

const ARROW_ARG = /^([^(]+?)=>/;
const FN_ARGS = /^[^(]*\(\s*([^)]*)\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;

const $injectorMinErr = minErr("$injector");

export class Injector {
  constructor(modulesToLoad, strictDi) {
    if (isDefined(strictDi) && !isBoolean(strictDi)) {
      throw $injectorMinErr("strictDi must be boolean");
    }
    this.strictDi = !!strictDi;
    this.path = [];
    this.loadedModules = new Map();
    this.providerCache = {
      $provide: {
        provider: this.supportObject(this.provider.bind(this)),
        factory: this.supportObject(this.factory.bind(this)),
        service: this.supportObject(this.service.bind(this)),
        value: this.supportObject(this.value.bind(this)),
        constant: this.supportObject(this.constant.bind(this)),
        decorator: this.decorator.bind(this),
      },
    };
    this.providerInjector = new InternalInjector(
      this.providerCache,
      (serviceName, caller) => {
        if (isString(caller)) {
          this.path.push(caller);
        }
        throw $injectorMinErr(
          "unpr",
          "Unknown provider: {0}",
          this.path.join(" <- "),
        );
      },
      this.strictDi,
      this.annotate.bind(this),
    );
    this.instanceCache = {};
    this.protoInstanceInjector = new InternalInjector(
      this.instanceCache,
      (serviceName, caller) => {
        const provider = this.providerInjector.get(
          serviceName + this.providerSuffix,
          caller,
        );
        return this.instanceInjector.invoke(
          provider.$get,
          provider,
          undefined,
          serviceName,
        );
      },
      this.strictDi,
      this.annotate.bind(this),
    );

    this.providerCache["$injector" + this.providerSuffix] = {
      $get: valueFn(this.protoInstanceInjector),
    };
    this.instanceInjector = this.protoInstanceInjector;
    this.instanceInjector.modules = this.providerInjector.modules =
      Object.create(null);
    const runBlocks = this.loadModules(modulesToLoad);
    this.instanceInjector = this.protoInstanceInjector.get("$injector");
    this.instanceInjector.strictDi = this.strictDi;
    runBlocks.forEach((fn) => {
      if (fn) this.instanceInjector.invoke(fn);
    });

    this.instanceInjector.loadNewModules = (mods) => {
      this.loadModules(mods).forEach((fn) => {
        if (fn) this.instanceInjector.invoke(fn);
      });
    };
  }

  get providerSuffix() {
    return "Provider";
  }

  supportObject(delegate) {
    return (key, value) => {
      if (isObject(key)) {
        forEach(key, reverseParams(delegate));
      } else {
        return delegate(key, value);
      }
    };
  }

  provider(name, provider_) {
    assertNotHasOwnProperty(name, "service");
    if (isFunction(provider_) || Array.isArray(provider_)) {
      provider_ = this.providerInjector.instantiate(provider_);
    }
    if (!provider_.$get) {
      throw $injectorMinErr(
        "pget",
        "Provider '{0}' must define $get factory method.",
        name,
      );
    }
    return (this.providerCache[name + this.providerSuffix] = provider_);
  }

  enforceReturnValue(name, factory) {
    return () => {
      const result = this.instanceInjector.invoke(factory, this);
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

  factory(name, factoryFn, enforce) {
    return this.provider(name, {
      $get:
        enforce !== false
          ? this.enforceReturnValue(name, factoryFn)
          : factoryFn,
    });
  }

  service(name, constructor) {
    return this.factory(name, [
      "$injector",
      ($injector) => $injector.instantiate(constructor),
    ]);
  }

  value(name, val) {
    return this.factory(name, valueFn(val), false);
  }

  constant(name, value) {
    assertNotHasOwnProperty(name, "constant");
    this.providerCache[name] = value;
    this.instanceCache[name] = value;
  }

  decorator(serviceName, decorFn) {
    const origProvider = this.providerInjector.get(
      serviceName + this.providerSuffix,
    );
    const orig$get = origProvider.$get;

    origProvider.$get = () => {
      const origInstance = this.instanceInjector.invoke(orig$get, origProvider);
      return this.instanceInjector.invoke(decorFn, null, {
        $delegate: origInstance,
      });
    };
  }

  loadModules(modulesToLoad) {
    assertArg(
      isUndefined(modulesToLoad) || Array.isArray(modulesToLoad),
      "modulesToLoad",
      "not an array",
    );
    const runBlocks = [];
    forEach(modulesToLoad, (module) => {
      if (this.loadedModules.get(module)) return;
      this.loadedModules.set(module, true);

      const runInvokeQueue = (queue) => {
        queue.forEach((invokeArgs) => {
          const provider = this.providerInjector.get(invokeArgs[0]);
          provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
        });
      };

      try {
        if (isString(module)) {
          const moduleFn = window["angular"].module(module);
          this.instanceInjector.modules[module] = moduleFn;
          runBlocks
            .concat(this.loadModules(moduleFn.requires))
            .concat(moduleFn.runBlocks);
          runInvokeQueue(moduleFn.invokeQueue);
          runInvokeQueue(moduleFn.configBlocks);
        } else if (isFunction(module)) {
          runBlocks.push(this.providerInjector.invoke(module));
        } else if (Array.isArray(module)) {
          runBlocks.push(this.providerInjector.invoke(module));
        } else {
          assertArgFn(module, "module");
        }
      } catch (e) {
        if (Array.isArray(module)) {
          module = module[module.length - 1];
        }
        if (e.message && e.stack && e.stack.indexOf(e.message) === -1) {
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

  annotate(fn, strictDi, name) {
    let $inject, argDecl, last;
    if (typeof fn === "function") {
      if (!($inject = fn.$inject)) {
        $inject = [];
        if (fn.length) {
          if (strictDi) {
            if (!isString(name) || !name) {
              name = fn.name || this.anonFn(fn);
            }
            throw $injectorMinErr(
              "strictdi",
              "{0} is not using explicit annotation and cannot be invoked in strict mode",
              name,
            );
          }
          argDecl = this.extractArgs(fn);
          forEach(argDecl[1].split(FN_ARG_SPLIT), (arg) => {
            arg.replace(FN_ARG, (all, underscore, name) => {
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

  stringifyFn(fn) {
    return Function.prototype.toString.call(fn);
  }

  extractArgs(fn) {
    const fnText = this.stringifyFn(fn).replace(STRIP_COMMENTS, "");
    const args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS);
    return args;
  }

  anonFn(fn) {
    const args = this.extractArgs(fn);
    if (args) {
      return "function(" + (args[1] || "").replace(/[\s\r\n]+/, " ") + ")";
    }
    return "fn";
  }
}
