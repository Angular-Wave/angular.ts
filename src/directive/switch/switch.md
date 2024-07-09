/\*\*

- @ngdoc directive
- @name ngSwitch
- @restrict EA
-
- @description
- The `ngSwitch` directive is used to conditionally swap DOM structure on your template based on a scope expression.
- Elements within `ngSwitch` but without `ngSwitchWhen` or `ngSwitchDefault` directives will be preserved at the location
- as specified in the template.
-
- The directive itself works similar to ngInclude, however, instead of downloading template code (or loading it
- from the template cache), `ngSwitch` simply chooses one of the nested elements and makes it visible based on which element
- matches the value obtained from the evaluated expression. In other words, you define a container element
- (where you place the directive), place an expression on the **`on="..."` attribute**
- (or the **`ng-switch="..."` attribute**), define any inner elements inside of the directive and place
- a when attribute per element. The when attribute is used to inform ngSwitch which element to display when the on
- expression is evaluated. If a matching expression is not found via a when attribute then an element with the default
- attribute is displayed.
-
- <div class="alert alert-info">
- Be aware that the attribute values to match against cannot be expressions. They are interpreted
- as literal string values to match against.
- For example, **`ng-switch-when="someVal"`** will match against the string `"someVal"` not against the
- value of the expression `$scope.someVal`.
- </div>

- @animations
- | Animation | Occurs |
- |----------------------------------|-------------------------------------|
- | {@link ng.$animate#enter enter} | after the ngSwitch contents change and the matched child element is placed inside the container |
- | {@link ng.$animate#leave leave} | after the ngSwitch contents change and just before the former contents are removed from the DOM |
-
- @usage
-
- ```

  ```

- <ANY ng-switch="expression">
- <ANY ng-switch-when="matchValue1">...</ANY>
- <ANY ng-switch-when="matchValue2">...</ANY>
- <ANY ng-switch-default>...</ANY>
- </ANY>
- ```

  ```

-
-
- @scope
- @priority 1200
- @param {\*} ngSwitch|on expression to match against <code>ng-switch-when</code>.
- On child elements add:
-
- - `ngSwitchWhen`: the case statement to match against. If match then this
- case will be displayed. If the same match appears multiple times, all the
- elements will be displayed. It is possible to associate multiple values to
- the same `ngSwitchWhen` by defining the optional attribute
- `ngSwitchWhenSeparator`. The separator will be used to split the value of
- the `ngSwitchWhen` attribute into multiple tokens, and the element will show
- if any of the `ngSwitch` evaluates to any of these tokens.
- - `ngSwitchDefault`: the default case when no other case match. If there
- are multiple default cases, all of them will be displayed when no other
- case match.
- \*/
