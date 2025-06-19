import {
  isUndefined,
  nextUid,
  isObject,
  concat,
  isFunction,
  assert,
  isString,
  isDefined,
  isNull,
  isProxy,
  isProxySymbol,
  hasOwn,
} from "../../shared/utils.js";
import { ASTType } from "../parse/ast-type.js";

/**
 * @type {number}
 */
let uid = 0;

export function nextId() {
  uid += 1;
  return uid;
}

/**
 * @type {import('../parse/interface.ts').ParseService}
 */
let $parse;

/**@type {import('../exception-handler.js').ErrorHandler} */
let $exceptionHandler;

/**
 * @typedef {Object} AsyncQueueTask
 * @property {Scope} handler
 * @property {Function} fn
 * @property {Object} locals
 */

export const $postUpdateQueue = [];

/**
 * @type {Function[]}
 */
export const $$applyAsyncQueue = [];

export class RootScopeProvider {
  constructor() {
    this.rootScope = createScope();
  }

  $get = [
    "$exceptionHandler",
    "$parse",
    /**
     * @param {import('../exception-handler.js').ErrorHandler} exceptionHandler
     * @param {import('../parse/interface.ts').ParseService} parse
     */
    (exceptionHandler, parse) => {
      $exceptionHandler = exceptionHandler;
      $parse = parse;
      return this.rootScope;
    },
  ];
}

/**
 * Creates a deep proxy for the target object, intercepting property changes
 * and recursively applying proxies to nested objects.
 *
 * @param {Object} target - The object to be wrapped in a proxy.
 * @param {Scope} [context] - The context for the handler, used to track listeners.
 * @returns {Scope} - A proxy that intercepts operations on the target object,
 *                                     or the original value if the target is not an object.
 */
export function createScope(target = {}, context) {
  if (
    isNull(target) ||
    target[NONSCOPE] === true ||
    (target.constructor && target.constructor[NONSCOPE]) === true
  ) {
    return target;
  }

  if (typeof target === "object") {
    const proxy = new Proxy(target, context || new Scope());
    for (const key in target) {
      if (hasOwn(target, key)) {
        try {
          if (
            (target.constructor.$nonscope &&
              Array.isArray(target.constructor.$nonscope) &&
              target.constructor.$nonscope.includes(key)) ||
            (target.$nonscope &&
              Array.isArray(target.$nonscope) &&
              target.$nonscope.includes(key))
          ) {
            continue;
          } else {
            target[key] = createScope(target[key], proxy.$handler);
          }
        } catch {
          // convert only what we can
        }
      }
    }

    return proxy;
  } else {
    return target;
  }
}

/**
 * Listener function definition.
 * @typedef {Object} Listener
 * @property {Object} originalTarget - The original target object.
 * @property {ListenerFunction} listenerFn - The function invoked when changes are detected.
 * @property {import("../parse/interface.ts").CompiledExpression} watchFn
 * @property {number} id - Deregistration id
 * @property {number} scopeId - The scope that created the Listener
 * @property {string[]} property
 * @property {string} [watchProp] - The original property to watch if different from observed key
 * @property {Proxy} [foreignListener]
 *
 */

/**
 * Listener function type.
 * @callback ListenerFunction
 * @param {*} newValue - The new value of the changed property.
 * @param {Object} originalTarget - The original target object.
 */

/**
 * Decorator for excluding objects from scope observability
 */
export const NONSCOPE = "$nonscope";

/**
 * Scope class for the Proxy. It intercepts operations like property access (get)
 * and property setting (set), and adds support for deep change tracking and
 * observer-like behavior.
 */
