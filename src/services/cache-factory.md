/\*\*

- @ngdoc service
- @name $cacheFactory
-
-
- @description
- Factory that constructs {@link $cacheFactory.Cache Cache} objects and gives access to
- them.
-
- ```js

  ```
-
- let cache = $cacheFactory('cacheId');
- expect($cacheFactory.get('cacheId')).toBe(cache);
- expect($cacheFactory.get('noSuchCacheId')).not.toBeDefined();
-
- cache.put("key", "value");
- cache.put("another key", "another value");
-
- // We've specified no options on creation
- expect(cache.info()).toEqual({id: 'cacheId', size: 2});
-
- ```

  ```
-
-
- @example
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
