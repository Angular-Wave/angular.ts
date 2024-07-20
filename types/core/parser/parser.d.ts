/**
 * @typedef {Object} ParsedAST
 * @property {import("./ast").ASTNode} ast - AST representation of expression
 * @property {boolean} oneTime - True if expression should be evaluated only once
 */
/**
 * @typedef {Object} ParserOptions
 * @property {function(string):any} literals
 */
/**
 * @constructor
 */
export class Parser {
    /**
     *
     * @param {import('./lexer').Lexer} lexer
     * @param {function(any):any} $filter
     * @param {ParserOptions} options
     */
    constructor(lexer: import("./lexer").Lexer, $filter: (arg0: any) => any, options: ParserOptions);
    /** @type {AST} */
    ast: AST;
    /** @type {ASTInterpreter} */
    astCompiler: ASTInterpreter;
    /**
     *
     * @param {string} exp - Expression to be parsed
     * @returns
     */
    parse(exp: string): any;
    /**
     * @param {string} exp - Expression to be parsed
     * @returns {ParsedAST}
     */
    getAst(exp: string): ParsedAST;
}
export type ParsedAST = {
    /**
     * - AST representation of expression
     */
    ast: import("./ast").ASTNode;
    /**
     * - True if expression should be evaluated only once
     */
    oneTime: boolean;
};
export type ParserOptions = {
    literals: (arg0: string) => any;
};
import { AST } from "./ast";
import { ASTInterpreter } from "./interpreter";
