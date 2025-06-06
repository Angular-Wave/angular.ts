## data-change attribute

### Description

Evaluate the given expression when the user changes the input. The expression is evaluated immediately, unlike the JavaScript `onchange` event which only triggers at the end of a change (usually, when the user leaves the form element or presses the return key).

The `data-change ` expression is only evaluated when a change in the input value causes a new value to be committed to the model.

### Conditions where `data-change` is Not Evaluated

- If the value returned from the `$parsers` transformation pipeline has not changed.
- If the input has continued to be invalid since the model will stay `null`.
- If the model is changed programmatically and not by a change to the input value.

### Requirements

Note, this data attribute modifoed `ngModel` directive.

### Element

`ANY`

### Parameters

- `data-chage` (`string`): [Expression](guide/expression) to evaluate upon change in input value.
