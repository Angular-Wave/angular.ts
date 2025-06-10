/**
 * A cache for maping template names to their respective content.
 *
 * @typedef {Map<string, string>} TemplateCache
 */
/**
 * Service responsible for providing a cache for templates.
 *
 * @class TemplateCacheProvider
 * @description Provides an instance of a template cache that can be used to store and retrieve template content.
 */
export class TemplateCacheProvider {
  /**
   * @description Returns a new instance of a `TemplateCache`, which is a Map used to store templates.
   * @returns {TemplateCache} A new instance of the template cache (Map object).
   */
  $get: () => TemplateCache;
}
/**
 * A cache for maping template names to their respective content.
 */
export type TemplateCache = Map<string, string>;
