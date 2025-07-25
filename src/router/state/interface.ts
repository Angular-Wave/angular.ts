import { ParamDeclaration, RawParams } from "../params/interface.ts";
import { StateObject } from "./state-object.js";
import { ViewContext } from "../view/interface.ts";
import { Injectable } from "../../interface.ts";
import { Transition } from "../transition/transition.js";
import {
  TransitionStateHookFn,
  TransitionOptions,
} from "../transition/interface.ts";
import {
  ResolvePolicy,
  ResolvableLiteral,
  ProviderLike,
} from "../resolve/interface.ts";
import { Resolvable } from "../resolve/resolvable.js";
import { TargetState } from "./target-state.js";

export type StateOrName = string | StateDeclaration | StateObject;

export interface TransitionPromise extends Promise<StateObject> {
  transition: Transition;
}

export interface TargetStateDef {
  state: StateOrName;
  params?: RawParams;
  options?: TransitionOptions;
}

export type ResolveTypes = Resolvable | ResolvableLiteral | ProviderLike;

/**
 * Interface for declaring a view
 *
 * This interface defines the basic data that a normalized view declaration will have on it.
 * Add any additional fields that the framework requires to that interface.
 */
export interface ViewDeclaration {
  /**
   * The raw name for the view declaration, i.e., the [[StateDeclaration.views]] property name.
   */
  $name?: string;

  /**
   * The normalized address for the `ui-view` which this ViewConfig targets.
   *
   * A ViewConfig targets a `ui-view` in the DOM (relative to the `uiViewContextAnchor`) which has
   * a specific name.
   * @example `header` or `$default`
   *
   * The `uiViewName` can also target a _nested view_ by providing a dot-notation address
   * @example `foo.bar` or `foo.$default.bar`
   */
  $uiViewName?: string;

  /**
   * The normalized context anchor (state name) for the `uiViewName`
   *
   * When targeting a `ui-view`, the `uiViewName` address is anchored to a context name (state name).
   */
  $uiViewContextAnchor?: string;

  /**
   * A type identifier for the View
   *
   * This is used when loading prerequisites for the view, before it enters the DOM.  Different types of views
   * may load differently (e.g., templateProvider+controllerProvider vs component class)
   */
  $type?: string;

  /**
   * The context that this view is declared within.
   */
  $context?: ViewContext;

  /**
   * The name of the component to use for this view.
   *
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * The name of an [angular 1.5+ `.component()`](https://docs.angularjs.org/guide/component) (or directive with
   * bindToController and/or scope declaration) which will be used for this view.
   *
   * Resolve data can be provided to the component via the component's `bindings` object (for 1.3+ directives, the
   * `bindToController` is used; for other directives, the `scope` declaration is used).  For each binding declared
   * on the component, any resolve with the same name is set on the component's controller instance.  The binding
   * is provided to the component as a one-time-binding.  In general, components should likewise declare their
   * input bindings as [one-way ("&lt;")](https://docs.angularjs.org/api/ng/service/$compile#-scope-).
   *
   * Note: inside a "views:" block, a bare string `"foo"` is shorthand for `{ component: "foo" }`
   *
   * Note: Mapping from resolve names to component inputs may be specified using [[bindings]].
   *
   * #### Example:
   * ```js
   * .state('profile', {
   *   // Use the <my-profile></my-profile> component for the Unnamed view
   *   component: 'MyProfile',
   * }
   *
   * .state('messages', {
   *   // use the <nav-bar></nav-bar> component for the view named 'header'
   *   // use the <message-list></message-list> component for the view named 'content'
   *   views: {
   *     header: { component: 'NavBar' },
   *     content: { component: 'MessageList' }
   *   }
   * }
   *
   * .state('contacts', {
   *   // Inside a "views:" block, a bare string "NavBar" is shorthand for { component: "NavBar" }
   *   // use the <nav-bar></nav-bar> component for the view named 'header'
   *   // use the <contact-list></contact-list> component for the view named 'content'
   *   views: {
   *     header: 'NavBar',
   *     content: 'ContactList'
   *   }
   * }
   * ```
   *
   *
   * Note: When using `component` to define a view, you may _not_ use any of: `template`, `templateUrl`,
   * `templateProvider`, `controller`, `controllerProvider`, `controllerAs`.
   *
   *
   * See also: Todd Motto's angular 1.3 and 1.4 [backport of .component()](https://github.com/toddmotto/angular-component)
   */
  component?: string;

