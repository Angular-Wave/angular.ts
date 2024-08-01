import { isBoolean, minErr } from "../../shared/utils";

var $injectorMinErr = minErr("$injector");

export class InternalInjector {
  constructor(cache, factory, strictDi, annotateFn, path) {
    this.cache = cache;
    this.factory = factory;
    this.strictDi = strictDi;
    this.annotateFn = annotateFn;
    this.path = path || [];
    this.INSTANTIATING = {};
  }

  get(serviceName, caller) {
    if (Object.prototype.hasOwnProperty.call(this.cache, serviceName)) {
      if (this.cache[serviceName] === this.INSTANTIATING) {
        throw $injectorMinErr(
          "cdep",
          "Circular dependency found: {0}",
          `${serviceName} <- ${this.path.join(" <- ")}`,
        );
      }
      return this.cache[serviceName];
    }
    try {
      this.path.unshift(serviceName);
      this.cache[serviceName] = this.INSTANTIATING;
      this.cache[serviceName] = this.factory(serviceName, caller);
      return this.cache[serviceName];
    } catch (err) {
      if (this.cache[serviceName] === this.INSTANTIATING) {
        delete this.cache[serviceName];
      }
      throw err;
    } finally {
      this.path.shift();
    }
  }

  injectionArgs(fn, locals, serviceName) {
    const args = [];
    const $inject = this.annotateFn(fn, this.strictDi, serviceName);

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
          : this.get(key, serviceName),
      );
    }
    return args;
  }

  isClass(func) {
    let result = func.$$ngIsClass;
    if (!isBoolean(result)) {
      result = func.$$ngIsClass = /^class\b/.test(this.stringifyFn(func));
    }
    return result;
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

    if (!this.isClass(fn)) {
      return fn.apply(self, args);
    }
    args.unshift(null);
    return new (Function.prototype.bind.apply(fn, args))();
  }

  instantiate(Type, locals, serviceName) {
    const ctor = Array.isArray(Type) ? Type[Type.length - 1] : Type;
    const args = this.injectionArgs(Type, locals, serviceName);
    args.unshift(null);
    return new (Function.prototype.bind.apply(ctor, args))();
  }

  has(name) {
    const hasProvider = Object.prototype.hasOwnProperty.call(
      this.cache,
      name + "Provider",
    );
    const hasCache = Object.prototype.hasOwnProperty.call(this.cache, name);
    return hasProvider || hasCache;
  }

  stringifyFn(fn) {
    return Function.prototype.toString.call(fn);
  }
}
