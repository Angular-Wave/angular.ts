export function nextId(): number;
/**
 * Creates a deep proxy for the target object, intercepting property changes
 * and recursively applying proxies to nested objects.
 *
 * @param {Object} target - The object to be wrapped in a proxy.
 * @param {Scope} [context] - The context for the handler, used to track listeners.
 * @returns {Scope} - A proxy that intercepts operations on the target object,
 *                                     or the original value if the target is not an object.
 */
export function createScope(target?: any, context?: Scope): Scope;
export const $postUpdateQueue: any[];
export class RootScopeProvider {
  rootScope: Scope;
  $get: (
    | string
    | ((
        exceptionHandler: ng.ExceptionHandlerService,
        parse: ng.ParseService,
      ) => Scope)
  )[];
}
/**
 * Decorator for excluding objects from scope observability
 */
export const NONSCOPE: "$nonscope";
/**
 * Scope class for the Proxy. It intercepts operations like property access (get)
 * and property setting (set), and adds support for deep change tracking and
 * observer-like behavior.
 * @extends {Record<string, any>}
 */
export class Scope {
  /**
   * Initializes the handler with the target object and a context.
   *
   * @param {Scope} [context] - The context containing listeners.
   * @param {Scope} [parent] - Custom parent.
   */
  constructor(context?: Scope, parent?: Scope);
  context: Scope;
  /** @type {Map<string, Array<import('./interface.ts').Listener>>} Watch listeners */
  watchers: Map<string, Array<import("./interface.ts").Listener>>;
  /** @type {Map<String, Function[]>} Event listeners */
  $$listeners: Map<string, Function[]>;
  /** @type {Map<string, Array<import('./interface.ts').Listener>>} Watch listeners from other proxies */
  foreignListeners: Map<string, Array<import("./interface.ts").Listener>>;
  /** @type {Set<ProxyConstructor>} */
  foreignProxies: Set<ProxyConstructor>;
  /** @type {WeakMap<Object, Array<string>>} */
  objectListeners: WeakMap<any, Array<string>>;
  /** @type {Map<Function, {oldValue: any, fn: Function}>} */
  functionListeners: Map<
    Function,
    {
      oldValue: any;
      fn: Function;
    }
  >;
  /** Current proxy being operated on */
  $proxy: any;
  /** @type {Scope} The actual proxy */
  $handler: Scope;
  /** @type {*} Current target being called on */
  $target: any;
  /** @type {*} Value wrapped by the proxy */
  $value: any;
  /**
   * @type {Scope[]}
   */
  $children: Scope[];
  /**
   * @type {number} Unique model ID (monotonically increasing) useful for debugging.
   */
  $id: number;
  /**
   * @type {Scope}
   */
  $root: Scope;
  $parent: Scope;
  /** @type {import('./interface.ts').AsyncQueueTask[]} */
  $$asyncQueue: import("./interface.ts").AsyncQueueTask[];
  filters: any[];
  /** @type {boolean} */
  $$destroyed: boolean;
  scheduled: any[];
  /** @private */
  private propertyMap;
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
  set(
    target: any,
    property: string,
    value: any,
    proxy: ProxyConstructor,
  ): boolean;
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
  get(
    target: any,
    property: string | number | symbol,
    proxy: ProxyConstructor,
  ): any;
  deleteProperty(target: any, property: any): boolean;
  /**
   * Registers a watcher for a property along with a listener function. The listener
   * function is invoked when changes to that property are detected.
   *
   * @param {string} watchProp - An expression to be watched in the context of this model.
   * @param {import('./interface.ts').ListenerFunction} [listenerFn] - A function to execute when changes are detected on watched context.
   * @param {boolean} [lazy] - A flag to indicate if the listener should be invoked immediately. Defaults to false.
   */
  $watch(
    watchProp: string,
    listenerFn?: import("./interface.ts").ListenerFunction,
    lazy?: boolean,
  ): () => void;
  $new(childInstance: any): any;
  $newIsolate(instance: any): any;
  $transcluded(parentInstance: any): any;
  deregisterForeignKey(key: any, id: any): boolean;
  $eval(expr: any, locals: any): any;
  /**
   * @param {Object} newTarget
   */
  $merge(newTarget: any): void;
  /**
   * @param {import('../../interface.js').Expression} expr
   * @returns {any}
   */
  $apply(expr: import("../../interface.js").Expression): any;
  /**
   * @param {string} name
   * @param {Function} listener
   * @returns {(function(): void)|*}
   */
  $on(name: string, listener: Function): (() => void) | any;
  /**
   * @param {string} name
   * @param  {...any} args
   * @returns {void}
   */
  $emit(name: string, ...args: any[]): void;
  /**
   * @param {string} name
   * @param  {...any} args
   * @returns {any}
   */
  $broadcast(name: string, ...args: any[]): any;
  /**
   * @param {Function} fn
   */
  $postUpdate(fn: Function): void;
  $destroy(): void;
  /**
   * Searches the scope instance
   *
   * @param {string|number}id
   * @returns {Scope|undefined}
   */
  $getById(id: string | number): Scope | undefined;
  #private;
}