  /**
   * An object which maps `resolve`s to [[component]] `bindings`.
   *
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * When using a [[component]] declaration (`component: 'myComponent'`), each input binding for the component is supplied
   * data from a resolve of the same name, by default.  You may supply data from a different resolve name by mapping it here.
   *
   * Each key in this object is the name of one of the component's input bindings.
   * Each value is the name of the resolve that should be provided to that binding.
   *
   * Any component bindings that are omitted from this map get the default behavior of mapping to a resolve of the
   * same name.
   *
   * #### Example:
   * ```js
   * $stateProvider.state('foo', {
   *   resolve: {
   *     foo: function(FooService) { return FooService.get(); },
   *     bar: function(BarService) { return BarService.get(); }
   *   },
   *   component: 'Baz',
   *   // The component's `baz` binding gets data from the `bar` resolve
   *   // The component's `foo` binding gets data from the `foo` resolve (default behavior)
   *   bindings: {
   *     baz: 'bar'
   *   }
   * });
   *
   * app.component('Baz', {
   *   templateUrl: 'baz.html',
   *   controller: 'BazController',
   *   bindings: {
   *     foo: '<', // foo binding
   *     baz: '<'  // baz binding
   *   }
   * });
   * ```
   *
   */
  bindings?: { [key: string]: string };

  /**
   * Dynamic component provider function.
   *
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * This is an injectable provider function which returns the name of the component to use.
   * The provider will invoked during a Transition in which the view's state is entered.
   * The provider is called after the resolve data is fetched.
   *
   * #### Example:
   * ```js
   * componentProvider: function(MyResolveData, $transition$) {
   *   if (MyResolveData.foo) {
   *     return "fooComponent"
   *   } else if ($transition$.to().name === 'bar') {
   *     return "barComponent";
   *   }
   * }
   * ```
   */
  componentProvider?: Injectable;

  /**
   * The view's controller function or name
   *
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * The controller function, or the name of a registered controller.  The controller function will be used
   * to control the contents of the [[directives.uiView]] directive.
   *
   * If specified as a string, controllerAs can be declared here, i.e., "FooController as foo" instead of in
   * a separate [[controllerAs]] property.
   *
   * See: [[Ng1Controller]] for information about component-level router hooks.
   */
  controller?: Injectable | string;

  /**
   * A controller alias name.
   *
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * If present, the controller will be published to scope under the `controllerAs` name.
   * See: https://docs.angularjs.org/api/ng/directive/ngController
   */
  controllerAs?: string;

  /**
   * Dynamic controller provider function.
   *
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * This is an injectable provider function which returns the actual controller function, or the name
   * of a registered controller.  The provider will invoked during a Transition in which the view's state is
   * entered.  The provider is called after the resolve data is fetched.
   *
   * #### Example:
   * ```js
   * controllerProvider: function(MyResolveData, $transition$) {
   *   if (MyResolveData.foo) {
   *     return "FooCtrl"
   *   } else if ($transition$.to().name === 'bar') {
   *     return "BarCtrl";
   *   } else {
   *     return function($scope) {
   *       $scope.baz = "Qux";
   *     }
   *   }
   * }
   * ```
   */
  controllerProvider?: Injectable;

  /**
   * The scope variable name to use for resolve data.
   *
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * When a view is activated, the resolved data for the state which the view belongs to is put on the scope.
   * This property sets the name of the scope variable to use for the resolved data.
   *
   * Defaults to `$resolve`.
   */
  resolveAs?: string;

