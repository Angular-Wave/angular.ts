/**
 * Converts parameter to  strings property name for use  as keys in an object.
 * Any non-string object, including a number, is typecasted into a string via the toString method.
 * {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Property_accessors#Property_names}
 *
 * @param {!any} name
 * @returns {string}
 */
export function getStringValue(name: any): string;
export function ifDefined(v: any, d: any): any;
export function plusFn(l: any, r: any): any;
export function isStateless($filter: any, filterName: any): boolean;
export function isPure(node: any, parentIsPure: any): any;
export function findConstantAndWatchExpressions(ast: any, $filter: any, parentIsPure: any): void;
export function getInputs(body: any): any;
export function isAssignable(ast: any): boolean;
export function assignableAST(ast: any): {
    type: string;
    left: any;
    right: {
        type: string;
    };
    operator: string;
};
export function isLiteral(ast: any): boolean;
export function isConstant(ast: any): any;
export function getValueOf(value: any): any;
export const PURITY_ABSOLUTE: 1;
export const PURITY_RELATIVE: 2;
