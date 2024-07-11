/**
 * Format a number into a string
 * @param  {number} number       The number to format
 * @param  {{
 *           minFrac, // the minimum number of digits required in the fraction part of the number
 *           maxFrac, // the maximum number of digits required in the fraction part of the number
 *           gSize,   // number of digits in each group of separated digits
 *           lgSize,  // number of digits in the last group of digits before the decimal separator
 *           negPre,  // the string to go in front of a negative number (e.g. `-` or `(`))
 *           posPre,  // the string to go in front of a positive number
 *           negSuf,  // the string to go after a negative number (e.g. `)`)
 *           posSuf   // the string to go after a positive number
 *         }} pattern
 * @param  {string} groupSep     The string to separate groups of number (e.g. `,`)
 * @param  {string} decimalSep   The string to act as the decimal separator (e.g. `.`)
 * @param  {[type]} fractionSize The size of the fractional part of the number
 * @return {string}              The number formatted as a string
 */
export function formatNumber(number: number, pattern: {
    minFrac: any;
    maxFrac: any;
    gSize: any;
    lgSize: any;
    negPre: any;
    posPre: any;
    negSuf: any;
    posSuf: any;
}, groupSep: string, decimalSep: string, fractionSize: [type]): string;
/**
 * @returns {angular.IFilterJson}
 */
export function jsonFilter(): angular.IFilterJson;