  /**
   * The HTML template for the view.
   *
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * HTML template as a string, or a function which returns an html template as a string.
   * This template will be used to render the corresponding [[directives.uiView]] directive.
   *
   * This property takes precedence over templateUrl.
   *
   * If `template` is a function, it will be called with the Transition parameters as the first argument.
   *
   * #### Example:
   * ```js
   * template: "<h1>inline template definition</h1><div ui-view></div>"
   * ```
   *
   * #### Example:
   * ```js
   * template: function(params) {
   *   return "<h1>generated template</h1>";
   * }
   * ```
   */
  template?: Function | string;

  /**
   * The URL for the HTML template for the view.
   *
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * A path or a function that returns a path to an html template.
   * The template will be fetched and used to render the corresponding [[directives.uiView]] directive.
   *
   * If `templateUrl` is a function, it will be called with the Transition parameters as the first argument.
   *
   * #### Example:
   * ```js
   * templateUrl: "/templates/home.html"
   * ```
   *
   * #### Example:
   * ```js
   * templateUrl: function(params) {
   *   return myTemplates[params.pageId];
   * }
   * ```
   */
  templateUrl?: string | Function;

  /**
   * Injected function which returns the HTML template.
   *
   * A property of [[StateDeclaration]] or [[ViewDeclaration]]:
   *
   * Injected function which returns the HTML template.
   * The template will be used to render the corresponding [[directives.uiView]] directive.
   *
   * #### Example:
   * ```js
   * templateProvider: function(MyTemplateService, $transition$) {
   *   return MyTemplateService.getTemplate($transition$.params().pageId);
   * }
   * ```
   */
  templateProvider?: Injectable;
}

/**
 * The return value of a [[redirectTo]] function
 *
 * - string: a state name
 * - TargetState: a target state, parameters, and options
 * - object: an object with a state name and parameters
 */
export type RedirectToResult =
  | string
  | TargetState
  | { state?: string; params?: RawParams }
  | void;

/**
 * The StateDeclaration object is used to define a state or nested state.
 *
 * Note: Each implementation of UI-Router (for a specific framework)
 * extends this interface as necessary.
 *
 * #### Example:
 * ```js
 * // StateDeclaration object
 * var foldersState = {
 *   name: 'folders',
 *   url: '/folders',
 *   component: FoldersComponent,
 *   resolve: {
 *     allfolders: function(FolderService) {
 *       return FolderService.list();
 *     }
 *   },
 * }
 *
 * registry.register(foldersState);
 * ```
 */
export interface StateDeclaration {
  /**
   * The state name (required)
   *
   * A unique state name, e.g. `"home"`, `"about"`, `"contacts"`.
   * To create a parent/child state use a dot, e.g. `"about.sales"`, `"home.newest"`.
   *
   * Note: [State] objects require unique names.
   * The name is used like an id.
   */
  name?: string;

  /**
   * Abstract state indicator
   *
   * An abstract state can never be directly activated.
   * Use an abstract state to provide inherited properties (url, resolve, data, etc) to children states.
   */
  abstract?: boolean;

  /**
   * The parent state
   *
   * Normally, a state's parent is implied from the state's [[name]], e.g., `"parentstate.childstate"`.
   *
   * Alternatively, you can explicitly set the parent state using this property.
   * This allows shorter state names, e.g., `<a ui-sref="childstate">Child</a>`
   * instead of `<a ui-sref="parentstate.childstate">Child</a>
   *
   * When using this property, the state's name should not have any dots in it.
   *
   * #### Example:
   * ```js
   * var parentstate = {
   *   name: 'parentstate'
   * }
   * var childstate = {
   *   name: 'childstate',
   *   parent: 'parentstate'
   *   // or use a JS var which is the parent StateDeclaration, i.e.:
   *   // parent: parentstate
   * }
   * ```
   */
  parent?: string | StateDeclaration;

  /**
   * Gets the internal State object API
   *
   * Gets the *internal API* for a registered state.
   *
   * Note: the internal [[StateObject]] API is subject to change without notice
   * @internal
   */
  $$state?: () => StateObject;

