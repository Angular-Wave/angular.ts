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
     * @param {function(any):boolean} [identifierStart] The function that will decide whether the given character is
     *   a valid identifier start character.
     * @param {function(any):boolean} [identifierContinue] The function that will decide whether the given character is
     *   a valid identifier continue character.
     * @returns {$ParseProvider}
     */
    setIdentifierFns: (identifierStart?: (arg0: any) => boolean, identifierContinue?: (arg0: any) => boolean) => $ParseProvider;
    $get: (string | (($filter: any) => {
        (exp: any, interceptorFn: any): any;
        $$getAst: (exp: string) => import("./ast").ASTNode;
    }))[];
}
export function constantWatchDelegate(scope: any, listener: any, objectEquality: any, parsedExpression: any): any;
/**
 * @typedef {function} CompiledExpression
 * @param {import('../scope/scope').Scope} context - An object against which any expressions embedded in the strings are evaluated against (typically a scope object).
 * @param {object} [locals] - local variables context object, useful for overriding values in `context`.
 * @returns {any}
 * @property {boolean} literal - Indicates if the expression is a literal.
 * @property {boolean} constant - Indicates if the expression is constant.
 * @property {function(any, any): any} assign - Assigns a value to a context. If value is not provided,
 * undefined is gonna be used since the implementation
 * does not check the parameter. Let's force a value for consistency. If consumer
 * wants to undefine it, pass the undefined value explicitly.
 */
/**
 * @typedef {function(string|function(import('../scope/scope').Scope):any, function(any, import('../scope/scope').Scope, any):any=, boolean=): CompiledExpression} ParseService
 */
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
export type CompiledExpression = Function;
export type ParseService = (arg0: string | ((arg0: import("../scope/scope").Scope) => any), arg1: ((arg0: any, arg1: import("../scope/scope").Scope, arg2: any) => any) | undefined, arg2: boolean | undefined) => CompiledExpression;