export class Scope {
  /**
   * Initializes the handler with the target object and a context.
   *
   * @param {Scope} [context] - The context containing listeners.
   * @param {Scope} [parent] - Custom parent.
   */
  constructor(context, parent) {
    this.context = context
      ? context.context
        ? context.context
        : context
      : undefined;

    /** @type {Map<string, Array<Listener>>} Watch listeners */
    this.watchers = context ? context.watchers : new Map();

    /** @type {Map<String, Function[]>} Event listeners */
    this.$$listeners = new Map();

    /** @type {Map<string, Array<Listener>>} Watch listeners from other proxies */
    this.foreignListeners = context ? context.foreignListeners : new Map();

    /** @type {Set<ProxyConstructor>} */
    this.foreignProxies = context ? context.foreignProxies : new Set();

    /** @type {WeakMap<Object, Array<string>>} */
    this.objectListeners = context ? context.objectListeners : new WeakMap();

    /** @type {Map<Function, {oldValue: any, fn: Function}>} */
    this.functionListeners = context ? context.functionListeners : new Map();

    /** Current proxy being operated on */
    this.$proxy = null;

    /** @type {Scope} The actual proxy */
    this.$handler = /** @type {Scope} */ (this);

    /** @type {*} Current target being called on */
    this.$target = null;

    /** @type {*} Value wrapped by the proxy */
    this.$value = null;

    /**
     * @type {Scope[]}
     */
    this.$children = [];

    /**
     * @type {number} Unique model ID (monotonically increasing) useful for debugging.
     */
    this.$id = nextId();

    /**
     * @type {Scope}
     */
    this.$root = context ? context.$root : /** @type {Scope} */ (this);

    this.$parent = parent
      ? parent
      : /** @type {Scope} */ (this).$root === /** @type {Scope} */ (this)
        ? null
        : context;

    /** @type {AsyncQueueTask[]} */
    this.$$asyncQueue = [];

    this.filters = [];

    /** @type {boolean} */
    this.$$destroyed = false;

    this.scheduled = [];
  }