  /**
   * Resolve - a mechanism to asynchronously fetch data, participating in the Transition lifecycle
   *
   * The `resolve:` property defines data (or other dependencies) to be fetched asynchronously when the state is being entered.
   * After the data is fetched, it may be used in views, transition hooks or other resolves that belong to this state.
   * The data may also be used in any views or resolves that belong to nested states.
   *
   * ### As an array
   *
   * Each array element should be a [[ResolvableLiteral]] object.
   *
   * #### Example:
   * The `user` resolve injects the current `Transition` and the `UserService` (using its token, which is a string).
   * The [[ResolvableLiteral.resolvePolicy]] sets how the resolve is processed.
   * The `user` data, fetched asynchronously, can then be used in a view.
   * ```js
   * var state = {
   *   name: 'user',
   *   url: '/user/:userId
   *   resolve: [
   *     {
   *       token: 'user',
   *       policy: { when: 'EAGER' },
   *       deps: ['UserService', Transition],
   *       resolveFn: (userSvc, trans) => userSvc.fetchUser(trans.params().userId) },
   *     }
   *   ]
   * }
   * ```
   *
   * Note: an Angular 2 style [`useFactory` provider literal](https://angular.io/docs/ts/latest/cookbook/dependency-injection.html#!#provide)
   * may also be used.  See [[ProviderLike]].
   * #### Example:
   * ```
   * resolve: [
   *   { provide: 'token', useFactory: (http) => http.get('/'), deps: [ Http ] },
   * ]
   * ```
   *
   * ### As an object
   *
   * The `resolve` property may be an object where:
   * - Each key (string) is the name of the dependency.
   * - Each value (function) is an injectable function which returns the dependency, or a promise for the dependency.
   *
   * This style is based on AngularTS injectable functions, but can be used with any UI-Router implementation.
   * If your code will be minified, the function should be ["annotated" in the AngularTS manner](https://docs.angularjs.org/guide/di#dependency-annotation).
   *
   * #### AngularTS Example:
   * ```js
   * resolve: {
   *   // If you inject `myStateDependency` into a controller, you'll get "abc"
   *   myStateDependency: function() {
   *     return "abc";
   *   },
   *   // Dependencies are annotated in "Inline Array Annotation"
   *   myAsyncData: ['$http', '$transition$' function($http, $transition$) {
   *     // Return a promise (async) for the data
   *     return $http.get("/foos/" + $transition$.params().foo);
   *   }]
   * }
   * ```
   *
   * Note: You cannot specify a policy for each Resolvable, nor can you use non-string
   * tokens when using the object style `resolve:` block.
   *
   * ### Lifecycle
   *
   * Since a resolve function can return a promise, the router will delay entering the state until the promises are ready.
   * If any of the promises are rejected, the Transition is aborted with an Error.
   *
   * By default, resolves for a state are fetched just before that state is entered.
   * Note that only states which are being *entered* during the `Transition` have their resolves fetched.
   * States that are "retained" do not have their resolves re-fetched.
   *
   * If you are currently in a parent state `parent` and are transitioning to a child state `parent.child`, the
   * previously resolved data for state `parent` can be injected into `parent.child` without delay.
   *
   * Any resolved data for `parent.child` is retained until `parent.child` is exited, e.g., by transitioning back to the `parent` state.
   *
   * Because of this scoping and lifecycle, resolves are a great place to fetch your application's primary data.
   *
   * ### Injecting resolves into other things
   *
   * During a transition, Resolve data can be injected into:
   *
   * - Views (the components which fill a `ui-view` tag)
   * - Transition Hooks
   * - Other resolves (a resolve may depend on asynchronous data from a different resolve)
   *
   * ### Injecting other things into resolves
   *
   * Resolve functions usually have dependencies on some other API(s).
   * The dependencies are usually declared and injected into the resolve function.
   * A common pattern is to inject a custom service such as `UserService`.
   * The resolve then delegates to a service method, such as `UserService.list()`;
   *
   * #### Special injectable tokens
   *
   * - `UIRouter`: The [[UIRouter]] instance which has references to all the UI-Router services.
   * - `Transition`: The current [[Transition]] object; information and API about the current transition, such as
   *    "to" and "from" State Parameters and transition options.
   * - `'$transition$'`: A string alias for the `Transition` injectable
   * - `'$state$'`: For `onEnter`/`onExit`/`onRetain`, the state being entered/exited/retained.
   * - Other resolve tokens: A resolve can depend on another resolve, either from the same state, or from any parent state.
   *
   * #### Example:
   * ```js
   * // Injecting a resolve into another resolve
   * resolve: [
   *   // Define a resolve 'allusers' which delegates to the UserService.list()
   *   // which returns a promise (async) for all the users
   *   { provide: 'allusers', useFactory: (UserService) => UserService.list(), deps: [UserService] },
   *
   *   // Define a resolve 'user' which depends on the allusers resolve.
   *   // This resolve function is not called until 'allusers' is ready.
   *   { provide: 'user', (allusers, trans) => _.find(allusers, trans.params().userId, deps: ['allusers', Transition] }
   * }
   * ```
   */
  resolve?: ResolveTypes[] | { [key: string]: Injectable };

