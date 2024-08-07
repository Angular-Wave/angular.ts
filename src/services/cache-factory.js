import { extend, forEach, isUndefined, minErr } from "../shared/utils";

export function CacheFactoryProvider() {
  this.$get = function () {
    const caches = {};

    /**
     * @param {string} cacheId Name or id of the newly created cache.
     * @param {object=} options Options object that specifies the cache behavior. Properties:
     *
     *   - `{number=}` `capacity` — turns the cache into LRU cache.
     *
     * @returns {object} Newly created cache object with the following set of methods:
     *
     * - `{object}` `info()` — Returns id, size, and options of cache.
     * - `{{*}}` `put({string} key, {*} value)` — Puts a new key-value pair into the cache and returns
     *   it.
     * - `{{*}}` `get({string} key)` — Returns cached value for `key` or undefined for cache miss.
     * - `{void}` `remove({string} key)` — Removes a key-value pair from the cache.
     * - `{void}` `removeAll()` — Removes all cached values.
     * - `{void}` `destroy()` — Removes references to this cache from $cacheFactory.
     */
    function cacheFactory(cacheId, options) {
      if (cacheId in caches) {
        throw minErr("$cacheFactory")(
          "iid",
          "CacheId '{0}' is already taken!",
          cacheId,
        );
      }

      let size = 0;
      let stats = extend({}, options, { id: cacheId });
      let data = Object.create(null);
      const capacity = (options && options.capacity) || Number.MAX_VALUE;
      let lruHash = Object.create(null);
      let freshEnd = null;
      let staleEnd = null;

      /**
       * @ngdoc type
       * @name $cacheFactory.Cache
       *
       * @description
       * A cache object used to store and retrieve data, primarily used by
       * {@link $templateRequest $templateRequest} and the {@link ng.directive:script script}
       * directive to cache templates and other data.
       *
       * ```js
       *  angular.module('superCache')
       *    .factory('superCache', ['$cacheFactory', function($cacheFactory) {
       *      return $cacheFactory('super-cache');
       *    }]);
       * ```
       *
       * Example test:
       *
       * ```js
       *  it('should behave like a cache', inject(function(superCache) {
       *    superCache.put('key', 'value');
       *    superCache.put('another key', 'another value');
       *
       *    expect(superCache.info()).toEqual({
       *      id: 'super-cache',
       *      size: 2
       *    });
       *
       *    superCache.remove('another key');
       *    expect(superCache.get('another key')).toBeUndefined();
       *
       *    superCache.removeAll();
       *    expect(superCache.info()).toEqual({
       *      id: 'super-cache',
       *      size: 0
       *    });
       *  }));
       * ```
       */
      return (caches[cacheId] = {
        /**
         * @ngdoc method
         * @name $cacheFactory.Cache#put
         * @kind function
         *
         * @description
         * Inserts a named entry into the {@link $cacheFactory.Cache Cache} object to be
         * retrieved later, and incrementing the size of the cache if the key was not already
         * present in the cache. If behaving like an LRU cache, it will also remove stale
         * entries from the set.
         *
         * It will not insert undefined values into the cache.
         *
         * @param {string} key the key under which the cached data is stored.
         * @param {*} value the value to store alongside the key. If it is undefined, the key
         *    will not be stored.
         * @returns {*} the value stored.
         */
        put(key, value) {
          if (isUndefined(value)) return;
          if (capacity < Number.MAX_VALUE) {
            const lruEntry = lruHash[key] || (lruHash[key] = { key });

            refresh(lruEntry);
          }

          if (!(key in data)) size++;
          data[key] = value;

          if (size > capacity) {
            this.remove(staleEnd.key);
          }

          return value;
        },

        /**
         * @ngdoc method
         * @name $cacheFactory.Cache#get
         * @kind function
         *
         * @description
         * Retrieves named data stored in the {@link $cacheFactory.Cache Cache} object.
         *
         * @param {string} key the key of the data to be retrieved
         * @returns {*} the value stored.
         */
        get(key) {
          if (capacity < Number.MAX_VALUE) {
            const lruEntry = lruHash[key];

            if (!lruEntry) return;

            refresh(lruEntry);
          }

          return data[key];
        },

        /**
         * @ngdoc method
         * @name $cacheFactory.Cache#remove
         * @kind function
         *
         * @description
         * Removes an entry from the {@link $cacheFactory.Cache Cache} object.
         *
         * @param {string} key the key of the entry to be removed
         */
        remove(key) {
          if (capacity < Number.MAX_VALUE) {
            const lruEntry = lruHash[key];

            if (!lruEntry) return;

            if (lruEntry === freshEnd) freshEnd = lruEntry.p;
            if (lruEntry === staleEnd) staleEnd = lruEntry.n;
            link(lruEntry.n, lruEntry.p);

            delete lruHash[key];
          }

          if (!(key in data)) return;

          delete data[key];
          size--;
        },

        /**
         * @ngdoc method
         * @name $cacheFactory.Cache#removeAll
         * @kind function
         *
         * @description
         * Clears the cache object of any entries.
         */
        removeAll() {
          data = Object.create(null);
          size = 0;
          lruHash = Object.create(null);
          freshEnd = staleEnd = null;
        },

        /**
         * @ngdoc method
         * @name $cacheFactory.Cache#destroy
         * @kind function
         *
         * @description
         * Destroys the {@link $cacheFactory.Cache Cache} object entirely,
         * removing it from the {@link $cacheFactory $cacheFactory} set.
         */
        destroy() {
          data = null;
          stats = null;
          lruHash = null;
          delete caches[cacheId];
        },

        /**
         * @ngdoc method
         * @name $cacheFactory.Cache#info
         * @kind function
         *
         * @description
         * Retrieve information regarding a particular {@link $cacheFactory.Cache Cache}.
         *
         * @returns {object} an object with the following properties:
         *   <ul>
         *     <li>**id**: the id of the cache instance</li>
         *     <li>**size**: the number of entries kept in the cache instance</li>
         *     <li>**...**: any additional properties from the options object when creating the
         *       cache.</li>
         *   </ul>
         */
        info() {
          return extend({}, stats, { size });
        },
      });

      /**
       * makes the `entry` the freshEnd of the LRU linked list
       */
      function refresh(entry) {
        if (entry !== freshEnd) {
          if (!staleEnd) {
            staleEnd = entry;
          } else if (staleEnd === entry) {
            staleEnd = entry.n;
          }

          link(entry.n, entry.p);
          link(entry, freshEnd);
          freshEnd = entry;
          freshEnd.n = null;
        }
      }

      /**
       * bidirectionally links two entries of the LRU linked list
       */
      function link(nextEntry, prevEntry) {
        if (nextEntry !== prevEntry) {
          if (nextEntry) nextEntry.p = prevEntry; // p stands for previous, 'prev' didn't minify
          if (prevEntry) prevEntry.n = nextEntry; // n stands for next, 'next' didn't minify
        }
      }
    }

    /**
     * @ngdoc method
     * @name $cacheFactory#info
     *
     * @description
     * Get information about all the caches that have been created
     *
     * @returns {Object} - key-value map of `cacheId` to the result of calling `cache#info`
     */
    cacheFactory.info = function () {
      const info = {};
      forEach(caches, (cache, cacheId) => {
        info[cacheId] = cache.info();
      });
      return info;
    };

    /**
     * @ngdoc method
     * @name $cacheFactory#get
     *
     * @description
     * Get access to a cache object by the `cacheId` used when it was created.
     *
     * @param {string} cacheId Name or id of a cache to access.
     * @returns {object} Cache object identified by the cacheId or undefined if no such cache.
     */
    cacheFactory.get = function (cacheId) {
      return caches[cacheId];
    };

    return cacheFactory;
  };
}

