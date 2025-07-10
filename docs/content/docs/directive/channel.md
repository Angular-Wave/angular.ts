---
title: ng-channel
description: >
  Subscribe a template to a messaging service topic
---

### Description

Updates element’s content by subscribing to events published on a named channel
using `$eventBus`.

- If the element **does not** contain any child elements or templates, the
  directive will **replace the element's inner HTML** with the published value.
- If the element **does** contain a template and the published value is an
  **object**, the directive will **merge the object’s key-value pairs into the
  current scope**, allowing Angular expressions like `{{ user.firstName }}` to
  be evaluated and rendered.

The directive automatically unsubscribes from the event channel when the scope
is destroyed.

### Parameters

---

#### `ng-channel`

- **Type:** `string`
- **Description:** The name of the channel to subscribe to using `$eventBus`.

### Example

{{< showhtml src="examples/ng-channel/ng-channel.html" >}}

### Demo

{{< showraw src="examples/ng-channel/ng-channel.html" >}}

---
