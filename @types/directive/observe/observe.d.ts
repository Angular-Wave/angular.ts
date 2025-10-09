/**
 * @param {string} source - the name of the attribute to be observed
 * @param {string} prop - the scope property to be updated with attribute value
 * @returns {import("../../interface.ts").Directive}
 */
export function ngObserveDirective(
  source: string,
  prop: string,
): import("../../interface.ts").Directive;
