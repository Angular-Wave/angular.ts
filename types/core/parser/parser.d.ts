/**
 * @typedef {Object} ParsedAST
 * @property {import("./ast").ASTNode} ast - AST representation of expression
 * @property {boolean} oneTime - True if expression should be evaluated only once
 */
/**
 * @constructor
 */
export class Parser {
    /**
     *
     * @param {import('./lexer').Lexer} lexer
     * @param {function(any):any} $filter
     */
    constructor(lexer: import("./lexer").Lexer, $filter: (arg0: any) => any);
    /** @type {AST} */
    ast: AST;
    /** @type {ASTInterpreter} */
    astCompiler: ASTInterpreter;
    /**
     *
     * @param {string} exp - Expression to be parsed
     * @returns
     */
    parse(exp: string): import("./parse").CompiledExpression;
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
import { AST } from "./ast";
import { ASTInterpreter } from "./interpreter";
