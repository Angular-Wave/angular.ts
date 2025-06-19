/**
 *
 * @param {Array<String|Function>} modulesToLoad
 * @param {boolean} [strictDi]
 * @returns {InjectorService}
 */
export function createInjector(
  modulesToLoad: Array<string | Function>,
  strictDi?: boolean,
): InjectorService;
/**
 *
 * @param {any} fn
 * @param {boolean} [strictDi]
 * @param {String} [name]
 * @returns {Array<string>}
 */
export function annotate(
  fn: any,
  strictDi?: boolean,
  name?: string,
): Array<string>;
import { InjectorService } from "./internal-injector.js";