  /**
   * Sets the resolve policy defaults for all resolves on this state
   *
   * This should be an [[ResolvePolicy]] object.
   *
   * It can contain the following optional keys/values:
   *
   * - `when`: (optional) defines when the resolve is fetched. Accepted values: "LAZY" or "EAGER"
   * - `async`: (optional) if the transition waits for the resolve. Accepted values: "WAIT", "NOWAIT", {@link CustomAsyncPolicy}
   *
   * See [[ResolvePolicy]] for more details.
   */
  resolvePolicy?: ResolvePolicy;

  /**
   * The url fragment for the state
   *
   * A URL fragment (with optional parameters) which is used to match the browser location with this state.
   *
   * This fragment will be appended to the parent state's URL in order to build up the overall URL for this state.
   * See [[UrlMatcher]] for details on acceptable patterns.
   *
   * @examples
   * ```js
   *
   * url: "/home"
   * // Define a parameter named 'userid'
   * url: "/users/:userid"
   * // param 'bookid' has a custom regexp
   * url: "/books/{bookid:[a-zA-Z_-]}"
   * // param 'categoryid' is of type 'int'
   * url: "/books/{categoryid:int}"
   * // two parameters for this state
   * url: "/books/{publishername:string}/{categoryid:int}"
   * // Query parameters
   * url: "/messages?before&after"
   * // Query parameters of type 'date'
   * url: "/messages?{before:date}&{after:date}"
   * // Path and query parameters
   * url: "/messages/:mailboxid?{before:date}&{after:date}"
   * ```
   */
  url?: string;

  /**
   * Params configuration
   *
   * An object which optionally configures parameters declared in the url, or defines additional non-url
   * parameters. For each parameter being configured, add a [[ParamDeclaration]] keyed to the name of the parameter.
   *
   * #### Example:
   * ```js
   * params: {
   *   param1: {
   *    type: "int",
   *    array: true,
   *    value: []
   *   },
   *   param2: {
   *     value: "index"
   *   }
   * }
   * ```
   */
  params?: { [key: string]: ParamDeclaration | any };

  /**
   * Named views
   *
   * An optional object which defines multiple views, or explicitly targets specific named ui-views.
   *
   * - What is a view urlConfig
   * - What is a ui-view
   * - Shorthand controller/template
   * - Incompatible with ^
   *
   *  Examples:
   *
   *  Targets three named ui-views in the parent state's template
   *
   * #### Example:
   * ```js
   * views: {
   *   header: {
   *     controller: "headerCtrl",
   *     templateUrl: "header.html"
   *   }, body: {
   *     controller: "bodyCtrl",
   *     templateUrl: "body.html"
   *   }, footer: {
   *     controller: "footCtrl",
   *     templateUrl: "footer.html"
   *   }
   * }
   * ```
   *
   * @example
   * ```js
   * // Targets named ui-view="header" from ancestor state 'top''s template, and
   * // named `ui-view="body" from parent state's template.
   * views: {
   *   'header@top': {
   *     controller: "msgHeaderCtrl",
   *     templateUrl: "msgHeader.html"
   *   }, 'body': {
   *     controller: "messagesCtrl",
   *     templateUrl: "messages.html"
   *   }
   * }
   * ```
   */
  views?: { [key: string]: ViewDeclaration };

