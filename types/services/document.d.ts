/**
 * @typedef {import('../types').ServiceProvider} DocumentProvider
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
 * @this {DocumentProvider}
 */
export function $DocumentProvider(this: import("../types").ServiceProvider): void;
export class $DocumentProvider {
    $get: () => JQLite;
}
/**
 * @private
 *
 * Listens for document visibility change and makes the current status accessible.
 */
export function $$IsDocumentHiddenProvider(): void;
export class $$IsDocumentHiddenProvider {
    $get: (string | (($document: import("../shared/jqlite/jqlite").JQLite, $rootScope: import("../core/scope/scope").Scope) => () => boolean))[];
}
export type DocumentProvider = import("../types").ServiceProvider;
import { JQLite } from "../shared/jqlite/jqlite";
