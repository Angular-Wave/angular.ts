/**
 * Injector for providers
 * @extends AbstractInjector
 */
export class ProviderInjector extends AbstractInjector {
  /**
   * @param {Object} cache
   * @param {boolean} strictDi - Indicates if strict dependency injection is enforced.
   */
  constructor(cache: any, strictDi: boolean);
}
/**
 * Injector for factories and services
 * @extends AbstractInjector
 */
export class InjectorService extends AbstractInjector {
  /**
   *
   * @param {boolean} strictDi - Indicates if strict dependency injection is enforced.
   * @param {ProviderInjector} providerInjector
   */
  constructor(strictDi: boolean, providerInjector: ProviderInjector);
  providerInjector: ProviderInjector;
  factory(serviceName: any): any;
  /**
   *
   * @param {string} name
   * @returns {boolean}
   */
  has(name: string): boolean;
}
declare class AbstractInjector {
  /**
   * @param {boolean} strictDi - Indicates if strict dependency injection is enforced.
   */
  constructor(strictDi: boolean);
  /**
   * @type {Object<String, Function>}
   */
  cache: any;
  /** @type {boolean} */
  strictDi: boolean;
  path: any[];
  /** @type {Object.<string, import("../../types").Module>} */
  modules: {
    [x: string]: any;
  };
  /**
   * Get a service by name.
   *
   * @param {string} serviceName
   * @returns {any}
   */
  get(serviceName: string): any;
  /**
   * Get the injection arguments for a function.
   *
   * @param {Function|Array} fn
   * @param {Object} locals
   * @param {string} serviceName
   * @returns
   */
  injectionArgs(fn: Function | any[], locals: any, serviceName: string): any[];
  /**
   * Invoke a function with optional context and locals.
   *
   * @param {Function|String|Array<any>} fn
   * @param {*} [self]
   * @param {Object} [locals]
   * @param {string} [serviceName]
   * @returns
   */
  invoke(
    fn: Function | string | Array<any>,
    self?: any,
    locals?: any,
    serviceName?: string,
  ): any;
  /**
   * Instantiate a type constructor with optional locals.
   * @param {Function|Array} type
   * @param {*} [locals]
   * @param {string} [serviceName]
   */
  instantiate(type: Function | any[], locals?: any, serviceName?: string): any;
  /**
   * @abstract
   */
  loadNewModules(): void;
  /**
   * @abstract
   * @param {string} _serviceName
   */
  factory(_serviceName: string): void;
}
export {};