  /**
   * An inherited property to store state data
   *
   * This is a spot for you to store inherited state metadata.
   * Child states' `data` object will prototypally inherit from their parent state.
   *
   * This is a good spot to put metadata such as `requiresAuth`.
   *
   * Note: because prototypal inheritance is used, changes to parent `data` objects reflect in the child `data` objects.
   * Care should be taken if you are using `hasOwnProperty` on the `data` object.
   * Properties from parent objects will return false for `hasOwnProperty`.
   */
  data?: any;

  /**
   * Synchronously or asynchronously redirects Transitions to a different state/params
   *
   * If this property is defined, a Transition directly to this state will be redirected based on the property's value.
   *
   * - If the value is a `string`, the Transition is redirected to the state named by the string.
   *
   * - If the property is an object with a `state` and/or `params` property,
   *   the Transition is redirected to the named `state` and/or `params`.
   *
   * - If the value is a [[TargetState]] the Transition is redirected to the `TargetState`
   *
   * - If the property is a function:
   *   - The function is called with the current [[Transition]]
   *   - The return value is processed using the previously mentioned rules.
   *   - If the return value is a promise, the promise is waited for, then the resolved async value is processed using the same rules.
   *
   * Note: `redirectTo` is processed as an `onStart` hook, before `LAZY` resolves.
   * If your redirect function relies on resolve data, get the [[Transition.injector]] and get a
   * promise for the resolve data using [[UIInjector.getAsync]].
   *
   * #### Example:
   * ```js
   * // a string
   * .state('A', {
   *   redirectTo: 'A.B'
   * })
   *
   * // a {state, params} object
   * .state('C', {
   *   redirectTo: { state: 'C.D', params: { foo: 'index' } }
   * })
   *
   * // a fn
   * .state('E', {
   *   redirectTo: () => "A"
   * })
   *
   * // a fn conditionally returning a {state, params}
   * .state('F', {
   *   redirectTo: (trans) => {
   *     if (trans.params().foo < 10)
   *       return { state: 'F', params: { foo: 10 } };
   *   }
   * })
   *
   * // a fn returning a promise for a redirect
   * .state('G', {
   *   redirectTo: (trans) => {
   *     let svc = trans.injector().get('SomeAsyncService')
   *     let promise = svc.getAsyncRedirectTo(trans.params.foo);
   *     return promise;
   *   }
   * })
   *
   * // a fn that fetches resolve data
   * .state('G', {
   *   redirectTo: (trans) => {
   *     // getAsync tells the resolve to load
   *     let resolvePromise = trans.injector().getAsync('SomeResolve')
   *     return resolvePromise.then(resolveData => resolveData === 'login' ? 'login' : null);
   *   }
   * })
   * ```
   */
  redirectTo?:
    | RedirectToResult
    | ((transition: Transition) => RedirectToResult)
    | ((transition: Transition) => Promise<RedirectToResult>);

