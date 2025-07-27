---
title: $locationProvider
description: >
  Configuration provider for `$location` service.
---

### Description

Use the `$locationProvider` to configure how the application deep linking paths
are stored.

### Properties

---

#### $locationProvider.html5ModeConf

- **Type:** Html5Mode
- **Default:** `{ enabled: true, requireBase: false, rewriteLinks: true }`
- **Example:**

  ```js
  angular.module('demo', []).config(($locationProvider) => {
    $locationProvider.html5ModeConf.enabled = false;
  });
  ```
