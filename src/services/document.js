import { JQLite } from "../shared/jqlite/jqlite";

/**
 * @typedef {import('../index').angular.ServiceProvider} angular.DocumentProvider
 * @description
 * A {@link angular.element jQuery or JQLite} wrapper for the browser's `window.document` object.
 *
 * @example
   <example module="documentExample" name="document">
     <file name="index.html">
       <div ng-controller="ExampleController">
         <p>$document title: <b ng-bind="title"></b></p>
         <p>window.document title: <b ng-bind="windowTitle"></b></p>
       </div>
     </file>
     <file name="script.js">
       angular.module('documentExample', [])
         .controller('ExampleController', ['$scope', '$document', function($scope, $document) {
           $scope.title = $document[0].title;
           $scope.windowTitle = angular.element(window.document)[0].title;
         }]);
     </file>
   </example>
 */

/**
 * @constructor
 * @this {angular.DocumentProvider}
 */
export function $DocumentProvider() {
  this.$get = () => JQLite(window.document);
}

/**
 * @private
 *
 * Listens for document visibility change and makes the current status accessible.
 */
export function $$IsDocumentHiddenProvider() {
  this.$get = [
    "$document",
    "$rootScope",
    /**
     * @param {import("../shared/jqlite/jqlite").JQLite} $document
     * @param {import("../core/scope/scope").Scope} $rootScope
     * @returns
     */
    function ($document, $rootScope) {
      const doc = /** @type {typeof window.document} */ ($document[0]);
      let hidden = doc && doc.hidden;

      $document.on("visibilitychange", changeListener);

      $rootScope.$on("$destroy", () => {
        $document.off("visibilitychange", changeListener);
      });

      function changeListener() {
        hidden = doc.hidden;
      }

      return function () {
        return hidden;
      };
    },
  ];
}
