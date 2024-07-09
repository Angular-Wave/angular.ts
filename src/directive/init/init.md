## `ngInit` Directive

### Restrict

`AC`

### Priority

450

### Element

`ANY`

### Parameter

- `{string} ngInit`: [Expression](guide/expression) to eval.

### Description

The `ngInit` directive allows you to evaluate an expression in the current scope.

<div class="alert alert-danger">
This directive can be abused to add unnecessary amounts of logic into your templates.
There are only a few appropriate uses of `ngInit`:
<ul>
  <li>aliasing special properties of [`ngRepeat`](ng.directive:ngRepeat), as seen in the demo below.</li>
  <li>initializing data during development, or for examples, as seen throughout these docs.</li>
  <li>injecting data via server side scripting.</li>
</ul>

Besides these few cases, you should use [Components](guide/component) or [Controllers](guide/controller) rather than `ngInit` to initialize values on a scope.

</div>

<div class="alert alert-warning">
**Note**: If you have assignment in `ngInit` along with a [`filter`](ng.$filter), make sure you have parentheses to ensure correct operator precedence:
<pre class="prettyprint">
`<div ng-init="test1 = ($index | toString)"></div>`
</pre>
</div>