  /**
   * Intercepts and handles property assignments on the target object. If a new value is
   * an object, it will be recursively proxied.
   *
   * @param {Object} target - The target object.
   * @param {string} property - The name of the property being set.
   * @param {*} value - The new value being assigned to the property.
   * @param {Proxy} proxy - The proxy intercepting property access
   * @returns {boolean} - Returns true to indicate success of the operation.
   */
  set(target, property, value, proxy) {
    if (property === "undefined") {
      throw new Error("Attempting to set undefined property");
    }
    if (
      (target.constructor?.$nonscope &&
        Array.isArray(target.constructor.$nonscope) &&
        target.constructor.$nonscope.includes(property)) ||
      (target.$nonscope &&
        Array.isArray(target.$nonscope) &&
        target.$nonscope.includes(property))
    ) {
      target[property] = value;
      return true;
    }

    this.$proxy = proxy;
    this.$target = target;
    const oldValue = target[property];

    // Handle NaNs
    if (
      oldValue !== undefined &&
      Number.isNaN(oldValue) &&
      Number.isNaN(value)
    ) {
      return true;
    }
    if (oldValue && oldValue[isProxySymbol]) {
      if (Array.isArray(value)) {
        if (oldValue !== value) {
          const listeners = this.watchers.get(property);

          if (listeners) {
            this.scheduleListener(listeners);
          }

          const foreignListeners = this.foreignListeners.get(property);

          if (foreignListeners) {
            this.scheduleListener(foreignListeners);
          }
        }

        if (this.objectListeners.get(target[property])) {
          this.objectListeners.delete(target[property]);
        }
        target[property] = createScope(value, this);
        this.objectListeners.set(target[property], [property]);
        return true;
      }

      if (isObject(value)) {
        if (hasOwn(target, property)) {
          Object.keys(oldValue)
            .filter((x) => !value[x])
            .forEach((k) => {
              delete oldValue[k];
            });
        }

        if (oldValue !== value) {
          const listeners = this.watchers.get(property);

          if (listeners) {
            this.scheduleListener(listeners);
          }

          const foreignListeners = this.foreignListeners.get(property);

          if (foreignListeners) {
            this.scheduleListener(foreignListeners);
          }

          this.checkeListenersForAllKeys(value);
        }
        target[property] = createScope(value, this);
        //setDeepValue(target[property], value);
        return true;
      }

      if (isUndefined(value)) {
        let called = false;
        Object.keys(oldValue.$target).forEach((k) => {
          if (oldValue.$target[k]?.[isProxySymbol]) {
            called = true;
          }
          delete oldValue[k];
        });

        target[property] = undefined;
        if (!called) {
          let listeners = this.watchers.get(property);

          if (listeners) {
            this.scheduleListener(listeners);
          }
        }

        return true;
      }

      if (isDefined(value)) {
        target[property] = value;
        let listeners = this.watchers.get(property);

        if (listeners) {
          this.scheduleListener(listeners);
        }

        if (Array.isArray(target)) {
          if (this.objectListeners.has(proxy) && property !== "length") {
            let keys = this.objectListeners.get(proxy);
            keys.forEach((key) => {
              const listeners = this.watchers.get(key);
              if (listeners) {
                this.scheduleListener(listeners);
              }
            });
            decodeURI;
          }
        }

        return true;
      }
      return true;
    } else {
      if (isUndefined(target[property]) && isProxy(value)) {
        this.foreignProxies.add(value);
        target[property] = value;
        return true;
      }

      if (isUndefined(value)) {
        target[property] = value;
      } else {
        target[property] = createScope(value, this);
      }

      if (oldValue !== value) {
        let expectedTarget = this.$target;
        let listeners = [];
        // Handle the case where we need to start observing object after a watcher has been set
        if (isUndefined(oldValue) && isObject(target[property])) {
          if (!this.objectListeners.has(target[property])) {
            this.objectListeners.set(target[property], [property]);
          }
          for (const k of Object.keys(value)) {
            this.watchers.get(k)?.forEach((l) => listeners.push(l));
            // overwhrite the context so we pass the owneship test in filter
            expectedTarget = value;
          }
        }

        if (Array.isArray(target)) {
          this.watchers.get("length")?.forEach((l) => listeners.push(l));
        }

        this.watchers.get(property)?.forEach((l) => listeners.push(l));
        if (listeners.length > 0) {
          // check if the listener actually appllies to this target
          this.scheduleListener(listeners, (x) => {
            return x.filter((x) => {
              if (!x.watchProp) return true;
              // Compute the expected target based on `watchProp`
              const wrapperExpr = x.watchProp.split(".").slice(0, -1).join(".");
              const expectedHandler = $parse(wrapperExpr)(
                x.originalTarget,
              )?.$handler;
              return expectedTarget === expectedHandler?.$target;
            });
          });
        }

        let foreignListeners = this.foreignListeners.get(property);

        if (!foreignListeners && this.$parent?.foreignListeners) {
          foreignListeners = this.$parent.foreignListeners.get(property);
        }
        if (foreignListeners) {
          // filter for repeaters
          if (this.$target.$$hashKey) {
            foreignListeners = foreignListeners.filter((x) =>
              x.originalTarget.$$hashKey
                ? x.originalTarget.$$hashKey == this.$target.$$hashKey
                : false,
            );
          }

          this.scheduleListener(foreignListeners);
        }
      }

      if (this.objectListeners.has(proxy) && property !== "length") {
        let keys = this.objectListeners.get(proxy);
        keys.forEach((key) => {
          const listeners = this.watchers.get(key);
          if (listeners) {
            if (this.scheduled !== listeners) {
              this.scheduleListener(listeners);
            }
          }
        });
      }

      return true;
    }
  }

  checkeListenersForAllKeys(value) {
    if (isUndefined(value)) {
      return;
    }
    Object.keys(value).forEach((k) => {
      const listeners = this.watchers.get(k);

      if (listeners) {
        this.scheduleListener(listeners);
      }
      if (isObject(value[k])) {
        this.checkeListenersForAllKeys(value[k]);
      }
    });
  }

