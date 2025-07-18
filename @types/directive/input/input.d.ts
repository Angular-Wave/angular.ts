export function weekParser(isoWeek: any, existingDate: any): any;
export function createDateParser(
  regexp: any,
  mapping: any,
): (iso: any, previousDate: any) => any;
export function createDateInputType(
  type: any,
  regexp: any,
  parseDate: any,
): (
  scope: any,
  element: any,
  attr: any,
  ctrl: any,
  $filter: any,
  $parse: any,
) => void;
export function badInputChecker(
  scope: any,
  element: any,
  attr: any,
  ctrl: any,
  parserName: any,
): void;
export function numberFormatterParser(ctrl: any): void;
export function isNumberInteger(num: any): boolean;
export function countDecimals(num: any): number;
export function isValidForStep(
  viewValue: any,
  stepBase: any,
  step: any,
): boolean;
export function numberInputType(
  scope: any,
  element: any,
  attr: any,
  ctrl: any,
  $filter: any,
  $parse: any,
): void;
export function rangeInputType(
  scope: any,
  element: any,
  attr: any,
  ctrl: any,
): void;
/**
 * @param {*} $filter
 * @param {*} $parse
 * @returns {import('../../interface.ts').Directive}
 */
export function inputDirective(
  $filter: any,
  $parse: any,
): import("../../interface.ts").Directive;
export namespace inputDirective {
  let $inject: string[];
}
/**
 * @returns {import('../../interface.ts').Directive}
 */
export function hiddenInputBrowserCacheDirective(): import("../../interface.ts").Directive;
/**
 * @returns {import('../../interface.ts').Directive}
 */
export function ngValueDirective(): import("../../interface.ts").Directive;
export const ISO_DATE_REGEXP: RegExp;
export const URL_REGEXP: RegExp;
export const EMAIL_REGEXP: RegExp;
export const VALIDITY_STATE_PROPERTY: "validity";
