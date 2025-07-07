/**
 * @typedef {Object} ExpandoStore
 * @property {!Object<string, any>} data
 *
 */

/**
 * Expando cache for adding properties to DOM nodes with JavaScript.
 * This used to be an Object in JQLite decorator, but swapped out for a Map
 * for performance reasons and convenience methods. A proxy is available for
 * additional logic handling.
 *
 * @type {Map<number, ExpandoStore>}
 */
export const Cache = new Map();

/**
 * A cache for mapping template names to their respective content.
 *
 * @typedef {Map<string, string>} TemplateCache
 */

/**
 * Provides an instance of a template cache that can be used to store and retrieve template content.
 */
export class TemplateCacheProvider {
  /**
   * @description Returns a new instance a Map used to store templates.
   * @returns {TemplateCache} A new instance of the template cache (Map object).
   */
  $get = () => new Map();
}