  /**
   * Intercepts property access on the target object. It checks for specific
   * properties (`watch` and `sync`) and binds their methods. For other properties,
   * it returns the value directly.
   *
   * @param {Object} target - The target object.
   * @param {string|number|symbol} property - The name of the property being accessed.
   * @param {Proxy} proxy - The proxy object being invoked
   * @returns {*} - The value of the property or a method if accessing `watch` or `sync`.
   */
  get(target, property, proxy) {
    if (property === "$$watchersCount") return calculateWatcherCount(this);
    if (property === isProxySymbol) return true;

    if (target[property] && isProxy(target[property])) {
      this.$proxy = target[property];
    } else {
      this.$proxy = proxy;
    }

    this.propertyMap = {
      $watch: this.$watch.bind(this),
      $watchGroup: this.$watchGroup.bind(this),
      $watchCollection: this.$watchCollection.bind(this),
      $new: this.$new.bind(this),
      $newIsolate: this.$newIsolate.bind(this),
      $destroy: this.$destroy.bind(this),
      $eval: this.$eval.bind(this),
      $apply: this.$apply.bind(this),
      $evalAsync: this.$evalAsync.bind(this),
      $postUpdate: this.$postUpdate.bind(this),
      $isRoot: this.isRoot.bind(this),
      $target: target,
      $proxy: this.$proxy,
      $on: this.$on.bind(this),
      $emit: this.$emit.bind(this),
      $broadcast: this.$broadcast.bind(this),
      $transcluded: this.$transcluded.bind(this),
      $handler: /** @type {Scope} */ (this),
      $parent: this.$parent,
      $root: this.$root,
      $children: this.$children,
      $id: this.$id,
      registerForeignKey: this.registerForeignKey.bind(this),
      notifyListener: this.notifyListener.bind(this),
      $merge: this.$merge.bind(this),
      $getById: this.$getById.bind(this),
    };

    if (
      Array.isArray(target) &&
      ["pop", "shift", "unshift"].includes(/** @type { string } */ (property))
    ) {
      if (this.objectListeners.has(proxy)) {
        let keys = this.objectListeners.get(this.$proxy);
        keys.forEach((key) => {
          const listeners = this.watchers.get(key);
          if (listeners) {
            this.scheduled = listeners;
          }
        });
      }

      // TODO aditional testing
      if (property === "unshift") {
        this.scheduleListener(this.scheduled);
      }
    }

    if (hasOwn(this.propertyMap, property)) {
      this.$target = target;
      return this.propertyMap[property];
    } else {
      // we are a simple getter
      return target[property];
    }
  }

  /**
   * @private
   * @param {Listener[]} listeners
   */
  scheduleListener(listeners, filter = (val) => val) {
    Promise.resolve().then(() => {
      let index = 0;
      let filteredListeners = filter(listeners);
      while (index < filteredListeners.length) {
        const listener = filteredListeners[index];
        if (listener.foreignListener) {
          listener.foreignListener.notifyListener(listener, this.$target);
        } else {
          this.notifyListener(listener, this.$target);
        }
        index++;
      }
    });
  }

  deleteProperty(target, property) {
    // Currently deletes $model
    if (target[property] && target[property][isProxySymbol]) {
      target[property] = undefined;

      let listeners = this.watchers.get(property);
      if (listeners) {
        this.scheduleListener(listeners);
      }
      if (this.objectListeners.has(this.$proxy)) {
        let keys = this.objectListeners.get(this.$proxy);
        keys.forEach((key) => {
          listeners = this.watchers.get(key);
          if (listeners) {
            this.scheduleListener(listeners);
          }
        });
      }

      if (this.scheduled) {
        this.scheduleListener(this.scheduled);
        this.scheduled = [];
      }
      return true;
    }

    delete target[property];

    if (this.objectListeners.has(this.$proxy)) {
      let keys = this.objectListeners.get(this.$proxy);
      keys.forEach((key) => {
        const listeners = this.watchers.get(key);
        if (listeners) {
          this.scheduleListener(listeners);
        }
      });
    } else {
      const listeners = this.watchers.get(property);
      if (listeners) {
        this.scheduleListener(listeners, target[property]);
      }
    }

    return true;
  }

