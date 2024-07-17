/**
 * @constructor
 */
export class Parser {
    /**
     *
     * @param {import('./lexer').Lexer} lexer
     * @param {*} $filter
     * @param {*} options
     */
    constructor(lexer: import("./lexer").Lexer, $filter: any, options: any);
    ast: AST;
    astCompiler: ASTInterpreter | ASTCompiler;
    parse(text: any): any;
    getAst(exp: any): {
        ast: {
            type: string;
            body: {
                type: string;
                expression: any;
            }[];
        };
        oneTime: boolean;
    };
}
import { AST } from "./ast";
import { ASTInterpreter } from "./interpreter";
import { ASTCompiler } from "./compiler";
