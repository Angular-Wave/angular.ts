/**
 * Initializes core `ng` module.
 * @param {import('./loader.js').Angular} angular
 * @returns {import('./core/di/ng-module.js').NgModule} `ng` module
 */
export function registerNgModule(
  angular: import("./loader.js").Angular,
): import("./core/di/ng-module.js").NgModule;