  /**
   * Registers a watcher for a property along with a listener function. The listener
   * function is invoked when changes to that property are detected.
   *
   * @param {string} watchProp - An expression to be watched in the context of this model.
   * @param {ListenerFunction} [listenerFn] - A function to execute when changes are detected on watched context.
   * @param {boolean} [lazy] - A flag to indicate if the listener should be invoked immediately. Defaults to false.
   */
  $watch(watchProp, listenerFn, lazy = false) {
    assert(isString(watchProp), "Watched property required");
    watchProp = watchProp.trim();
    const get = $parse(watchProp);

    // Constant are immediately passed to listener function
    if (get.constant) {
      if (listenerFn) {
        Promise.resolve().then(() => {
          let res = get();
          while (isFunction(res)) {
            res = res();
          }
          listenerFn(res, this.$target);
        });
      }
      return () => {};
    }

    /** @type {Listener} */
    const listener = {
      originalTarget: this.$target,
      listenerFn: listenerFn,
      watchFn: get,
      scopeId: this.$id,
      id: nextUid(),
      property: [],
    };
    // simplest case
    let key = get.decoratedNode.body[0].expression.name;
    let keySet = [];

    let type = get.decoratedNode.body[0].expression.type;
    switch (type) {
      // 1
      case ASTType.Program: {
        throw new Error("Unsupported type " + type);
      }
      // 2
      case ASTType.ExpressionStatement: {
        throw new Error("Unsupported type " + type);
      }
      // 3
      case ASTType.AssignmentExpression:
        // assignment calls without listener functions
        if (!listenerFn) {
          let res = get(this.$target);
          while (isFunction(res)) {
            res = res(this.$target);
          }
          Promise.resolve().then(res);
          return () => {};
        }
        key = get.decoratedNode.body[0].expression.left.name;
        break;
      // 4
      case ASTType.ConditionalExpression: {
        key = get.decoratedNode.body[0].expression.toWatch[0]?.test?.name;
        listener.property.push(key);
        break;
      }
      // 5
      case ASTType.LogicalExpression: {
        let keys = [];
        keys.push(get.decoratedNode.body[0].expression.left.toWatch[0]?.name);
        keys.push(get.decoratedNode.body[0].expression.right.toWatch[0]?.name);
        keys.forEach((key) => {
          this.registerKey(key, listener);
        });
        return () => {
          keys.forEach((key) => {
            this.deregisterKey(key, listener.id);
          });
        };
      }
      // 6
      case ASTType.BinaryExpression: {
        let expr = get.decoratedNode.body[0].expression.toWatch[0];
        key = expr.property ? expr.property.name : expr.name;
        if (!key) {
          throw new Error("Unable to determine key");
        }
        listener.property.push(key);
        break;
      }
      // 7
      case ASTType.UnaryExpression: {
        let expr = get.decoratedNode.body[0].expression.toWatch[0];
        key = expr.property ? expr.property.name : expr.name;
        if (!key) {
          throw new Error("Unable to determine key");
        }
        listener.property.push(key);
        break;
      }
      // 8 function
      case ASTType.CallExpression: {
        let keys = [];
        get.decoratedNode.body[0].expression.toWatch.forEach((x) => {
          if (isDefined(x)) {
            keys.push(x.name);
          } else {
            // Promise.resolve().then(() => {
            //   listenerFn(this.$target)
            // });
          }
        });
        keys.forEach((key) => {
          this.registerKey(key, listener);
          this.scheduleListener([listener]);
        });

        return () => {
          keys.forEach((key) => {
            this.deregisterKey(key, listener.id);
          });
        };
      }

      // 9
      case ASTType.MemberExpression: {
        key = get.decoratedNode.body[0].expression.property.name;

        // array watcher
        if (!key) {
          key = get.decoratedNode.body[0].expression.object.name;
        }

        listener.property.push(key);
        if (watchProp !== key) {
          // Handle nested expression call
          listener.watchProp = watchProp;

          let potentialProxy = $parse(
            watchProp.split(".").slice(0, -1).join("."),
          )(listener.originalTarget);
          if (potentialProxy && this.foreignProxies.has(potentialProxy)) {
            potentialProxy.$handler.registerForeignKey(key, listener);
            potentialProxy.$handler.scheduleListener([listener]);
            return () => {
              return potentialProxy.$handler.deregisterKey(key, listener.id);
            };
          }
        }
        break;
      }

      // 10
      case ASTType.Identifier: {
        listener.property.push(get.decoratedNode.body[0].expression.name);
        break;
      }

      // 11
      case ASTType.Literal: {
        throw new Error("Unsupported type " + type);
      }

      // 12
      case ASTType.ArrayExpression: {
        let keys = get.decoratedNode.body[0].expression.elements
          .map((x) => {
            switch (x.type) {
              case 11:
                return x.value;
              default:
                return x.toWatch[0].name;
            }
          })
          .filter((x) => !!x);
        keys.forEach((key) => {
          this.registerKey(key, listener);
          this.scheduleListener([listener]);
        });
        return () => {
          keys.forEach((key) => {
            this.deregisterKey(key, listener.id);
          });
        };
      }

      // 13
      case ASTType.Property: {
        throw new Error("Unsupported type " + type);
      }

      // 14
      case ASTType.ObjectExpression: {
        // get.decoratedNode.body[0].expression.expression.forEach(x => {
        //   x.toWatch[0].name
        // });

        // key = get.decoratedNode.body[0].expression.properties[0].key.name;
        // listener.property.push(key);
        get.decoratedNode.body[0].expression.properties.forEach((prop) => {
          if (prop.key.isPure === false) {
            keySet.push(prop.key.name);
            listener.property.push(key);
          } else {
            if (prop.value.name) {
              keySet.push(prop.value.name);
              listener.property.push(key);
            } else {
              key = get.decoratedNode.body[0].expression.properties[0].key.name;
              listener.property.push(key);
            }
          }
        });

        // key = get.decoratedNode.body[0].expression.toWatch[0].name;
        // listener.property.push(key);
        break;
      }

      // 15
      case ASTType.ThisExpression: {
        throw new Error("Unsupported type " + type);
      }

      // 16
      case ASTType.LocalsExpression: {
        throw new Error("Unsupported type " + type);
      }

      // 17
      case ASTType.NGValueParameter: {
        throw new Error("Unsupported type " + type);
      }
    }

    // if the target is an object, then start observing it
    let listenerObject = listener.watchFn(this.$target);
    if (isObject(listenerObject)) {
      this.objectListeners.set(listenerObject, [key]);
    }

    if (keySet.length > 0) {
      keySet.forEach((key) => {
        this.registerKey(key, listener);
      });
    } else {
      this.registerKey(key, listener);
    }

    if (!lazy) {
      this.scheduleListener([listener]);
    }
    return () => {
      if (keySet.length > 0) {
        let res = true;
        keySet.forEach((key) => {
          let success = this.deregisterKey(key, listener.id);
          if (!success) {
            res = false;
          }
        });
        return res;
      } else {
        return this.deregisterKey(key, listener.id);
      }
    };
  }

