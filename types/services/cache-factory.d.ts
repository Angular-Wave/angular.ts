/**
 * @ngdoc service
 * @name $cacheFactory
 *
 *
 * @description
 * Factory that constructs {@link $cacheFactory.Cache Cache} objects and gives access to
 * them.
 *
 * ```js
 *
 *  let cache = $cacheFactory('cacheId');
 *  expect($cacheFactory.get('cacheId')).toBe(cache);
 *  expect($cacheFactory.get('noSuchCacheId')).not.toBeDefined();
 *
 *  cache.put("key", "value");
 *  cache.put("another key", "another value");
 *
 *  // We've specified no options on creation
 *  expect(cache.info()).toEqual({id: 'cacheId', size: 2});
 *
 * ```
 *
 *
 * @example
   <example module="cacheExampleApp" name="cache-factory">
     <file name="index.html">
       <div ng-controller="CacheController">
         <input ng-model="newCacheKey" placeholder="Key">
         <input ng-model="newCacheValue" placeholder="Value">
         <button ng-click="put(newCacheKey, newCacheValue)">Cache</button>

         <p ng-if="keys.length">Cached Values</p>
         <div ng-repeat="key in keys">
           <span ng-bind="key"></span>
           <span>: </span>
           <b ng-bind="cache.get(key)"></b>
         </div>

         <p>Cache Info</p>
         <div ng-repeat="(key, value) in cache.info()">
           <span ng-bind="key"></span>
           <span>: </span>
           <b ng-bind="value"></b>
         </div>
       </div>
     </file>
     <file name="script.js">
       angular.module('cacheExampleApp', []).
         controller('CacheController', ['$scope', '$cacheFactory', function($scope, $cacheFactory) {
           $scope.keys = [];
           $scope.cache = $cacheFactory('cacheId');
           $scope.put = function(key, value) {
             if (angular.isUndefined($scope.cache.get(key))) {
               $scope.keys.push(key);
             }
             $scope.cache.put(key, angular.isUndefined(value) ? null : value);
           };
         }]);
     </file>
     <file name="style.css">
       p {
         margin: 10px 0 3px;
       }
     </file>
   </example>
 */
export function CacheFactoryProvider(): void;
export class CacheFactoryProvider {
  $get: () => {
    (cacheId: string, options?: object | undefined): object;
    /**
     * @ngdoc method
     * @name $cacheFactory#info
     *
     * @description
     * Get information about all the caches that have been created
     *
     * @returns {Object} - key-value map of `cacheId` to the result of calling `cache#info`
     */
    info(): any;
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
    get(cacheId: string): object;
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
export function TemplateCacheProvider(): void;
export class TemplateCacheProvider {
  $get: (string | (($cacheFactory: any) => any))[];
}
