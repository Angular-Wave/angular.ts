/**
 * Initializes `ng`, `animate`, `message`, `aria` and `router` modules.
 * @param {import('./loader').Angular} angular
 * @returns {import('./types').Module} `ng`module
 */
export function publishExternalAPI(angular: import("./loader").Angular): import("./types").Module;
/**
 * @type {string} `version` from `package.json`, injected by Rollup plugin
 */
export const VERSION: string;