  $watchGroup(watchArray, listenerFn) {
    watchArray.forEach((x) => this.$watch(x, listenerFn));
  }

  $watchCollection(watchProp, listenerFn) {
    return this.$watch(watchProp, listenerFn);
  }

  $new(childInstance) {
    let child;
    if (childInstance) {
      if (Object.getPrototypeOf(childInstance) === Object.prototype) {
        Object.setPrototypeOf(childInstance, this.$target);
      } else {
        if (Object.getPrototypeOf(childInstance) == this.$target) {
          Object.setPrototypeOf(childInstance, this.$target);
        } else {
          Object.setPrototypeOf(
            Object.getPrototypeOf(childInstance) || childInstance,
            this.$target,
          );
        }
      }

      child = childInstance;
    } else {
      child = Object.create(this.$target);
      // child.$parent = this.$parent;
    }

    const proxy = new Proxy(child, new Scope(this));
    this.$children.push(proxy);
    return proxy;
  }

  $newIsolate(instance) {
    let child = instance ? Object.create(instance) : Object.create(null);
    // child.$root = this.$root;
    const proxy = new Proxy(child, new Scope(this, this.$root));
    this.$children.push(proxy);
    return proxy;
  }

  $transcluded(parentInstance) {
    let child = Object.create(this.$target);
    const proxy = new Proxy(child, new Scope(this, parentInstance));
    this.$children.push(proxy);
    return proxy;
  }

