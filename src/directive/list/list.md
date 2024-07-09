## `ngList` Directive

### Restrict

`A`

### Priority

100

### Parameter

- `{string=} ngList`: Optional delimiter that should be used to split the value.

### Description

Text input that converts between a delimited string and an array of strings. The default delimiter is a comma followed by a space - equivalent to `ng-list=", "`. You can specify a custom delimiter as the value of the `ngList` attribute - for example, `ng-list=" | "`.

The behavior of the directive is affected by the use of the `ngTrim` attribute.

- If `ngTrim` is set to `"false"` then whitespace around both the separator and each list item is respected. This implies that the user of the directive is responsible for dealing with whitespace but also allows you to use whitespace as a delimiter, such as a tab or newline character.
- Otherwise, whitespace around the delimiter is ignored when splitting (although it is respected when joining the list items back together) and whitespace around each list item is stripped before it is added to the model.
