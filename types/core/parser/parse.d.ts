/**
 * @ngdoc provider
 * @name $parseProvider
 *
 *
 * @description
 * `$parseProvider` can be used for configuring the default behavior of the {@link ng.$parse $parse}
 *  service.
 */
export function $ParseProvider(): void;
export class $ParseProvider {
    /**
     * @ngdoc method
     * @name $parseProvider#addLiteral
     * @description
     *
     * Configure $parse service to add literal values that will be present as literal at expressions.
     *
     * @param {string} literalName Token for the literal value. The literal name value must be a valid literal name.
     * @param {*} literalValue Value for this literal. All literal values must be primitives or `undefined`.
     *
     **/
    addLiteral: (literalName: string, literalValue: any) => void;
    /**
     * @ngdoc method
     * @name $parseProvider#setIdentifierFns
     *
     * @description
     *
     * Allows defining the set of characters that are allowed in AngularJS expressions. The function
     * `identifierStart` will get called to know if a given character is a valid character to be the
     * first character for an identifier. The function `identifierContinue` will get called to know if
     * a given character is a valid character to be a follow-up identifier character. The functions
     * `identifierStart` and `identifierContinue` will receive as arguments the single character to be
     * identifier and the character code point. These arguments will be `string` and `numeric`. Keep in
     * mind that the `string` parameter can be two characters long depending on the character
     * representation. It is expected for the function to return `true` or `false`, whether that
     * character is allowed or not.
     *
     * Since this function will be called extensively, keep the implementation of these functions fast,
     * as the performance of these functions have a direct impact on the expressions parsing speed.
     *
     * @param {function=} identifierStart The function that will decide whether the given character is
     *   a valid identifier start character.
     * @param {function=} identifierContinue The function that will decide whether the given character is
     *   a valid identifier continue character.
     */
    setIdentifierFns: (identifierStart?: Function | undefined, identifierContinue?: Function | undefined) => this;
    $get: (string | (($filter: any) => {
        (exp: any, interceptorFn: any): any;
        $$getAst: (exp: any) => {
            type: string;
            body: {
                type: string;
                expression: any;
            }[];
        };
    }))[];
}
export function inputsWatchDelegate(scope: any, listener: any, objectEquality: any, parsedExpression: any): any;
export function oneTimeWatchDelegate(scope: any, listener: any, objectEquality: any, parsedExpression: any): any;
export function chainInterceptors(first: any, second: any): {
    (value: any): any;
    $stateful: any;
    $$pure: any;
};
export function expressionInputDirtyCheck(newValue: any, oldValueOfValue: any, compareObjectIdentity: any): boolean;
export function isAllDefined(value: any): boolean;
export const $parseMinErr: (arg0: string, ...arg1: any[]) => Error;
export namespace literals {
    let _true: boolean;
    export { _true as true };
    let _false: boolean;
    export { _false as false };
    let _null: any;
    export { _null as null };
    export let undefined: any;
}
export type ParseService = (arg0: string | ((arg0: import("../scope/scope").Scope) => any), arg1: ((arg0: any, arg1: Scope, arg2: any) => any) | undefined, arg2: boolean | undefined) => import("../../types").CompiledExpression;