  registerKey(key, listener) {
    if (this.watchers.has(key)) {
      this.watchers.get(key).push(listener);
    } else {
      this.watchers.set(key, [listener]);
    }
  }

  registerForeignKey(key, listener) {
    if (this.foreignListeners.has(key)) {
      this.foreignListeners.get(key).push(listener);
    } else {
      this.foreignListeners.set(key, [listener]);
    }
  }

  deregisterKey(key, id) {
    const listenerList = this.watchers.get(key);
    if (!listenerList) return false;

    const index = listenerList.findIndex((x) => x.id === id);
    if (index === -1) return false;

    listenerList.splice(index, 1);
    if (listenerList.length) {
      this.watchers.set(key, listenerList);
    } else {
      this.watchers.delete(key);
    }
    return true;
  }

  deregisterForeignKey(key, id) {
    const listenerList = this.foreignListeners.get(key);
    if (!listenerList) return false;

    const index = listenerList.findIndex((x) => x.id === id);
    if (index === -1) return false;

    listenerList.splice(index, 1);
    if (listenerList.length) {
      this.foreignListeners.set(key, listenerList);
    } else {
      this.foreignListeners.delete(key);
    }
    return true;
  }

  $eval(expr, locals) {
    const fn = $parse(expr);
    const res = fn(this.$target, locals);

    if (isUndefined(res) || res === null) {
      return res;
    }

    if (res["name"] === Object.hasOwnProperty["name"]) {
      return res;
    }
    if (isFunction(res)) {
      return res();
    }

    if (Number.isNaN(res)) {
      return 0;
    }

    return res;
  }

  async $evalAsync(expr, locals) {
    return await this.$eval(expr, locals);
  }

  /**
   * @param {Object} newTarget
   */
  $merge(newTarget) {
    Object.entries(newTarget).forEach(([key, value]) => {
      this.set(this.$target, key, value, this.$proxy);
    });
  }

  /**
   * @param {import('../../interface.js').Expression} expr
   * @returns {any}
   */
  $apply(expr) {
    try {
      return $parse(expr)(this.$proxy);
    } catch (e) {
      $exceptionHandler(e);
    }
  }

  /**
   * @param {string} name
   * @param {Function} listener
   * @returns {(function(): void)|*}
   */
  $on(name, listener) {
    let namedListeners = this.$$listeners.get(name);
    if (!namedListeners) {
      namedListeners = [];
      this.$$listeners.set(name, namedListeners);
    }
    namedListeners.push(listener);

    return () => {
      const indexOfListener = namedListeners.indexOf(listener);
      if (indexOfListener !== -1) {
        namedListeners.splice(indexOfListener, 1);
        if (namedListeners.length == 0) {
          this.$$listeners.delete(name);
        }
      }
    };
  }

  /**
   * @param {string} name
   * @param  {...any} args
   * @returns {void}
   */
  $emit(name, ...args) {
    return this.eventHelper(
      { name: name, event: undefined, broadcast: false },
      ...args,
    );
  }

  /**
   * @param {string} name
   * @param  {...any} args
   * @returns {any}
   */
  $broadcast(name, ...args) {
    return this.eventHelper(
      { name: name, event: undefined, broadcast: true },
      ...args,
    );
  }

