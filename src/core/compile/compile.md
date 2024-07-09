/\* ! VARIABLE/FUNCTION NAMING CONVENTIONS THAT APPLY TO THIS FILE!

-
- DOM-related variables:
-
- - "node" - DOM Node
- - "element" - DOM Element or Node
- - "$node" or "$element" - jqLite-wrapped node or element
-
-
- Compiler related stuff:
-
- - "linkFn" - linking fn of a single directive
- - "nodeLinkFn" - function that aggregates all linking fns for a particular node
- - "childLinkFn" - function that aggregates all linking fns for child nodes of a particular node
- - "compositeLinkFn" - function that aggregates all linking fns for a compilation root (nodeList)
    \*/

/\*\*

- @ngdoc service
- @name $compile
- @kind function
-
- @description
- Compiles an HTML string or DOM into a template and produces a template function, which
- can then be used to link {@link ng.$rootScope.Scope `scope`} and the template together.
-
- The compilation is a process of walking the DOM tree and matching DOM elements to
- {@link ng.$compileProvider#directive directives}.
-
- <div class="alert alert-warning">
- **Note:** This document is an in-depth reference of all directive options.
- For a gentle introduction to directives with examples of common use cases,
- see the {@link guide/directive directive guide}.
- </div>
-
- ## Comprehensive Directive API
-
- There are many different options for a directive.
-
- The difference resides in the return value of the factory function.
- You can either return a {@link $compile#directive-definition-object Directive Definition Object (see below)}
- that defines the directive properties, or just the `postLink` function (all other properties will have
- the default values).
-
- <div class="alert alert-success">
- **Best Practice:** It's recommended to use the "directive definition object" form.
- </div>
-
- Here's an example directive declared with a Directive Definition Object:
-
- ```js

  ```

- let myModule = angular.module(...);
-
- myModule.directive('directiveName', function factory(injectables) {
-     let directiveDefinitionObject = {
-       {@link $compile#-priority- priority}: 0,
-       {@link $compile#-template- template}: '<div></div>', // or // function(tElement, tAttrs) { ... },
-       // or
-       // {@link $compile#-templateurl- templateUrl}: 'directive.html', // or // function(tElement, tAttrs) { ... },
-       {@link $compile#-transclude- transclude}: false,
-       {@link $compile#-restrict- restrict}: 'A',
-       {@link $compile#-templatenamespace- templateNamespace}: 'html',
-       {@link $compile#-scope- scope}: false,
-       {@link $compile#-controller- controller}: function($scope, $element, $attrs, $transclude, otherInjectables) { ... },
-       {@link $compile#-controlleras- controllerAs}: 'stringIdentifier',
-       {@link $compile#-bindtocontroller- bindToController}: false,
-       {@link $compile#-require- require}: 'siblingDirectiveName', // or // ['^parentDirectiveName', '?optionalDirectiveName', '?^optionalParent'],
-       {@link $compile#-multielement- multiElement}: false,
-       {@link $compile#-compile- compile}: function compile(tElement, tAttrs, transclude) {
-         return {
-            {@link $compile#pre-linking-function pre}: function preLink(scope, iElement, iAttrs, controller) { ... },
-            {@link $compile#post-linking-function post}: function postLink(scope, iElement, iAttrs, controller) { ... }
-         }
-         // or
-         // return function postLink( ... ) { ... }
-       },
-       // or
-       // {@link $compile#-link- link}: {
-       //  {@link $compile#pre-linking-function pre}: function preLink(scope, iElement, iAttrs, controller) { ... },
-       //  {@link $compile#post-linking-function post}: function postLink(scope, iElement, iAttrs, controller) { ... }
-       // }
-       // or
-       // {@link $compile#-link- link}: function postLink( ... ) { ... }
-     };
-     return directiveDefinitionObject;
- });
- ```

  ```

-
- <div class="alert alert-warning">
- **Note:** Any unspecified options will use the default value. You can see the default values below.
- </div>
-
- Therefore the above can be simplified as:
-
- ```js

  ```

- let myModule = angular.module(...);
-
- myModule.directive('directiveName', function factory(injectables) {
-     let directiveDefinitionObject = {
-       link: function postLink(scope, iElement, iAttrs) { ... }
-     };
-     return directiveDefinitionObject;
-     // or
-     // return function postLink(scope, iElement, iAttrs) { ... }
- });
- ```

  ```

-
- ### Life-cycle hooks
- Directive controllers can provide the following methods that are called by AngularJS at points in the life-cycle of the
- directive.The following hooks can be defined on the controller prototype or added to the controller inside its constructor:
- - `$onInit()` - Called on each controller after all the controllers on an element have been constructed and
- had their bindings initialized (and before the pre &amp; post linking functions for the directives on
- this element). This is a good place to put initialization code for your controller.
- - `$onChanges(changesObj)` - Called whenever one-way (`<`) or interpolation (`@`) bindings are updated. The
- `changesObj` is a hash whose keys are the names of the bound properties that have changed, and the values are an
- object of the form `{ currentValue, previousValue, isFirstChange() }`. Use this hook to trigger updates within a
- component such as cloning the bound value to prevent accidental mutation of the outer value. Note that this will
- also be called when your bindings are initialized.
- - `$doCheck()` - Called on each turn of the digest cycle. Provides an opportunity to detect and act on
- changes. Any actions that you wish to take in response to the changes that you detect must be
- invoked from this hook; implementing this has no effect on when `$onChanges` is called. For example, this hook
- could be useful if you wish to perform a deep equality check, or to check a Date object, changes to which would not
- be detected by AngularJS's change detector and thus not trigger `$onChanges`. This hook is invoked with no arguments;
- if detecting changes, you must store the previous value(s) for comparison to the current values.
- Changes to the model inside `$doCheck` will trigger new turns of the digest loop, which will cause the changes to be
- propagated throughout the application.
- - `$onDestroy()` - Called on a controller when its containing scope is destroyed. Use this hook for releasing
- external resources, watches and event handlers. Note that components have their `$onDestroy()` hooks called in
- the same order as the `$scope.$broadcast` events are triggered, which is top down. This means that parent
- components will have their `$onDestroy()` hook called before child components.
- - `$postLink()` - Called after this controller's element and its children have been linked. Similar to the post-link
- function this hook can be used to set up DOM event handlers and do direct DOM manipulation.
- Note that child elements that contain `templateUrl` directives will not have been compiled and linked since
- they are waiting for their template to load asynchronously and their own compilation and linking has been
- suspended until that occurs.

- #### Life-cycle hook examples
-
- This example shows how you can check for mutations to a Date object even though the identity of the object
- has not changed.
-
- <example name="doCheckDateExample" module="do-check-module">
- <file name="app.js">
-     angular.module('do-check-module', [])
-       .component('app', {
-         template:
-           'Month: <input ng-model="$ctrl.month" ng-change="$ctrl.updateDate()">' +
-           'Date: {{ $ctrl.date }}' +
-           '<test date="$ctrl.date"></test>',
-         controller: function() {
-           this.date = new Date();
-           this.month = this.date.getMonth();
-           this.updateDate = function() {
-             this.date.setMonth(this.month);
-           };
-         }
-       })
-       .component('test', {
-         bindings: { date: '<' },
-         template:
-           '<pre>{{ $ctrl.log | json }}</pre>',
-         controller: function() {
-           let previousValue;
-           this.log = [];
-           this.$doCheck = function() {
-             let currentValue = this.date && this.date.valueOf();
-             if (previousValue !== currentValue) {
-               this.log.push('doCheck: date mutated: ' + this.date);
-               previousValue = currentValue;
-             }
-           };
-         }
-       });
- </file>
- <file name="index.html">
-     <app></app>
- </file>
- </example>
-
- This example show how you might use `$doCheck` to trigger changes in your component's inputs even if the
- actual identity of the component doesn't change. (Be aware that cloning and deep equality checks on large
- arrays or objects can have a negative impact on your application performance.)
-
- <example name="doCheckArrayExample" module="do-check-module">
- <file name="index.html">
-     <div ng-init="items = []">
-       <button ng-click="items.push(items.length)">Add Item</button>
-       <button ng-click="items = []">Reset Items</button>
-       <pre>{{ items }}</pre>
-       <test items="items"></test>
-     </div>
- </file>
- <file name="app.js">
-      angular.module('do-check-module', [])
-        .component('test', {
-          bindings: { items: '<' },
-          template:
-            '<pre>{{ $ctrl.log | json }}</pre>',
-          controller: function() {
-            this.log = [];
-
-            this.$doCheck = function() {
-              if (this.items_ref !== this.items) {
-                this.log.push('doCheck: items changed');
-                this.items_ref = this.items;
-              }
-              if (!angular.equals(this.items_clone, this.items)) {
-                this.log.push('doCheck: items mutated');
-                this.items_clone = structuredClone(this.items);
-              }
-            };
-          }
-        });
- </file>
- </example>
-
-
- ### Directive Definition Object
-
- The directive definition object provides instructions to the {@link ng.$compile
- compiler}. The attributes are:
-
- #### `multiElement`
- When this property is set to true (default is `false`), the HTML compiler will collect DOM nodes between
- nodes with the attributes `directive-name-start` and `directive-name-end`, and group them
- together as the directive elements. It is recommended that this feature be used on directives
- which are not strictly behavioral (such as {@link ngClick}), and which
- do not manipulate or replace child nodes (such as {@link ngInclude}).
-
- #### `priority`
- When there are multiple directives defined on a single DOM element, sometimes it
- is necessary to specify the order in which the directives are applied. The `priority` is used
- to sort the directives before their `compile` functions get called. Priority is defined as a
- number. Directives with greater numerical `priority` are compiled first. Pre-link functions
- are also run in priority order, but post-link functions are run in reverse order. The order
- of directives with the same priority is undefined. The default priority is `0`.
-
- #### `terminal`
- If set to true then the current `priority` will be the last set of directives
- which will execute (any directives at the current priority will still execute
- as the order of execution on same `priority` is undefined). Note that expressions
- and other directives used in the directive's template will also be excluded from execution.
-
- #### `scope`
- The scope property can be `false`, `true`, or an object:
-
- - **`false` (default):** No scope will be created for the directive. The directive will use its
- parent's scope.
-
- - **`true`:** A new child scope that prototypically inherits from its parent will be created for
- the directive's element. If multiple directives on the same element request a new scope,
- only one new scope is created.
-
- - **`{...}` (an object hash):** A new "isolate" scope is created for the directive's template.
- The 'isolate' scope differs from normal scope in that it does not prototypically
- inherit from its parent scope. This is useful when creating reusable components, which should not
- accidentally read or modify data in the parent scope. Note that an isolate scope
- directive without a `template` or `templateUrl` will not apply the isolate scope
- to its children elements.
-
- The 'isolate' scope object hash defines a set of local scope properties derived from attributes on the
- directive's element. These local properties are useful for aliasing values for templates. The keys in
- the object hash map to the name of the property on the isolate scope; the values define how the property
- is bound to the parent scope, via matching attributes on the directive's element:
-
- - `@` or `@attr` - bind a local scope property to the value of DOM attribute. The result is
- always a string since DOM attributes are strings. If no `attr` name is specified then the
- attribute name is assumed to be the same as the local name. Given `<my-component
- my-attr="hello {{name}}">`and the isolate scope definition`scope: { localName:'@myAttr' }`,
- the directive's scope property `localName` will reflect the interpolated value of `hello
- {{name}}`. As the `name`attribute changes so will the`localName` property on the directive's
- scope. The `name` is read from the parent scope (not the directive's scope).
-
- - `=` or `=attr` - set up a bidirectional binding between a local scope property and an expression
- passed via the attribute `attr`. The expression is evaluated in the context of the parent scope.
- If no `attr` name is specified then the attribute name is assumed to be the same as the local
- name. Given `<my-component my-attr="parentModel">` and the isolate scope definition `scope: {
- localModel: '=myAttr' }`, the property `localModel` on the directive's scope will reflect the
- value of `parentModel` on the parent scope. Changes to `parentModel` will be reflected in
- `localModel` and vice versa. If the binding expression is non-assignable, or if the attribute
- isn't optional and doesn't exist, an exception
- ({@link error/$compile/nonassign `$compile:nonassign`}) will be thrown upon discovering changes
- to the local value, since it will be impossible to sync them back to the parent scope.
-
- By default, the {@link ng.$rootScope.Scope#$watch `$watch`}
- method is used for tracking changes, and the equality check is based on object identity.
- However, if an object literal or an array literal is passed as the binding expression, the
- equality check is done by value (using the {@link angular.equals} function). It's also possible
- to watch the evaluated value shallowly with {@link ng.$rootScope.Scope#$watchCollection
- `$watchCollection`}: use `=*` or `=*attr`
- - - `<` or `<attr` - set up a one-way (one-directional) binding between a local scope property and an
- expression passed via the attribute `attr`. The expression is evaluated in the context of the
- parent scope. If no `attr` name is specified then the attribute name is assumed to be the same as the
- local name.
-
- For example, given `<my-component my-attr="parentModel">` and directive definition of
- `scope: { localModel:'<myAttr' }`, then the isolated scope property `localModel` will reflect the
- value of `parentModel` on the parent scope. Any changes to `parentModel` will be reflected
- in `localModel`, but changes in `localModel` will not reflect in `parentModel`. There are however
- two caveats:
-     1. one-way binding does not copy the value from the parent to the isolate scope, it simply
-     sets the same value. That means if your bound value is an object, changes to its properties
-     in the isolated scope will be reflected in the parent scope (because both reference the same object).
-     2. one-way binding watches changes to the **identity** of the parent value. That means the
-     {@link ng.$rootScope.Scope#$watch `$watch`} on the parent value only fires if the reference
-     to the value has changed. In most cases, this should not be of concern, but can be important
-     to know if you one-way bind to an object, and then replace that object in the isolated scope.
-     If you now change a property of the object in your parent scope, the change will not be
-     propagated to the isolated scope, because the identity of the object on the parent scope
-     has not changed. Instead you must assign a new object.
-
- One-way binding is useful if you do not plan to propagate changes to your isolated scope bindings
- back to the parent. However, it does not make this completely impossible.
-
- By default, the {@link ng.$rootScope.Scope#$watch `$watch`}
- method is used for tracking changes, and the equality check is based on object identity.
- It's also possible to watch the evaluated value shallowly with
- {@link ng.$rootScope.Scope#$watchCollection `$watchCollection`}: use `<*` or `<*attr`
-
- - `&` or `&attr` - provides a way to execute an expression in the context of the parent scope. If
- no `attr` name is specified then the attribute name is assumed to be the same as the local name.
- Given `<my-component my-attr="count = count + value">` and the isolate scope definition `scope: {
- localFn:'&myAttr' }`, the isolate scope property `localFn` will point to a function wrapper for
- the `count = count + value` expression. Often it's desirable to pass data from the isolated scope
- via an expression to the parent scope. This can be done by passing a map of local variable names
- and values into the expression wrapper fn. For example, if the expression is `increment(amount)`
- then we can specify the amount value by calling the `localFn` as `localFn({amount: 22})`.
-
- All 4 kinds of bindings (`@`, `=`, `<`, and `&`) can be made optional by adding `?` to the expression.
- The marker must come after the mode and before the attribute name.
- See the {@link error/$compile/iscp Invalid Isolate Scope Definition error} for definition examples.
- This is useful to refine the interface directives provide.
- One subtle difference between optional and non-optional happens \*\*when the binding attribute is not
- set\*\*:
- - the binding is optional: the property will not be defined
- - the binding is not optional: the property is defined
-
- ````js
  *app.directive('testDir', function() {
     return {
       scope: {
         notoptional: '=',
         optional: '=?',
       },
       bindToController: true,
       controller: function() {
         this.$onInit = function() {
           console.log(this.hasOwnProperty('notoptional')) // true
           console.log(this.hasOwnProperty('optional')) // false
         }
       }
     }
   })
  *```
  ````
-
-
- ##### Combining directives with different scope defintions
-
- In general it's possible to apply more than one directive to one element, but there might be limitations
- depending on the type of scope required by the directives. The following points will help explain these limitations.
- For simplicity only two directives are taken into account, but it is also applicable for several directives:
-
- - **no scope** + **no scope** => Two directives which don't require their own scope will use their parent's scope
- - **child scope** + **no scope** => Both directives will share one single child scope
- - **child scope** + **child scope** => Both directives will share one single child scope
- - **isolated scope** + **no scope** => The isolated directive will use it's own created isolated scope. The other directive will use
- its parent's scope
- - **isolated scope** + **child scope** => **Won't work!** Only one scope can be related to one element. Therefore these directives cannot
- be applied to the same element.
- - **isolated scope** + **isolated scope** => **Won't work!** Only one scope can be related to one element. Therefore these directives
- cannot be applied to the same element.
-
-
- #### `bindToController`
- This property is used to bind scope properties directly to the controller. It can be either
- `true` or an object hash with the same format as the `scope` property.
-
- When an isolate scope is used for a directive (see above), `bindToController: true` will
- allow a component to have its properties bound to the controller, rather than to scope.
-
- After the controller is instantiated, the initial values of the isolate scope bindings will be bound to the controller
- properties. You can access these bindings once they have been initialized by providing a controller method called
- `$onInit`, which is called after all the controllers on an element have been constructed and had their bindings
- initialized.
-
- It is also possible to set `bindToController` to an object hash with the same format as the `scope` property.
- This will set up the scope bindings to the controller directly. Note that `scope` can still be used
- to define which kind of scope is created. By default, no scope is created. Use `scope: {}` to create an isolate
- scope (useful for component directives).
-
- If both `bindToController` and `scope` are defined and have object hashes, `bindToController` overrides `scope`.
-
-
- #### `controller`
- Controller constructor function. The controller is instantiated before the
- pre-linking phase and can be accessed by other directives (see
- `require` attribute). This allows the directives to communicate with each other and augment
- each other's behavior. The controller is injectable (and supports bracket notation) with the following locals:
-
- - `$scope` - Current scope associated with the element
- - `$element` - Current element
- - `$attrs` - Current attributes object for the element
- - `$transclude` - A transclude linking function pre-bound to the correct transclusion scope:
- `function([scope], cloneLinkingFn, futureParentElement, slotName)`:
- - `scope`: (optional) override the scope.
- - `cloneLinkingFn`: (optional) argument to create clones of the original transcluded content.
- - `futureParentElement` (optional):
-        * defines the parent to which the `cloneLinkingFn` will add the cloned elements.
-        * default: `$element.parent()` resp. `$element` for `transclude:'element'` resp. `transclude:true`.
-        * only needed for transcludes that are allowed to contain non html elements (e.g. SVG elements)
-          and when the `cloneLinkingFn` is passed,
-          as those elements need to created and cloned in a special way when they are defined outside their
-          usual containers (e.g. like `<svg>`).
-        * See also the `directive.templateNamespace` property.
- - `slotName`: (optional) the name of the slot to transclude. If falsy (e.g. `null`, `undefined` or `''`)
-      then the default transclusion is provided.
- The `$transclude` function also has a method on it, `$transclude.isSlotFilled(slotName)`, which returns
- `true` if the specified slot contains content (i.e. one or more DOM nodes).
-
- #### `require`
- Require another directive and inject its controller as the fourth argument to the linking function. The
- `require` property can be a string, an array or an object:
- - a **string** containing the name of the directive to pass to the linking function
- - an **array** containing the names of directives to pass to the linking function. The argument passed to the
- linking function will be an array of controllers in the same order as the names in the `require` property
- - an **object** whose property values are the names of the directives to pass to the linking function. The argument
- passed to the linking function will also be an object with matching keys, whose values will hold the corresponding
- controllers.
-
- If the `require` property is an object and `bindToController` is truthy, then the required controllers are
- bound to the controller using the keys of the `require` property. This binding occurs after all the controllers
- have been constructed but before `$onInit` is called.
- If the name of the required controller is the same as the local name (the key), the name can be
- omitted. For example, `{parentDir: '^^'}` is equivalent to `{parentDir: '^^parentDir'}`.
- See the {@link $compileProvider#component} helper for an example of how this can be used.
- If no such required directive(s) can be found, or if the directive does not have a controller, then an error is
- raised (unless no link function is specified and the required controllers are not being bound to the directive
- controller, in which case error checking is skipped). The name can be prefixed with:
-
- - (no prefix) - Locate the required controller on the current element. Throw an error if not found.
- - `?` - Attempt to locate the required controller or pass `null` to the `link` fn if not found.
- - `^` - Locate the required controller by searching the element and its parents. Throw an error if not found.
- - `^^` - Locate the required controller by searching the element's parents. Throw an error if not found.
- - `?^` - Attempt to locate the required controller by searching the element and its parents or pass
- `null` to the `link` fn if not found.
- - `?^^` - Attempt to locate the required controller by searching the element's parents, or pass
- `null` to the `link` fn if not found.
-
-
- #### `controllerAs`
- Identifier name for a reference to the controller in the directive's scope.
- This allows the controller to be referenced from the directive template. This is especially
- useful when a directive is used as component, i.e. with an `isolate` scope. It's also possible
- to use it in a directive without an `isolate` / `new` scope, but you need to be aware that the
- `controllerAs` reference might overwrite a property that already exists on the parent scope.
-
-
- #### `restrict`
- String of subset of `EACM` which restricts the directive to a specific directive
- declaration style. If omitted, the defaults (elements and attributes) are used.
-
- - `E` - Element name (default): `<my-directive></my-directive>`
- - `A` - Attribute (default): `<div my-directive="exp"></div>`
- - `C` - Class: `<div class="my-directive: exp;"></div>`
- - `M` - Comment: `<!-- directive: my-directive exp -->`
-
-
- #### `templateNamespace`
- String representing the document type used by the markup in the template.
- AngularJS needs this information as those elements need to be created and cloned
- in a special way when they are defined outside their usual containers like `<svg>` and `<math>`.
-
- - `html` - All root nodes in the template are HTML. Root nodes may also be
- top-level elements such as `<svg>` or `<math>`.
- - `svg` - The root nodes in the template are SVG elements (excluding `<math>`).
- - `math` - The root nodes in the template are MathML elements (excluding `<svg>`).
-
- If no `templateNamespace` is specified, then the namespace is considered to be `html`.
-
- #### `template`
- HTML markup that may:
- - Replace the contents of the directive's element (default).
- - Replace the directive's element itself (if `replace` is true - DEPRECATED).
- - Wrap the contents of the directive's element (if `transclude` is true).
-
- Value may be:
-
- - A string. For example `<div red-on-hover>{{delete_str}}</div>`.
- - A function which takes two arguments `tElement` and `tAttrs` (described in the `compile`
- function api below) and returns a string value.
-
-
- #### `templateUrl`
- This is similar to `template` but the template is loaded from the specified URL, asynchronously.
-
- Because template loading is asynchronous the compiler will suspend compilation of directives on that element
- for later when the template has been resolved. In the meantime it will continue to compile and link
- sibling and parent elements as though this element had not contained any directives.
-
- The compiler does not suspend the entire compilation to wait for templates to be loaded because this
- would result in the whole app "stalling" until all templates are loaded asynchronously - even in the
- case when only one deeply nested directive has `templateUrl`.
-
- Template loading is asynchronous even if the template has been preloaded into the {@link $templateCache}.
-
- You can specify `templateUrl` as a string representing the URL or as a function which takes two
- arguments `tElement` and `tAttrs` (described in the `compile` function api below) and returns
- a string value representing the url. In either case, the template URL is passed through {@link
- $sce#getTrustedResourceUrl $sce.getTrustedResourceUrl}.
-
-
- #### `replace`
- <div class="alert alert-danger">
- **Note:** `replace` is deprecated in AngularJS and has been removed in the new Angular (v2+).
- </div>
-
- Specifies what the template should replace. Defaults to `false`.
-
- - `true` - the template will replace the directive's element.
- - `false` - the template will replace the contents of the directive's element.
-
- The replacement process migrates all of the attributes / classes from the old element to the new
- one. See the {@link guide/directive#template-expanding-directive
- Directives Guide} for an example.
-
- There are very few scenarios where element replacement is required for the application function,
- the main one being reusable custom components that are used within SVG contexts
- (because SVG doesn't work with custom elements in the DOM tree).
-
- #### `transclude`
- Extract the contents of the element where the directive appears and make it available to the directive.
- The contents are compiled and provided to the directive as a **transclusion function**. See the
- {@link $compile#transclusion Transclusion} section below.
-
-
- #### `compile`
-
- ```js

  ```

- function compile(tElement, tAttrs, transclude) { ... }
- ```

  ```

-
- The compile function deals with transforming the template DOM. Since most directives do not do
- template transformation, it is not used often. The compile function takes the following arguments:
-
- - `tElement` - template element - The element where the directive has been declared. It is
-     safe to do template transformation on the element and child elements only.
-
- - `tAttrs` - template attributes - Normalized list of attributes declared on this element shared
-     between all directive compile functions.
-
- - `transclude` - [*DEPRECATED*!] A transclude linking function: `function(scope, cloneLinkingFn)`
-
- <div class="alert alert-warning">
- **Note:** The template instance and the link instance may be different objects if the template has
- been cloned. For this reason it is **not** safe to do anything other than DOM transformations that
- apply to all cloned DOM nodes within the compile function. Specifically, DOM listener registration
- should be done in a linking function rather than in a compile function.
- </div>

- <div class="alert alert-warning">
- **Note:** The compile function cannot handle directives that recursively use themselves in their
- own templates or compile functions. Compiling these directives results in an infinite loop and
- stack overflow errors.
-
- This can be avoided by manually using `$compile` in the postLink function to imperatively compile
- a directive's template instead of relying on automatic template compilation via `template` or
- `templateUrl` declaration or manual compilation inside the compile function.
- </div>
-
- <div class="alert alert-danger">
- **Note:** The `transclude` function that is passed to the compile function is deprecated, as it
- e.g. does not know about the right outer scope. Please use the transclude function that is passed
- to the link function instead.
- </div>

- A compile function can have a return value which can be either a function or an object.
-
- - returning a (post-link) function - is equivalent to registering the linking function via the
- `link` property of the config object when the compile function is empty.
-
- - returning an object with function(s) registered via `pre` and `post` properties - allows you to
- control when a linking function should be called during the linking phase. See info about
- pre-linking and post-linking functions below.
-
-
- #### `link`
- This property is used only if the `compile` property is not defined.
-
- ```js

  ```

- function link(scope, iElement, iAttrs, controller, transcludeFn) { ... }
- ```

  ```

-
- The link function is responsible for registering DOM listeners as well as updating the DOM. It is
- executed after the template has been cloned. This is where most of the directive logic will be
- put.
-
- - `scope` - {@link ng.$rootScope.Scope Scope} - The scope to be used by the
-     directive for registering {@link ng.$rootScope.Scope#$watch watches}.
-
- - `iElement` - instance element - The element where the directive is to be used. It is safe to
-     manipulate the children of the element only in `postLink` function since the children have
-     already been linked.
-
- - `iAttrs` - instance attributes - Normalized list of attributes declared on this element shared
-     between all directive linking functions.
-
- - `controller` - the directive's required controller instance(s) - Instances are shared
-     among all directives, which allows the directives to use the controllers as a communication
-     channel. The exact value depends on the directive's `require` property:
-       * no controller(s) required: the directive's own controller, or `undefined` if it doesn't have one
-       * `string`: the controller instance
-       * `array`: array of controller instances
-
-     If a required controller cannot be found, and it is optional, the instance is `null`,
-     otherwise the {@link error:$compile:ctreq Missing Required Controller} error is thrown.
-
-     Note that you can also require the directive's own controller - it will be made available like
-     any other controller.
-
- - `transcludeFn` - A transclude linking function pre-bound to the correct transclusion scope.
-     This is the same as the `$transclude` parameter of directive controllers,
-     see {@link ng.$compile#-controller- the controller section for details}.
-     `function([scope], cloneLinkingFn, futureParentElement)`.
-
- #### Pre-linking function
-
- Executed before the child elements are linked. Not safe to do DOM transformation since the
- compiler linking function will fail to locate the correct elements for linking.
-
- #### Post-linking function
-
- Executed after the child elements are linked.
-
- Note that child elements that contain `templateUrl` directives will not have been compiled
- and linked since they are waiting for their template to load asynchronously and their own
- compilation and linking has been suspended until that occurs.
-
- It is safe to do DOM transformation in the post-linking function on elements that are not waiting
- for their async templates to be resolved.
-
-
- ### Transclusion
-
- Transclusion is the process of extracting a collection of DOM elements from one part of the DOM and
- copying them to another part of the DOM, while maintaining their connection to the original AngularJS
- scope from where they were taken.
-
- Transclusion is used (often with {@link ngTransclude}) to insert the
- original contents of a directive's element into a specified place in the template of the directive.
- The benefit of transclusion, over simply moving the DOM elements manually, is that the transcluded
- content has access to the properties on the scope from which it was taken, even if the directive
- has isolated scope.
- See the {@link guide/directive#creating-a-directive-that-wraps-other-elements Directives Guide}.
-
- This makes it possible for the widget to have private state for its template, while the transcluded
- content has access to its originating scope.
-
- <div class="alert alert-warning">
- **Note:** When testing an element transclude directive you must not place the directive at the root of the
- DOM fragment that is being compiled. See {@link guide/unit-testing#testing-transclusion-directives
- Testing Transclusion Directives}.
- </div>
-
- There are three kinds of transclusion depending upon whether you want to transclude just the contents of the
- directive's element, the entire element or multiple parts of the element contents:
-
- - `true` - transclude the content (i.e. the child nodes) of the directive's element.
- - `'element'` - transclude the whole of the directive's element including any directives on this
- element that are defined at a lower priority than this directive. When used, the `template`
- property is ignored.
- - **`{...}` (an object hash):** - map elements of the content onto transclusion "slots" in the template.
-
- **Multi-slot transclusion** is declared by providing an object for the `transclude` property.
-
- This object is a map where the keys are the name of the slot to fill and the value is an element selector
- used to match the HTML to the slot. The element selector should be in normalized form (e.g. `myElement`)
- and will match the standard element variants (e.g. `my-element`, `my:element`, `data-my-element`, etc).
-
- For further information check out the guide on {@link guide/directive#matching-directives Matching Directives}.
-
- If the element selector is prefixed with a `?` then that slot is optional.
-
- For example, the transclude object `{ slotA: '?myCustomElement' }` maps `<my-custom-element>` elements to
- the `slotA` slot, which can be accessed via the `$transclude` function or via the {@link ngTransclude} directive.
-
- Slots that are not marked as optional (`?`) will trigger a compile time error if there are no matching elements
- in the transclude content. If you wish to know if an optional slot was filled with content, then you can call
- `$transclude.isSlotFilled(slotName)` on the transclude function passed to the directive's link function and
- injectable into the directive's controller.
-
-
- #### Transclusion Functions
-
- When a directive requests transclusion, the compiler extracts its contents and provides a \*\*transclusion
- function\*\* to the directive's `link` function and `controller`. This transclusion function is a special
- **linking function** that will return the compiled contents linked to a new transclusion scope.
-
- <div class="alert alert-info">
- If you are just using {@link ngTransclude} then you don't need to worry about this function, since
- ngTransclude will deal with it for us.
- </div>
-
- If you want to manually control the insertion and removal of the transcluded content in your directive
- then you must use this transclude function. When you call a transclude function it returns a jqLite/JQuery
- object that contains the compiled DOM, which is linked to the correct transclusion scope.
-
- When you call a transclusion function you can pass in a **clone attach function**. This function accepts
- two parameters, `function(clone, scope) { ... }`, where the `clone` is a fresh compiled copy of your transcluded
- content and the `scope` is the newly created transclusion scope, which the clone will be linked to.
-
- <div class="alert alert-info">
- **Best Practice**: Always provide a `cloneFn` (clone attach function) when you call a transclude function
- since you then get a fresh clone of the original DOM and also have access to the new transclusion scope.
- </div>
-
- It is normal practice to attach your transcluded content (`clone`) to the DOM inside your \*\*clone
- attach function\*\*:
-
- ```js

  ```

- let transcludedContent, transclusionScope;
-
- $transclude(function(clone, scope) {
- element.append(clone);
- transcludedContent = clone;
- transclusionScope = scope;
- });
- ```

  ```

-
- Later, if you want to remove the transcluded content from your DOM then you should also destroy the
- associated transclusion scope:
-
- ```js

  ```

- transcludedContent.remove();
- transclusionScope.$destroy();
- ```

  ```

-
- <div class="alert alert-info">
- **Best Practice**: if you intend to add and remove transcluded content manually in your directive
- (by calling the transclude function to get the DOM and calling `element.remove()` to remove it),
- then you are also responsible for calling `$destroy` on the transclusion scope.
- </div>
-
- The built-in DOM manipulation directives, such as {@link ngIf}, {@link ngSwitch} and {@link ngRepeat}
- automatically destroy their transcluded clones as necessary so you do not need to worry about this if
- you are simply using {@link ngTransclude} to inject the transclusion into your directive.
-
-
- #### Transclusion Scopes
-
- When you call a transclude function it returns a DOM fragment that is pre-bound to a \*\*transclusion
- scope\*\*. This scope is special, in that it is a child of the directive's scope (and so gets destroyed
- when the directive's scope gets destroyed) but it inherits the properties of the scope from which it
- was taken.
-
- For example consider a directive that uses transclusion and isolated scope. The DOM hierarchy might look
- like this:
-
- ```html

  ```

- <div ng-app>
- <div isolate>
-     <div transclusion>
-     </div>
- </div>
- </div>
- ```

  ```

-
- The `$parent` scope hierarchy will look like this:
- ```
  - $rootScope
    - isolate
      - transclusion
  ```
-
- but the scopes will inherit prototypically from different scopes to their `$parent`.
- ```
  - $rootScope
    - transclusion
  - isolate
  ```
-
-
- ### Attributes
-
- The {@link ng.$compile.directive.Attributes Attributes} object - passed as a parameter in the
- `link()` or `compile()` functions. It has a variety of uses.
-
- - _Accessing normalized attribute names:_ Directives like `ngBind` can be expressed in many ways:
- `ng:bind`, `data-ng-bind`, or `ng-bind`. The attributes object allows for normalized access
- to the attributes.
-
- - _Directive inter-communication:_ All directives share the same instance of the attributes
- object which allows the directives to use the attributes object as inter directive
- communication.
-
- - _Supports interpolation:_ Interpolation attributes are assigned to the attribute object
- allowing other directives to read the interpolated value.
-
- - _Observing interpolated attributes:_ Use `$observe` to observe the value changes of attributes
- that contain interpolation (e.g. `src="{{bar}}"`). Not only is this very efficient but it's also
- the only way to easily get the actual value because during the linking phase the interpolation
- hasn't been evaluated yet and so the value is at this time set to `undefined`.
-
- ```js

  ```

- function linkingFn(scope, elm, attrs, ctrl) {
- // get the attribute value
- console.log(attrs.ngModel);
-
- // change the attribute
- attrs.$set('ngModel', 'new value');
-
- // observe changes to interpolated attribute
- attrs.$observe('ngModel', function(value) {
-     console.log('ngModel has changed value to ' + value);
- });
- }
- ```

  ```

-
-
-
- @param {string|Element} element Element or HTML string to compile into a template function.
- @param {function(angular.Scope, cloneAttachFn=)} transclude function available to directives - DEPRECATED.
-
- <div class="alert alert-danger">
- **Note:** Passing a `transclude` function to the $compile function is deprecated, as it
- e.g. will not use the right outer scope. Please pass the transclude function as a
- `parentBoundTranscludeFn` to the link function instead.
- </div>
-
- @param {number} maxPriority only apply directives lower than given priority (Only effects the
-                 root element(s), not their children)
- @returns {function(scope, cloneAttachFn=, options=)} a link function which is used to bind template
- (a DOM element/tree) to a scope. Where:
-
- - `scope` - A {@link ng.$rootScope.Scope Scope} to bind to.
- - `cloneAttachFn` - If `cloneAttachFn` is provided, then the link function will clone the
- `template` and call the `cloneAttachFn` function allowing the caller to attach the
- cloned elements to the DOM document at the appropriate place. The `cloneAttachFn` is
- called as: <br/> `cloneAttachFn(clonedElement, scope)` where:
-
-      * `clonedElement` - is a clone of the original `element` passed into the compiler.
-      * `scope` - is the current scope with which the linking function is working with.
-
- - `options` - An optional object hash with linking options. If `options` is provided, then the following
- keys may be used to control linking behavior:
-
-      * `parentBoundTranscludeFn` - the transclude function made available to
-        directives; if given, it will be passed through to the link functions of
-        directives found in `element` during compilation.
-      * `transcludeControllers` - an object hash with keys that map controller names
-        to a hash with the key `instance`, which maps to the controller instance;
-        if given, it will make the controllers available to directives on the compileNode:
-        ```
-        {
-          parent: {
-            instance: parentControllerInstance
-          }
-        }
-        ```
-      * `futureParentElement` - defines the parent to which the `cloneAttachFn` will add
-        the cloned elements; only needed for transcludes that are allowed to contain non HTML
-        elements (e.g. SVG elements). See also the `directive.controller` property.
-
- Calling the linking function returns the element of the template. It is either the original
- element passed in, or the clone of the element if the `cloneAttachFn` is provided.
-
- After linking the view is not updated until after a call to `$digest`, which typically is done by
- AngularJS automatically.
-
- If you need access to the bound view, there are two ways to do it:
-
- - If you are not asking the linking function to clone the template, create the DOM element(s)
- before you send them to the compiler and keep this reference around.
- ```js

  ```

-     let element = angular.element('<p>{{total}}</p>');
-     $compile(element)(scope);
- ```

  ```

-
- - if on the other hand, you need the element to be cloned, the view reference from the original
- example would not point to the clone, but rather to the original template that was cloned. In
- this case, you can access the clone either via the `cloneAttachFn` or the value returned by the
- linking function:
- ```js

  ```

-     let templateElement = angular.element('<p>{{total}}</p>');
-     let clonedElement = $compile(templateElement)(scope, function(clonedElement, scope) {
-       // Attach the clone to DOM document at the right place.
-     });
-
-     // Now we have reference to the cloned DOM via `clonedElement`.
-     // NOTE: The `clonedElement` returned by the linking function is the same as the
-     //       `clonedElement` passed to `cloneAttachFn`.
- ```

  ```

-
-
- For information on how the compiler works, see the
- {@link guide/compiler AngularJS HTML Compiler} section of the Developer Guide.
-
- @knownIssue
-
- ### Double Compilation
- Double compilation occurs when an already compiled part of the DOM gets
  compiled again. This is an undesired effect and can lead to misbehaving directives, performance issues,
  and memory leaks. Refer to the Compiler Guide {@link guide/compiler#double-compilation-and-how-to-avoid-it
  section on double compilation} for an in-depth explanation and ways to avoid it.

- @knownIssue

  ### Issues with `replace: true`

-
- <div class="alert alert-danger">
- **Note**: {@link $compile#-replace- `replace: true`} is deprecated and not recommended to use,
- mainly due to the issues listed here. It has been completely removed in the new Angular.
- </div>
-
- #### Attribute values are not merged
-
- When a `replace` directive encounters the same attribute on the original and the replace node,
- it will simply deduplicate the attribute and join the values with a space or with a `;` in case of
- the `style` attribute.
- ```html

  ```

- Original Node: <span class="original" style="color: red;"></span>
- Replace Template: <span class="replaced" style="background: blue;"></span>
- Result: <span class="original replaced" style="color: red; background: blue;"></span>
- ```

  ```

-
- That means attributes that contain AngularJS expressions will not be merged correctly, e.g.
- {@link ngShow} or {@link ngClass} will cause a {@link $parse} error:
-
- ```html

  ```

- Original Node: <span ng-class="{'something': something}" ng-show="!condition"></span>
- Replace Template: <span ng-class="{'else': else}" ng-show="otherCondition"></span>
- Result: <span ng-class="{'something': something} {'else': else}" ng-show="!condition otherCondition"></span>
- ```

  ``
  ```

-
- See issue [#5695](https://github.com/angular/angular.js/issues/5695).
-
- #### Directives are not deduplicated before compilation
-
- When the original node and the replace template declare the same directive(s), they will be
- {@link guide/compiler#double-compilation-and-how-to-avoid-it compiled twice} because the compiler
- does not deduplicate them. In many cases, this is not noticeable, but e.g. {@link ngModel} will
- attach `$formatters` and `$parsers` twice.
-
- See issue [#2573](https://github.com/angular/angular.js/issues/2573).
-
- #### `transclude: element` in the replace template root can have unexpected effects
-
- When the replace template has a directive at the root node that uses
- {@link $compile#-transclude- `transclude: element`}, e.g.
- {@link ngIf} or {@link ngRepeat}, the DOM structure or scope inheritance can be incorrect.
- See the following issues:
-
- - Incorrect scope on replaced element:
- [#9837](https://github.com/angular/angular.js/issues/9837)
- - Different DOM between `template` and `templateUrl`:
- [#10612](https://github.com/angular/angular.js/issues/14326)
- \*/

/\*\*

- @ngdoc directive
- @name ngProp
- @restrict A
- @element ANY
-
- @usage
-
- ```html

  ```

- <ANY ng-prop-propname="expression">
- </ANY>
- ```

  ```

-
- or with uppercase letters in property (e.g. "propName"):
-
-
- ```html

  ```

- <ANY ng-prop-prop_name="expression">
- </ANY>
- ```

  ```

-
-
- @description
- The `ngProp` directive binds an expression to a DOM element property.
- `ngProp` allows writing to arbitrary properties by including
- the property name in the attribute, e.g. `ng-prop-value="'my value'"` binds 'my value' to
- the `value` property.
-
- Usually, it's not necessary to write to properties in AngularJS, as the built-in directives
- handle the most common use cases (instead of the above example, you would use {@link ngValue}).
-
- However, [custom elements](https://developer.mozilla.org/docs/Web/Web_Components/Using_custom_elements)
- often use custom properties to hold data, and `ngProp` can be used to provide input to these
- custom elements.
-
- ## Binding to camelCase properties
-
- Since HTML attributes are case-insensitive, camelCase properties like `innerHTML` must be escaped.
- AngularJS uses the underscore (\_) in front of a character to indicate that it is uppercase, so
- `innerHTML` must be written as `ng-prop-inner_h_t_m_l="expression"` (Note that this is just an
- example, and for binding HTML {@link ngBindHtml} should be used.
-
- ## Security
-
- Binding expressions to arbitrary properties poses a security risk, as properties like `innerHTML`
- can insert potentially dangerous HTML into the application, e.g. script tags that execute
- malicious code.
- For this reason, `ngProp` applies Strict Contextual Escaping with the {@link ng.$sce $sce service}.
- This means vulnerable properties require their content to be "trusted", based on the
- context of the property. For example, the `innerHTML` is in the `HTML` context, and the
- `iframe.src` property is in the `RESOURCE_URL` context, which requires that values written to
- this property are trusted as a `RESOURCE_URL`.
-
- This can be set explicitly by calling $sce.trustAs(type, value) on the value that is
- trusted before passing it to the `ng-prop-*` directive. There are exist shorthand methods for
- each context type in the form of {@link ng.$sce#trustAsResourceUrl $sce.trustAsResourceUrl()} et al.
-
- In some cases you can also rely upon automatic sanitization of untrusted values - see below.
-
- Based on the context, other options may exist to mark a value as trusted / configure the behavior
- of {@link ng.$sce}. For example, to restrict the `RESOURCE_URL` context to specific origins, use
- the {@link $sceDelegateProvider#trustedResourceUrlList trustedResourceUrlList()}
- and {@link $sceDelegateProvider#bannedResourceUrlList bannedResourceUrlList()}.
-
- {@link ng.$sce#what-trusted-context-types-are-supported- Find out more about the different context types}.
-
- ### HTML Sanitization
-
- By default, `$sce` will throw an error if it detects untrusted HTML content, and will not bind the
- content.
- However, if you include the {@link ngSanitize ngSanitize module}, it will try to sanitize the
- potentially dangerous HTML, e.g. strip non-trusted tags and attributes when binding to
- `innerHTML`.
-
- \*/

/\*\* @ngdoc directive

- @name ngOn
- @restrict A
- @element ANY
-
- @usage
-
- ```html

  ```

- <ANY ng-on-eventname="expression">
- </ANY>
- ```

  ```

-
- or with uppercase letters in property (e.g. "eventName"):
-
-
- ```html

  ```

- <ANY ng-on-event_name="expression">
- </ANY>
- ```

  ```

-
- @description
- The `ngOn` directive adds an event listener to a DOM element via
- {@link angular.element angular.element().on()}, and evaluates an expression when the event is
- fired.
- `ngOn` allows adding listeners for arbitrary events by including
- the event name in the attribute, e.g. `ng-on-drop="onDrop()"` executes the 'onDrop()' expression
- when the `drop` event is fired.
-
- AngularJS provides specific directives for many events, such as {@link ngClick}, so in most
- cases it is not necessary to use `ngOn`. However, AngularJS does not support all events
- (e.g. the `drop` event in the example above), and new events might be introduced in later DOM
- standards.
-
- Another use-case for `ngOn` is listening to
- [custom events](https://developer.mozilla.org/docs/Web/Guide/Events/Creating_and_triggering_events)
- fired by
- [custom elements](https://developer.mozilla.org/docs/Web/Web_Components/Using_custom_elements).
-
- ## Binding to camelCase properties
-
- Since HTML attributes are case-insensitive, camelCase properties like `myEvent` must be escaped.
- AngularJS uses the underscore (\_) in front of a character to indicate that it is uppercase, so
- `myEvent` must be written as `ng-on-my_event="expression"`.
-
- \*/

/\*\*

- @ngdoc type
- @name $compile.directive.Attributes
-
- @description
- A shared object between directive compile / linking functions which contains normalized DOM
- element attributes. The values reflect current binding state `{{ }}`. The normalization is
- needed since all of these are treated as equivalent in AngularJS:
-
- ```

  ```

- <span ng:bind="a" ng-bind="a" data-ng-bind="a" ng-bind="a">
- ```
  */
  ```

/\*\*

- @ngdoc property
- @name $compile.directive.Attributes#$attr
-
- @description
- A map of DOM element attribute names to the normalized name. This is
- needed to do reverse lookup from normalized name back to actual name.
  \*/

/\*\*

- @ngdoc method
- @name $compile.directive.Attributes#$set
- @kind function
-
- @description
- Set DOM element attribute value.
-
-
- @param {string} str1 Normalized element attribute name of the property to modify. The name is
-          reverse-translated using the {@link ng.$compile.directive.Attributes#$attr $attr}
-          property to the original name.
- @param {string} str2 Value to set the attribute to. The value can be an interpolated string.
- @returns {string}
  \*/
