/\*\*

- @name ngInclude
- @restrict ECA
- @scope
- @priority -400
-
- @description
- Fetches, compiles and includes an external HTML fragment.
-
- By default, the template URL is restricted to the same domain and protocol as the
- application document. This is done by calling {@link $sce#getTrustedResourceUrl
- $sce.getTrustedResourceUrl} on it. To load templates from other domains or protocols
- you may either add them to your {@link ng.$sceDelegateProvider#trustedResourceUrlList trusted
- resource URL list} or {@link $sce#trustAsResourceUrl wrap them} as trusted values. Refer to
- AngularTS's {@link ng.$sce Strict Contextual Escaping}.
-
- In addition, the browser's
- [Same Origin Policy](https://code.google.com/p/browsersec/wiki/Part2#Same-origin_policy_for_XMLHttpRequest)
- and [Cross-Origin Resource Sharing (CORS)](http://www.w3.org/TR/cors/)
- policy may further restrict whether the template is successfully loaded.
- For example, `ngInclude` won't work for cross-domain requests on all browsers and for `file://`
- access on some browsers.
- The `enter` and `leave` animation effects can be enabled for the element by
  setting data attribute (`data-*`) or custom attribute `animate` to `true` attribute.

- @animations
- | Animation | Occurs |
- |----------------------------------|-------------------------------------|
- | {@link ng.$animate#enter enter} | when the expression changes, on the new include |
- | {@link ng.$animate#leave leave} | when the expression changes, on the old include |
-
- The enter and leave animation occur concurrently.
-
- @param {string} ngInclude|src AngularTS expression evaluating to URL. If the source is a string constant,
-                 make sure you wrap it in **single** quotes, e.g. `src="'myPartialTemplate.html'"`.
- @param {string=} onload Expression to evaluate when a new partial is loaded.
-                  <div class="alert alert-warning">
-                  **Note:** When using onload on SVG elements in IE11, the browser will try to call
-                  a function with the name on the window element, which will usually throw a
-                  "function is undefined" error. To fix this, you can instead use `data-onload` or a
-                  different form that {@link guide/directive#normalization matches} `onload`.
-                  </div>
-
- @param {string=} autoscroll Whether `ngInclude` should call {@link ng.$anchorScroll
-                  $anchorScroll} to scroll the viewport after the content is loaded.
-
-                  - If the attribute is not set, disable scrolling.
-                  - If the attribute is set without value, enable scrolling.
-                  - Otherwise enable scrolling only if the expression evaluates to truthy value.
- \*/

/\*\*

- @ngdoc event
- @name ngInclude#$includeContentRequested
- @eventType emit on the scope ngInclude was declared in
- @description
- Emitted every time the ngInclude content is requested.
-
- @param {Object} angularEvent Synthetic event object.
- @param {String} src URL of content to load.
  \*/

/\*\*

- @ngdoc event
- @name ngInclude#$includeContentLoaded
- @eventType emit on the current ngInclude scope
- @description
- Emitted every time the ngInclude content is reloaded.
-
- @param {Object} angularEvent Synthetic event object.
- @param {String} src URL of content to load.
  \*/

/\*\*

- @ngdoc event
- @name ngInclude#$includeContentError
- @eventType emit on the scope ngInclude was declared in
- @description
- Emitted when a template HTTP request yields an erroneous response (status < 200 || status > 299)
-
- @param {Object} angularEvent Synthetic event object.
- @param {String} src URL of content to load.
  \*/
