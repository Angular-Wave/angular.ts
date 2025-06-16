/**
 * A JavaScript expression represented as a string.
 *
 * Often used in interpolation bindings such as:
 * `<span title="{{ attrBinding }}">{{ textBinding }}</span>`.
 * Evaluated in the context of a {@link import('./core/scope/scope.js').Scope `scope`} object.
 */
export type Expression = string;
/**
 * A dependency-annotated factory array used by AngularTS DI system.
 *
 * It consists of zero or more dependency names (as strings), followed by
 * a factory function that takes those dependencies as arguments.
 *
 * Example:
 * ```ts
 * ['dep1', 'dep2', function(dep1, dep2) { ... }]
 * ```
 */
export type AnnotatedFactory = [...string[], (...args: any[]) => any];
/**
 * A factory that can be either a standalone function or a dependency-annotated array.
 *
 * The array form is used to support minification-safe dependency injection.
 * See {@link AnnotatedFactory}.
 */
export type InjectableFactory = (...args: any[]) => any;
export type Injectable = AnnotatedFactory | InjectableFactory;
/**
 * An object that defines how a service is constructed.
 *
 * It must define a `$get` property that provides the instance of the service,
 * either as a plain factory function or as an {@link AnnotatedFactory}.
 */
export interface ServiceProvider {
  $get: Injectable;
}
/**
 * The API for registering different types of providers with the injector.
 *
 * This interface is used within AngularTS's `$provide` service to define
 * services, factories, constants, values, decorators, etc.
 */
export interface Provider {
  /**
   * Register a service provider.
   * @param name - The name of the service.
   * @param provider - An object with a `$get` property that defines how the service is created.
   */
  provider(name: string, provider: ServiceProvider): ServiceProvider;
  /**
   * Register a factory function to create a service.
   * @param name - The name of the service.
   * @param factoryFn - A function (or annotated array) that returns the service instance.
   */
  factory(name: string, factoryFn: Function): ServiceProvider;
  /**
   * Register a constructor function to create a service.
   * @param name - The name of the service.
   * @param constructor - A class or function to instantiate.
   */
  service(name: string, constructor: Function): ServiceProvider;
  /**
   * Register a fixed value as a service.
   * @param name - The name of the service.
   * @param val - The value to use.
   */
  value(name: string, val: any): ServiceProvider;
  /**
   * Register a constant value (available during config).
   * @param name - The name of the constant.
   * @param val - The constant value.
   */
  constant(name: string, val: any): void;
  /**
   * Register a decorator function to modify or replace an existing service.
   * @param name - The name of the service to decorate.
   * @param fn - A function that takes `$delegate` and returns a decorated service.
   */
  decorator(name: string, fn: Function): void;
}
/**
 * A filter function takes an input and optional arguments, and returns a transformed value.
 */
export type FilterFn = (input: any, ...args: any[]) => any;
/**
 * A filter factory function that returns a FilterFn.
 */
export type FilterFactory = (...args: any[]) => FilterFn;
