/**
 * @typedef {Object} ParsedAST
 * @property {import("./ast").ASTNode} ast - AST representation of expression
 * @property {boolean} oneTime - True if expression should be evaluated only once
 */
/**
 * @typedef {Object} ParserOptions
 * @property {boolean} csp
 * @property {function(string):any} literals
 */
/**
 * @constructor
 */
export class Parser {
    /**
     *
     * @param {import('./lexer').Lexer} lexer
     * @param {*} $filter
     * @param {ParserOptions} options
     */
    constructor(lexer: import("./lexer").Lexer, $filter: any, options: ParserOptions);
    /** @type {AST} */
    ast: AST;
    /** @type {ASTInterpreter|ASTCompiler} */
    astCompiler: ASTInterpreter | ASTCompiler;
    /**
     *
     * @param {string} exp - Expression to be parsed
     * @returns
     */
    parse(exp: string): any;
    /**
     * @private
     * @param {string} exp - Expression to be parsed
     * @returns {ParsedAST}
     */
    private getAst;
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
    csp: boolean;
    literals: (arg0: string) => any;
};
import { AST } from "./ast";
import { ASTInterpreter } from "./interpreter";
import { ASTCompiler } from "./compiler";
