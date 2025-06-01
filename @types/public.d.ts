/**
 * Initializes `ng`, `animate`, `message`, `aria` and `router` modules.
 * @param {import('./loader').Angular} angular
 * @returns {import('./types.js').Module} `ng`module
 */
export function publishExternalAPI(angular: any): import("./types.js").Module;
/**
 * @type {string} `version` from `package.json`, injected by Rollup plugin
 */
export const VERSION: string;
