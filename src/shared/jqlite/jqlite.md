/\*\*

- Wraps a raw DOM element or HTML string as a [jQuery](http://jquery.com) element. Regardless of the presence of jQuery, `angular.element`
- delegates to AngularJS's built-in subset of jQuery, called "jQuery lite" or **jqLite**.
-
- JQLite is a tiny, API-compatible subset of jQuery that allows
- AngularJS to manipulate the DOM in a cross-browser compatible way. JQLite implements only the most
- commonly needed functionality with the goal of having a very small footprint.
-
- <div class="alert alert-info">**Note:** All element references in AngularJS are always wrapped with
- JQLite (such as the element argument in a directive's compile / link function). They are never raw DOM references.</div>
-
- <div class="alert alert-warning">**Note:** Keep in mind that this function will not find elements
- by tag name / CSS selector. For lookups by tag name, try instead `angular.element(document).find(...)`
- or `$document.find()`, or use the standard DOM APIs, e.g. `document.querySelectorAll()`.</div>
-
- ## AngularJS's JQLite
- JQLite provides only the following jQuery methods:
-
- - [`after()`](http://api.jquery.com/after/)
- - [`append()`](http://api.jquery.com/append/) - Contrary to jQuery, this doesn't clone elements
- so will not work correctly when invoked on a JQLite object containing more than one DOM node
- - [`attr()`](http://api.jquery.com/attr/) - Does not support functions as parameters
- - [`children()`](http://api.jquery.com/children/) - Does not support selectors
- - [`data()`](http://api.jquery.com/data/)
- - [`empty()`](http://api.jquery.com/empty/)
- - [`eq()`](http://api.jquery.com/eq/)
- - [`html()`](http://api.jquery.com/html/)
- - [`on()`](http://api.jquery.com/on/) - Does not support namespaces, selectors or eventData
- - [`off()`](http://api.jquery.com/off/) - Does not support namespaces, selectors or event object as parameter
- - [`parent()`](http://api.jquery.com/parent/) - Does not support selectors
- - [`prepend()`](http://api.jquery.com/prepend/)
- - [`remove()`](http://api.jquery.com/remove/)
- - [`removeData()`](http://api.jquery.com/removeData/)
- - [`replaceWith()`](http://api.jquery.com/replaceWith/)
- - [`text()`](http://api.jquery.com/text/)
- - [`val()`](http://api.jquery.com/val/)
-
- ## jQuery/jqLite Extras
- AngularJS also provides the following additional methods and events to both jQuery and JQLite:
-
- ### Events
- - `$destroy` - AngularJS intercepts all JQLite/jQuery's DOM destruction apis and fires this event
- on all DOM nodes being removed. This can be used to clean up any 3rd party bindings to the DOM
- element before it is removed.
-
- ### Methods
- - `controller(name)` - retrieves the controller of the current element or its parent. By default
- retrieves controller associated with the `ngController` directive. If `name` is provided as
- camelCase directive name, then the controller for this directive will be retrieved (e.g.
- `'ngModel'`).
- - `injector()` - retrieves the injector of the current element or its parent.
- - `scope()` - retrieves the {@link ng.$rootScope.Scope scope} of the current
- element or its parent. Requires {@link guide/production#disabling-debug-data Debug Data} to
- be enabled.
- - `isolateScope()` - retrieves an isolate {@link ng.$rootScope.Scope scope} if one is attached directly to the
- current element. This getter should be used only on elements that contain a directive which starts a new isolate
- scope. Calling `scope()` on this element always returns the original non-isolate scope.
- Requires {@link guide/production#disabling-debug-data Debug Data} to be enabled.
- - `inheritedData()` - same as `data()`, but walks up the DOM until a value is found or the top
- parent element is reached.
  \*/
