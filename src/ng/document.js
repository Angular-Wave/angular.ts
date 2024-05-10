import { jqLite } from "../jqLite";

/**
 * @ngdoc service
 * @name $document
 * 
 *
 * @description
 * A {@link angular.element jQuery or jqLite} wrapper for the browser's `window.document` object.
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
export function $DocumentProvider() {
  this.$get = [
    function () {
      return jqLite(window.document);
    },
  ];
}

/**
 * @private
 *
s * Listens for document visibility change and makes the current status accessible.
 */
export function $$IsDocumentHiddenProvider() {
  this.$get = [
    "$document",
    "$rootScope",
    function ($document, $rootScope) {
      const doc = $document[0];
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
