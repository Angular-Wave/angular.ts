---
title: $templateCacheProvider
description: >
  Cache provider for `$templateCache` service.
---

### Description

Initializes cache instancce for `$templateCache` service as an empty [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) object.

### Properties

------

#### $templateCacheProvider.cache

Customize cache instance.

- **Type:** [TemplateCache](../../../typedoc/type/TemplateCache.html)  
- **Default:** `Map`

- **Example:**

    ```js
    angular.module('demo', [])
      .config(($templateCacheProvider) => {
        templateCacheProvider.cache.set('test.html', 'hello');
      });
    ```

------

For service description, see [$templateCache](../../../docs/service/templateCache).