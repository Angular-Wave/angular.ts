/**
 * @param {import('./lexer').Lexer} lexer
 * @param {*} options
 */
export function AST(lexer: import("./lexer").Lexer, options: any): void;
export class AST {
    /**
     * @param {import('./lexer').Lexer} lexer
     * @param {*} options
     */
    constructor(lexer: import("./lexer").Lexer, options: any);
    lexer: import("./lexer").Lexer;
    options: any;
    ast(text: any): {
        type: string;
        body: {
            type: string;
            expression: any;
        }[];
    };
    text: any;
    tokens: import("./lexer").Token[];
    program(): {
        type: string;
        body: {
            type: string;
            expression: any;
        }[];
    };
    expressionStatement(): {
        type: string;
        expression: any;
    };
    filterChain(): any;
    expression(): any;
    assignment(): any;
    ternary(): any;
    logicalOR(): any;
    logicalAND(): any;
    equality(): any;
    relational(): any;
    additive(): any;
    multiplicative(): any;
    unary(): any;
    primary(): any;
    filter(baseExpression: any): {
        type: string;
        callee: {
            type: string;
            name: any;
        };
        arguments: any[];
        filter: boolean;
    };
    parseArguments(): any;
    identifier(): {
        type: string;
        name: any;
    };
    constant(): {
        type: string;
        value: any;
    };
    arrayDeclaration(): any;
    object(): {
        type: string;
        properties: {
            type: string;
            kind: string;
        }[];
    };
    throwError(msg: any, token: any): never;
    consume(e1: any): false | import("./lexer").Token;
    peekToken(): import("./lexer").Token;
    peek(e1: any, e2: any, e3: any, e4: any): false | import("./lexer").Token;
    peekAhead(i: any, e1: any, e2: any, e3: any, e4: any): false | import("./lexer").Token;
    expect(e1: any, e2: any, e3: any, e4: any): false | import("./lexer").Token;
    selfReferential: {
        this: {
            type: string;
        };
        $locals: {
            type: string;
        };
    };
}
