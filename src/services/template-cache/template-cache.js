/**
 * Provides an instance of a cache that can be used to store and retrieve template content.
 */
export class TemplateCacheProvider {
  constructor() {
    /** @type {import('./interface.ts').TemplateCache} */
    this.cache = new Map();
  }
  /**
   * @returns {import('./interface.ts').TemplateCache}
   */
  $get = () => this.cache;
}
