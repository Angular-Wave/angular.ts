---
title: $location
description: >
  URL normalization for HTML5/hashbang modes
---

### Description

The `$location` service parses the URL in the browser address bar (based on the
[window.location](https://developer.mozilla.org/en/window.location)) and makes
the URL available to your application in a uniform manner. Changes to the URL in
the address bar are reflected into `$location` service and changes to
`$location` are reflected into the browser address bar. Using `$location` you
can:

- Watch and observe the URL
- Change the URL
- Detect users changes to address bar by clicking on links or using back or
  forward buttons in browser

To configure the HTML5 mode and link behavior for the service, use the
`$locationProvider`.

### Events

---

#### $location#$locationChangeStart

- **Description:** Broadcast on root scope before a URL will change. This change
  can be prevented by calling `preventDefault` method of the event. See
  [Scope#$ons](TODO) for more details about event object. Upon successful change
  `$location#$locationChangeSuccess` is fired.

The `newState` and `oldState` parameters may be defined only in HTML5 mode and
when the browser supports the HTML5 History API.

- **Parameters:** | `angularEvent` | `Object` | No | Synthetic event object. | |
  `newUrl` | `string` | No | The new URL being navigated to. | | `oldUrl` |
  `string` | Yes | The URL prior to the change. | | `newState` | `string` | Yes
  | New history state object (HTML5 mode only). | | `oldState` | `string` | Yes
  | Previ

## `$location#$locationChangeSuccess`

**Description:**  
 Broadcasted on the root scope **after** a URL was changed. The `newState` and
`oldState` parameters may be defined only in HTML5 mode and when the browser
supports the HTML5 History API.

### Parameters

| `angularEvent` | `Object` | No | Synthetic event object. | | `newUrl` |
`string` | No | The new URL after change. | | `oldUrl` | `string` | Yes | The
previous URL before the change. | | `newState` | `string` | Yes | New history
state object (HTML5 mode only). | | `oldState` | `string` | Yes | Previous
history state object (HTML5 mode only). |
