/**
 * @constructor
 */
export class Parser {
    constructor(lexer: any, $filter: any, options: any);
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
