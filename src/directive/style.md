## `ngStyle` Directive

### Restrict

`AC`

### Description

The `ngStyle` directive allows you to set CSS style on an HTML element conditionally.

### Known Issue

You should not use [interpolation](guide/interpolation) in the value of the `style` attribute when using the `ngStyle` directive on the same element. See [here](guide/interpolation#known-issues) for more info.

### Element

`ANY`

### Parameter

- `{string} ngStyle`: [Expression](guide/expression) which evaluates to an object whose keys are CSS style names and values are corresponding values for those CSS keys.

Since some CSS style names are not valid keys for an object, they must be quoted. See the 'background-color' style in the example below.
