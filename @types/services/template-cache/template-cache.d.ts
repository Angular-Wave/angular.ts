/**
 * Provides an instance of a cache that can be used to store and retrieve template content.
 */
export class TemplateCacheProvider {
  /** @type {import('./interface.ts').TemplateCache} */
  cache: import("./interface.ts").TemplateCache;
  /**
   * @returns {import('./interface.ts').TemplateCache}
   */
  $get: () => import("./interface.ts").TemplateCache;
}
