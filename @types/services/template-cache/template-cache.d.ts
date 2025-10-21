/**
 * Provides an instance of a cache that can be used to store and retrieve template content.
 */
export class TemplateCacheProvider {
  /** @type {ng.TemplateCacheService} */
  cache: ng.TemplateCacheService;
  /**
   * @returns {ng.TemplateCacheService}
   */
  $get(): ng.TemplateCacheService;
}
