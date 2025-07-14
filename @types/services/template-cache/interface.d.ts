export interface MapLike<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): this;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
}
/**
 * A cache for mapping template names to their respective content.
 */
export type TemplateCache = MapLike<string, string>;
