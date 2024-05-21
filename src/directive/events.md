## ngClick

**Directive:** `ngClick`  
**Restrict:** `A`  
**Element:** `ANY`  
**Priority:** `0`

**Description:**  
The ngClick directive allows you to specify custom behavior when an element is clicked.

**Param:**

- `{String} ngClick` [Expression](guide/expression) to evaluate upon click. ([Event object](guide/expression#-event-) is available as `$event`).

## ngDblclick

**Directive:** `ngDblclick`  
**Restrict:** `A`  
**Element:** `ANY`  
**Priority:** `0`

**Description:**  
The `ngDblclick` directive allows you to specify custom behavior on a dblclick event.

**Param:**

- `{string} ngDblclick` [Expression](guide/expression) to evaluate upon a dblclick. (The Event object is available as `$event`).

**Example:**

```html
<example name="ng-dblclick">
  <file name="index.html">
    <button ng-dblclick="count = count + 1" ng-init="count=0">
      Increment (on double click)
    </button>
    count: {{count}}
  </file>
</example>
```

## ngSubmit

**Directive:** `ngSubmit`  
**Restrict:** `A`  
**Element:** `form`  
**Priority:** `0`

**Description:**  
Enables binding AngularJS expressions to onsubmit events.

Additionally, it prevents the default action (which for forms means sending the request to the server and reloading the current page), but only if the form does not contain `action`, `data-action`, or `x-action` attributes.

<div class="alert alert-warning">
**Warning:** Be careful not to cause "double-submission" by using both the `ngClick` and `ngSubmit` handlers together. See the [form directive documentation](form#submitting-a-form-and-preventing-the-default-action) for a detailed discussion of when `ngSubmit` may be triggered.
</div>

**Param:**

- `{string} ngSubmit` [Expression](guide/expression) to evaluate. ([Event object](guide/expression#-event-) is available as `$event`).

## ngFocus

**Directive:** `ngFocus`  
**Restrict:** `A`  
**Element:** `window`, `input`, `select`, `textarea`, `a`  
**Priority:** `0`

**Description:**  
Specify custom behavior on focus event.

Note: As the `focus` event is executed synchronously when calling `input.focus()`, AngularJS executes the expression using `scope.$evalAsync` if the event is fired during an `$apply` to ensure a consistent state.

**Param:**

- `{string} ngFocus` [Expression](guide/expression) to evaluate upon focus. ([Event object](guide/expression#-event-) is available as `$event`).

**Example:**  
See [ngClick](ng.directive:ngClick).

## ngCopy

**Directive:** `ngCopy`  
**Restrict:** `A`  
**Element:** `window`, `input`, `select`, `textarea`, `a`  
**Priority:** `0`

**Description:**  
Specify custom behavior on copy event.

**Param:**

- `{string} ngCopy` [Expression](guide/expression) to evaluate upon copy. ([Event object](guide/expression#-event-) is available as `$event`).

**Example:**

```html
<example name="ng-copy">
  <file name="index.html">
    <input
      ng-copy="copied=true"
      ng-init="copied=false; value='copy me'"
      ng-model="value"
    />
    copied: {{copied}}
  </file>
</example>
```

## ngCut

**Directive:** `ngCut`  
**Restrict:** `A`  
**Element:** `window`, `input`, `select`, `textarea`, `a`  
**Priority:** `0`

**Description:**  
Specify custom behavior on cut event.

**Param:**

- `{string} ngCut` [Expression](guide/expression) to evaluate upon cut. ([Event object](guide/expression#-event-) is available as `$event`).

**Example:**

```html
<example name="ng-cut">
  <file name="index.html">
    <input
      ng-cut="cut=true"
      ng-init="cut=false; value='cut me'"
      ng-model="value"
    />
    cut: {{cut}}
  </file>
</example>
```

## ngPaste

**Directive:** `ngPaste`  
**Restrict:** `A`  
**Element:** `window`, `input`, `select`, `textarea`, `a`  
**Priority:** `0`

**Description:**  
Specify custom behavior on paste event.

**Param:**

- `{string} ngPaste` [Expression](guide/expression) to evaluate upon paste. ([Event object](guide/expression#-event-) is available as `$event`).

**Example:**

```html
<example name="ng-paste">
  <file name="index.html">
    <input
      ng-paste="paste=true"
      ng-init="paste=false"
      placeholder="paste here"
    />
    pasted: {{paste}}
  </file>
</example>
```