  /**
   * A state hook invoked when a state is being entered.
   *
   * The hook can inject global services.
   * It can also inject `$transition$` or `$state$` (from the current transition).
   *
   * ### Example:
   * ```js
   * $stateProvider.state({
   *   name: 'mystate',
   *   onEnter: (MyService, $transition$, $state$) => {
   *     return MyService.doSomething($state$.name, $transition$.params());
   *   }
   * });
   * ```
   *
   * #### Example:`
   * ```js
   * $stateProvider.state({
   *   name: 'mystate',
   *   onEnter: [ 'MyService', '$transition$', '$state$', function (MyService, $transition$, $state$) {
   *     return MyService.doSomething($state$.name, $transition$.params());
   *   } ]
   * });
   * ```
   */
  onEnter?: TransitionStateHookFn | Injectable;
  /**
   * A state hook invoked when a state is being retained.
   *
   * The hook can inject global services.
   * It can also inject `$transition$` or `$state$` (from the current transition).
   *
   * #### Example:
   * ```js
   * $stateProvider.state({
   *   name: 'mystate',
   *   onRetain: (MyService, $transition$, $state$) => {
   *     return MyService.doSomething($state$.name, $transition$.params());
   *   }
   * });
   * ```
   *
   * #### Example:`
   * ```js
   * $stateProvider.state({
   *   name: 'mystate',
   *   onRetain: [ 'MyService', '$transition$', '$state$', function (MyService, $transition$, $state$) {
   *     return MyService.doSomething($state$.name, $transition$.params());
   *   } ]
   * });
   * ```
   */
  onRetain?: TransitionStateHookFn | Injectable;
  /**
   * A state hook invoked when a state is being exited.
   *
   * The hook can inject global services.
   * It can also inject `$transition$` or `$state$` (from the current transition).
   *
   * ### Example:
   * ```js
   * $stateProvider.state({
   *   name: 'mystate',
   *   onExit: (MyService, $transition$, $state$) => {
   *     return MyService.doSomething($state$.name, $transition$.params());
   *   }
   * });
   * ```
   *
   * #### Example:`
   * ```js
   * $stateProvider.state({
   *   name: 'mystate',
   *   onExit: [ 'MyService', '$transition$', '$state$', function (MyService, $transition$, $state$) {
   *     return MyService.doSomething($state$.name, $transition$.params());
   *   } ]
   * });
   * ```
   */
  onExit?: TransitionStateHookFn | Injectable;

  /**
   * A function used to lazy load code
   *
   * The `lazyLoad` function is invoked before the state is activated.
   * The transition waits while the code is loading.
   *
   * The function should load the code that is required to activate the state.
   * For example, it may load a component class, or some service code.
   * The function must return a promise which resolves when loading is complete.
   *
   * For example, this code lazy loads a service before the `abc` state is activated:
   *
   * ```
   * .state('abc', {
   *   lazyLoad: (transition, state) => import('./abcService')
   * }
   * ```
   *
   * The `abcService` file is imported and loaded
   * (it is assumed that the `abcService` file knows how to register itself as a service).
   *
   * #### Lifecycle
   *
   * - The `lazyLoad` function is invoked if a transition is going to enter the state.
   * - The function is invoked before the transition starts (using an `onBefore` transition hook).
   * - The function is only invoked once; while the `lazyLoad` function is loading code, it will not be invoked again.
   *   For example, if the user double clicks a ui-sref, `lazyLoad` is only invoked once even though there were two transition attempts.
   *   Instead, the existing lazy load promise is re-used.
   * - When the promise resolves successfully, the `lazyLoad` property is deleted from the state declaration.
   * - If the promise resolves to a [[LazyLoadResult]] which has an array of `states`, those states are registered.
   * - The original transition is retried (this time without the `lazyLoad` property present).
   *
   * - If the `lazyLoad` function fails, then the transition also fails.
   *   The failed transition (and the `lazyLoad` function) could potentially be retried by the user.
   *
   * ### Lazy loading state definitions (Future States)
   *
   * State definitions can also be lazy loaded.
   * This might be desirable when building large, multi-module applications.
   *
   * To lazy load state definitions, a Future State should be registered as a placeholder.
   * When the state definitions are lazy loaded, the Future State is deregistered.
   *
   * A future state can act as a placeholder for a single state, or for an entire module of states and substates.
   * A future state should have:
   *
   * - A `name` which ends in `.**`.
   *   A future state's `name` property acts as a wildcard [[Glob]].
   *   It matches any state name that starts with the `name` (including child states that are not yet loaded).
   * - A `url` prefix.
   *   A future state's `url` property acts as a wildcard.
   *   UI-Router matches all paths that begin with the `url`.
   *   It effectively appends `.*` to the internal regular expression.
   *   When the prefix matches, the future state will begin loading.
   * - A `lazyLoad` function.
   *   This function should should return a Promise to lazy load the code for one or more [[StateDeclaration]] objects.
   *   It should return a [[LazyLoadResult]].
   *   Generally, one of the lazy loaded states should have the same name as the future state.
   *   The new state will then **replace the future state placeholder** in the registry.
   *
   * ### Additional resources
   *
   * For in depth information on lazy loading and Future States, see the [Lazy Loading Guide](https://ui-router.github.io/guides/lazyload).
   *
   * #### Example: states.js
   * ```js
   *
   * // This child state is a lazy loaded future state
   * // The `lazyLoad` function loads the final state definition
   * {
   *   name: 'parent.**',
   *   url: '/parent',
   *   lazyLoad: () => import('./lazy.states.js')
   * }
   * ```
   *
   * #### Example: lazy.states.js
   *
   * This file is lazy loaded.  It exports an array of states.
   *
   * ```js
   * import {ChildComponent} from "./child.component.js";
   * import {ParentComponent} from "./parent.component.js";
   *
   * // This fully defined state replaces the future state
   * let parentState = {
   *   // the name should match the future state
   *   name: 'parent',
   *   url: '/parent/:parentId',
   *   component: ParentComponent,
   *   resolve: {
   *     parentData: ($transition$, ParentService) =>
   *         ParentService.get($transition$.params().parentId)
   *   }
   * }
   *
   * let childState = {
   *   name: 'parent.child',
   *   url: '/child/:childId',
   *   params: {
   *     childId: "default"
   *   },
   *   resolve: {
   *     childData: ($transition$, ChildService) =>
   *         ChildService.get($transition$.params().childId)
   *   }
   * };
   *
   * // This array of states will be registered by the lazyLoad hook
   * let lazyLoadResults = {
   *   states: [ parentState, childState ]
   * };
   *
   * export default lazyLoadResults;
   * ```
   *
   * @param transition the [[Transition]] that is activating the future state
   * @param state the [[StateDeclaration]] that the `lazyLoad` function is declared on
   * @return a Promise to load the states.
   *         Optionally, if the promise resolves to a [[LazyLoadResult]],
   *         the states will be registered with the [[StateRegistry]].
   */
  lazyLoad?: (
    transition: Transition,
    state: StateDeclaration,
  ) => Promise<LazyLoadResult>;

