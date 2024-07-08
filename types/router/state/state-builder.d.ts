/**
 * This is a [[StateBuilder.builder]] function for the `resolve:` block on a [[StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * validates the `resolve` property and converts it to a [[Resolvable]] array.
 *
 * resolve: input value can be:
 *
 * {
 *   // analyzed but not injected
 *   myFooResolve: function() { return "myFooData"; },
 *
 *   // function.toString() parsed, "DependencyName" dep as string (not min-safe)
 *   myBarResolve: function(DependencyName) { return DependencyName.fetchSomethingAsPromise() },
 *
 *   // Array split; "DependencyName" dep as string
 *   myBazResolve: [ "DependencyName", function(dep) { return dep.fetchSomethingAsPromise() },
 *
 *   // Array split; DependencyType dep as token (compared using ===)
 *   myQuxResolve: [ DependencyType, function(dep) { return dep.fetchSometingAsPromise() },
 *
 *   // val.$inject used as deps
 *   // where:
 *   //     corgeResolve.$inject = ["DependencyName"];
 *   //     function corgeResolve(dep) { dep.fetchSometingAsPromise() }
 *   // then "DependencyName" dep as string
 *   myCorgeResolve: corgeResolve,
 *
 *  // inject service by name
 *  // When a string is found, desugar creating a resolve that injects the named service
 *   myGraultResolve: "SomeService"
 * }
 *
 * or:
 *
 * [
 *   new Resolvable("myFooResolve", function() { return "myFooData" }),
 *   new Resolvable("myBarResolve", function(dep) { return dep.fetchSomethingAsPromise() }, [ "DependencyName" ]),
 *   { provide: "myBazResolve", useFactory: function(dep) { dep.fetchSomethingAsPromise() }, deps: [ "DependencyName" ] }
 * ]
 */
export function resolvablesBuilder(state: any): any[];
/**
 * A internal global service
 *
 * StateBuilder is a factory for the internal [[StateObject]] objects.
 *
 * When you register a state with the [[StateRegistry]], you register a plain old javascript object which
 * conforms to the [[StateDeclaration]] interface.  This factory takes that object and builds the corresponding
 * [[StateObject]] object, which has an API and is used internally.
 *
 * Custom properties or API may be added to the internal [[StateObject]] object by registering a decorator function
 * using the [[builder]] method.
 */
export class StateBuilder {
  constructor(matcher: any, urlService: any);
  matcher: any;
  $injector: any;
  builders: {
    name: (typeof nameBuilder)[];
    self: (typeof selfBuilder)[];
    parent: ((state: any) => any)[];
    data: (typeof dataBuilder)[];
    url: ((stateObject: any) => any)[];
    navigable: ((state: any) => any)[];
    params: ((state: any) => any)[];
    views: any[];
    path: (typeof pathBuilder)[];
    includes: (typeof includesBuilder)[];
    resolvables: (typeof resolvablesBuilder)[];
  };
  builder(name: any, fn: any): any;
  /**
   * Builds all of the properties on an essentially blank State object, returning a State object which has all its
   * properties and API built.
   *
   * @param state an uninitialized State object
   * @returns the built State object
   */
  build(state: any): any;
  parentName(state: any): any;
  name(state: any): any;
}
declare function nameBuilder(state: any): any;
declare function selfBuilder(state: any): any;
declare function dataBuilder(state: any): any;
declare function pathBuilder(state: any): any;
declare function includesBuilder(state: any): any;
export {};
