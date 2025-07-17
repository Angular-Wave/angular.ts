---
title: $templateCacheProvider
description: >
  Cache provider for `$templateCache` service.
---

### Description

Initializes cache instance for `$templateCache` service as an empty
[Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
object.

An alternative caching implementation can be provided by implementing
[TemplateCache](../../../typedoc/types/TemplateCache.html) interface for web
standard storage options like `localStorage`, `sessionStorage`, `IndexedDB`, or
`Cache API`. You can also use third-party storage engines like
[pouch](https://github.com/pouchdb/pouchdb) or
[SQLite](https://sqlite.org/wasm/doc/trunk/index.md). With WebAssembly (WASM),
even more powerful and flexible storage backends become possible.

Below is an example implementation using `localStorage`:

```js
class LocalStorageMap {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  _key(key) {
    return `${this.prefix}${key}`;
  }

  get(key) {
    const raw = localStorage.getItem(this._key(key));
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  set(key, value) {
    localStorage.setItem(this._key(key), value);
    return this;
  }

  has(key) {
    return localStorage.getItem(this._key(key)) !== null;
  }

  delete(key) {
    localStorage.removeItem(this._key(key));
    return true;
  }

  clear() {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  }
}
```

Override during configuration phase:

```js
angular.module('demo', []).config(($templateCacheProvider) => {
  templateCacheProvider.cache = new LocalStorageMap();
});
```

### Properties

---

#### $templateCacheProvider.cache

Customize cache instance.

- **Type:** [TemplateCache](../../../typedoc/types/TemplateCache.html)
- **Default:** `Map`

- **Example:**

  ```js
  angular.module('demo', []).config(($templateCacheProvider) => {
    templateCacheProvider.cache.set('test.html', 'hello');
  });
  ```

---

For service description, see
[$templateCache](../../../docs/service/templatecache).
