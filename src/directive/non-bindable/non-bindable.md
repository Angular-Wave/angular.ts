## `ngNonBindable` Directive

### Restrict

`AC`

### Priority

1000

### Element

`ANY`

### Description

The `ngNonBindable` directive tells AngularTS not to compile or bind the contents of the current DOM element, including directives on the element itself that have a lower priority than `ngNonBindable`. This is useful if the element contains what appears to be AngularTS directives and bindings but which should be ignored by AngularTS. This could be the case if you have a site that displays snippets of code, for instance.