  /**
   * @private
   * @returns {void}
   */
  eventHelper({ name, event, broadcast }, ...args) {
    if (!broadcast) {
      if (!this.$$listeners.has(name)) {
        if (this.$parent) {
          return this.$parent.$handler.eventHelper(
            { name: name, event: event, broadcast: broadcast },
            ...args,
          );
        }
        return;
      }
    }
    if (event) {
      event.currentScope = this.$target;
    } else {
      event = event || {
        name,
        targetScope: this.$target,
        currentScope: this.$target,
        stopped: false,
        stopPropagation() {
          event.stopped = true;
        },
        preventDefault() {
          event.defaultPrevented = true;
        },
        defaultPrevented: false,
      };
    }

    const listenerArgs = concat([event], [event].concat(args), 1);
    let listeners = this.$$listeners.get(name);
    if (listeners) {
      let length = listeners.length;
      for (let i = 0; i < length; i++) {
        try {
          let cb = listeners[i];
          cb.apply(null, listenerArgs);
          if (listeners.length !== length) {
            if (listeners.length < length) {
              i--;
            }
            length = listeners.length;
          }
        } catch (e) {
          $exceptionHandler(e);
        }
      }
    }

    event.currentScope = null;

    if (event.stopped) {
      return event;
    }

    if (broadcast) {
      if (this.$children.length > 0) {
        this.$children.forEach((child) => {
          event = child["$handler"].eventHelper(
            { name: name, event: event, broadcast: broadcast },
            ...args,
          );
        });
      }
      return event;
    } else {
      if (this.$parent) {
        return this.$parent?.eventHelper(
          { name: name, event: event, broadcast: broadcast },
          ...args,
        );
      } else {
        return event;
      }
    }
  }

  /**
   * @private
   * @returns {boolean}
   */
  isRoot() {
    return this.$root == /** @type {Scope} */ (this);
  }

  $postUpdate(fn) {
    $postUpdateQueue.push(fn);
  }

  $destroy() {
    if (this.$$destroyed) return;

    this.$broadcast("$destroy");
    Array.from(this.watchers.entries()).forEach(([key, val]) => {
      this.watchers.set(
        key,
        val.filter((x) => x.scopeId !== this.$id),
      );
    });

    if (this.isRoot()) {
      this.watchers.clear();
    } else {
      let i = this.$parent.$children.filter((x) => x.$id == this.$id)[0];
      this.$parent.$children.splice(this.$parent.$children.indexOf(i), 1);
    }

    this.$$listeners.clear();

    this.$$destroyed = true;
  }

  /**
   * Invokes the registered listener function with watched property changes.
   *
   * @param {Listener} listener - The property path that was changed.
   */
  notifyListener(listener, target) {
    const { originalTarget, listenerFn, watchFn } = listener;
    try {
      let newVal = watchFn(originalTarget);
      if (isUndefined(newVal)) {
        newVal = watchFn(target);
      }
      if (isFunction(newVal)) {
        newVal = newVal(originalTarget);
      }

      if (Array.isArray(newVal)) {
        newVal.forEach((x, index) => {
          if (isFunction(x)) {
            newVal[index] = x(originalTarget);
          }
        });
      }
      listenerFn(newVal, originalTarget);
      this.$$asyncQueue.forEach((x) => {
        if (x.handler.$id == this.$id) {
          Promise.resolve().then(x.fn(x.handler, x.locals));
        }
      });

      while ($postUpdateQueue.length) {
        $postUpdateQueue.shift()();
      }
    } catch (e) {
      $exceptionHandler(e);
    }
  }

  /**
   * Searches the scope instance
   *
   * @param {string|number}id
   * @returns {Scope|undefined}
   */
  $getById(id) {
    if (isString(id)) {
      id = parseInt(/** @type {string} */ (id), 10);
    }
    if (this.$id === id) {
      return this;
    } else {
      let res = undefined;
      for (const child of this.$children) {
        let found = child.$getById(id);
        if (found) {
          res = found;
          break;
        }
      }
      return res;
    }
  }
}

/**
 * @param {Scope} model
 * @returns {number}
 */
function calculateWatcherCount(model) {
  const childIds = collectChildIds(model).add(model.$id);

  /** @type {number} */
  const count = Array.from(model.watchers.values()).reduce(
    (count, watcherArray) =>
      count +
      watcherArray.reduce(
        (subCount, watcher) =>
          subCount + (childIds.has(watcher.scopeId) ? 1 : 0),
        0,
      ),
    0,
  );
  return count;
}

/**
 * @param {Scope} child
 * @returns {Set<number>}
 */
function collectChildIds(child) {
  const ids = new Set([child.$id]);
  child.$children?.forEach((c) => {
    collectChildIds(c).forEach((id) => ids.add(id));
  });
  return ids;
}
