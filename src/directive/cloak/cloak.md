## `ngCloak` Directive

### Restrict

`AC`

### Description

The `ngCloak` directive is used to prevent the AngularTS HTML template from being briefly displayed by the browser in its raw (uncompiled) form while your application is loading. Use this directive to avoid the undesirable flicker effect caused by the HTML template display.

The directive can be applied to the `<body>` element, but the preferred usage is to apply multiple `ngCloak` directives to small portions of the page to permit progressive rendering of the browser view.

`ngCloak` works in cooperation with the following CSS rule embedded within `angular.js` and `angular.min.js`. For CSP mode, please add `angular-csp.css` to your HTML file (see [`ngCsp`](ng.directive:ngCsp)).

```css
[ng\:cloak],
[ng-cloak],
[data-ng-cloak],
[ng-cloak],
.ng-cloak,
.ng-cloak {
  display: none !important;
}
```
