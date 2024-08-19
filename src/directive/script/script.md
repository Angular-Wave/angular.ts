/\*\*

- Load the content of a `<script>` element into {@link ng.$templateCache `$templateCache`}, so that the
- template can be used by {@link ng.directive:ngInclude `ngInclude`},
- {@link ngRoute.directive:ngView `ngView`}, or {@link guide/directive directives}. The type of the
- `<script>` element must be specified as `text/ng-template`, and a cache name for the template must be
- assigned through the element's `id`, which can then be used as a directive's `templateUrl`.
-
- @param {string} type Must be set to `'text/ng-template'`.
- @param {string} id Cache name of the template.
  \*/
