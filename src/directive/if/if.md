@name ngIf
@restrict A

@description
The `ngIf` directive removes or recreates a portion of the DOM tree based on an
{expression}. If the expression assigned to `ngIf` evaluates to a false
value then the element is removed from the DOM, otherwise a clone of the
element is reinserted into the DOM.

`ngIf` differs from `ngShow` and `ngHide` in that `ngIf` completely removes and recreates the
element in the DOM rather than changing its visibility via the `display` css property. A common
case when this difference is significant is when using css selectors that rely on an element's
position within the DOM, such as the `:first-child` or `:last-child` pseudo-classes.

Note that when an element is removed using `ngIf` its scope is destroyed and a new scope
is created when the element is restored. The scope created within `ngIf` inherits from
its parent scope using
[prototypal inheritance](https://github.com/angular/angular.js/wiki/Understanding-Scopes#javascript-prototypal-inheritance).
An important implication of this is if `ngModel` is used within `ngIf` to bind to
a javascript primitive defined in the parent scope. In this case any modifications made to the
variable within the child scope will override (hide) the value in the parent scope.

Also, `ngIf` recreates elements using their compiled state. An example of this behavior
is if an element's class attribute is directly modified after it's compiled, using something like
jQuery's `.addClass()` method, and the element is later removed. When `ngIf` recreates the element
the added class will be lost because the original compiled state is used to regenerate the element.

Additionally, the `enter` and `leave` animation effects can be enabled for the element by
setting data attribute (`data-*`) or custom attribute `animate` to `true` attribute.

@animations
| Animation | Occurs |
|----------------------------------|-------------------------------------|
| {@link ng.$animate#enter enter} | just after the `ngIf` contents change and a new DOM element is created and injected into the `ngIf` container |
| {@link ng.$animate#leave leave} | just before the `ngIf` contents are removed from the DOM |

- @element ANY
  @scope
  @priority 600
  @param {string} ngIf If the {@link guide/expression expression} is falsy then
  the element is removed from the DOM tree. If it is truthy a copy of the compiled
  element is added to the DOM tree.

- @example
  <example module="ngAnimate" deps="angular-animate.js" animations="true" name="ng-if">
  <file name="index.html">
  <label>Click me: <input type="checkbox" ng-model="checked" ng-init="checked=true" /></label><br/>
  Show when checked:
  <span ng-if="checked" class="animate-if">
  This is removed when the checkbox is unchecked.
  </span>
  </file>
  <file name="animations.css">
  .animate-if {
  background:white;
  border:1px solid black;
  padding:10px;
  }

         .animate-if.ng-enter, .animate-if.ng-leave {
           transition:all cubic-bezier(0.250, 0.460, 0.450, 0.940) 0.5s;
         }

         .animate-if.ng-enter,
         .animate-if.ng-leave.ng-leave-active {
           opacity:0;
         }

         .animate-if.ng-leave,
         .animate-if.ng-enter.ng-enter-active {
           opacity:1;
         }

       </file>

     </example>
