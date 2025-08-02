/**
 * Initializes core `ng` module.
 * @param {import('./angular.js').Angular} angular
 * @returns {import('./core/di/ng-module.js').NgModule} `ng` module
 */
export function registerNgModule(
  angular: import("./angular.js").Angular,
): import("./core/di/ng-module.js").NgModule;
