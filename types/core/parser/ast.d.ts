export function AST(lexer: any, options: any): void;
export class AST {
    constructor(lexer: any, options: any);
    lexer: any;
    options: any;
    ast(text: any): {
        type: string;
        body: {
            type: string;
            expression: any;
        }[];
    };
    text: any;
    tokens: any;
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
    consume(e1: any): any;
    peekToken(): any;
    peek(e1: any, e2: any, e3: any, e4: any): any;
    peekAhead(i: any, e1: any, e2: any, e3: any, e4: any): any;
    expect(e1: any, e2: any, e3: any, e4: any): any;
    selfReferential: {
        this: {
            type: string;
        };
        $locals: {
            type: string;
        };
    };
}
export type ASTType = ("Program" | "ExpressionStatement" | "AssignmentExpression" | "ConditionalExpression" | "LogicalExpression" | "BinaryExpression" | "UnaryExpression" | "CallExpression" | "MemberExpression" | "Identifier" | "Literal" | "ArrayExpression" | "Property" | "ObjectExpression" | "ThisExpression" | "LocalsExpression" | "NGValueParameter");
export namespace ASTType {
    let Program: string;
    let ExpressionStatement: string;
    let AssignmentExpression: string;
    let ConditionalExpression: string;
    let LogicalExpression: string;
    let BinaryExpression: string;
    let UnaryExpression: string;
    let CallExpression: string;
    let MemberExpression: string;
    let Identifier: string;
    let Literal: string;
    let ArrayExpression: string;
    let Property: string;
    let ObjectExpression: string;
    let ThisExpression: string;
    let LocalsExpression: string;
    let NGValueParameter: string;
}
