/**
 * An internal class which implements [[ParamTypeDefinition]].
 *
 * A [[ParamTypeDefinition]] is a plain javascript object used to register custom parameter types.
 * When a param type definition is registered, an instance of this class is created internally.
 *
 * This class has naive implementations for all the [[ParamTypeDefinition]] methods.
 *
 * Used by [[UrlMatcher]] when matching or formatting URLs, or comparing and validating parameter values.
 *
 * #### Example:
 * ```js
 * var paramTypeDef = {
 *   decode: function(val) { return parseInt(val, 10); },
 *   encode: function(val) { return val && val.toString(); },
 *   equals: function(a, b) { return this.is(a) && a === b; },
 *   is: function(val) { return angular.isNumber(val) && isFinite(val) && val % 1 === 0; },
 *   pattern: /\d+/
 * }
 *
 * var paramType = new ParamType(paramTypeDef);
 * ```
 */
export class ParamType {
    /**
     * @param def  A configuration object which contains the custom type definition.  The object's
     *        properties will override the default methods and/or pattern in `ParamType`'s public interface.
     * @returns a new ParamType object
     */
    constructor(def: any);
    /** @inheritdoc */
    pattern: RegExp;
    /** @inheritdoc */
    inherit: boolean;
    name: any;
    /** @inheritdoc */
    is(_val: any): boolean;
    /** @inheritdoc */
    encode(val: any): any;
    /** @inheritdoc */
    decode(val: any): any;
    /** @inheritdoc */
    equals(a: any, b: any): boolean;
    $subPattern(): string;
    toString(): string;
    /** Given an encoded string, or a decoded object, returns a decoded object */
    $normalize(val: any): any;
    /**
     * Wraps an existing custom ParamType as an array of ParamType, depending on 'mode'.
     * e.g.:
     * - urlmatcher pattern "/path?{queryParam[]:int}"
     * - url: "/path?queryParam=1&queryParam=2
     * - $stateParams.queryParam will be [1, 2]
     * if `mode` is "auto", then
     * - url: "/path?queryParam=1 will create $stateParams.queryParam: 1
     * - url: "/path?queryParam=1&queryParam=2 will create $stateParams.queryParam: [1, 2]
     */
    $asArray(mode: any, isSearch: any): ArrayType;
}
/** Wraps up a `ParamType` object to handle array values. */
declare function ArrayType(type: any, mode: any): void;
declare class ArrayType {
    /** Wraps up a `ParamType` object to handle array values. */
    constructor(type: any, mode: any);
}
export {};