/**
 * @name $templateCache
 *
 * @description
 * `$templateCache` is a {@link $cacheFactory.Cache Cache object} created by the
 * {@link ng.$cacheFactory $cacheFactory}.
 *
 * The first time a template is used, it is loaded in the template cache for quick retrieval. You
 * can load templates directly into the cache in a `script` tag, by using {@link $templateRequest},
 * or by consuming the `$templateCache` service directly.
 *
 * Adding via the `script` tag:
 *
 * ```html
 *   <script type="text/ng-template" id="templateId.html">
 *     <p>This is the content of the template</p>
 *   </script>
 * ```
 *
 * **Note:** the `script` tag containing the template does not need to be included in the `head` of
 * the document, but it must be a descendent of the {@link ng.$rootElement $rootElement} (e.g.
 * element with {@link ngApp} attribute), otherwise the template will be ignored.
 *
 * Adding via the `$templateCache` service:
 *
 * ```js
 * let myApp = angular.module('myApp', []);
 * myApp.run(function($templateCache) {
 *   $templateCache.put('templateId.html', 'This is the content of the template');
 * });
 * ```
 *
 * To retrieve the template later, simply use it in your component:
 * ```js
 * myApp.component('myComponent', {
 *    templateUrl: 'templateId.html'
 * });
 * ```
 *
 * or get it via the `$templateCache` service:
 * ```js
 * $templateCache.get('templateId.html')
 * ```
 *
 */
export function TemplateCacheProvider() {
  this.$get = ["$cacheFactory", ($cacheFactory) => $cacheFactory("templates")];
}