  /**
   * Marks all the state's parameters as `dynamic`.
   *
   * All parameters on the state will use this value for `dynamic` as a default.
   * Individual parameters may override this default using [[ParamDeclaration.dynamic]] in the [[params]] block.
   *
   * Note: this value overrides the `dynamic` value on a custom parameter type ([[ParamTypeDefinition.dynamic]]).
   */
  dynamic?: boolean;

  /**
   * Marks all query parameters as [[ParamDeclaration.dynamic]]
   *
   * @deprecated use either [[dynamic]] or [[ParamDeclaration.dynamic]]
   */
  reloadOnSearch?: boolean;
}

/**
 * The return type of a [[StateDeclaration.lazyLoad]] function
 *
 * If your state has a `lazyLoad` function, it should return a promise.
 * If promise resolves to an object matching this interface, then the `states` array
 * of [[StateDeclaration]] objects will be automatically registered.
 */
export interface LazyLoadResult {
  states?: StateDeclaration[];
}

/**
 * An options object for [[StateService.href]]
 */
export interface HrefOptions {
  /**
   * Defines what state to be "relative from"
   *
   * When a relative path is found (e.g `^` or `.bar`), defines which state to be relative from.
   */
  relative?: StateOrName;

  /**
   * If true, and if there is no url associated with the state provided in the
   *    first parameter, then the constructed href url will be built from the first
   *    ancestor which has a url.
   */
  lossy?: boolean;

  /**
   * If `true` will inherit parameters from the current parameter values.
   */
  inherit?: boolean;

  /**
   * If true will generate an absolute url, e.g. `http://www.example.com/fullurl`.
   */
  absolute?: boolean;
}

/**
 * Either a [[StateDeclaration]] or an ES6 class that implements [[StateDeclaration]]
 * The ES6 class constructor should have no arguments.
 */
export type _StateDeclaration = StateDeclaration | { new (): StateDeclaration };
