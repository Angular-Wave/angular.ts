/**
 * A cache interface for mapping template urls to their XHR responses.
 */
export interface TemplateCache {
  get(key: string): any | undefined;
  set(key: string, value: any): this;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
}
