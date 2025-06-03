/**
 * Represents a token produced by the lexer, which will be used by the AST to construct an abstract syntax tree.
 */
export interface Token {
    /** Index of the token. */
    index: number;
    /** Text of the token. */
    text: string;
    /** Indicates if token is an identifier. */
    identifier?: boolean;
    /** Indicates if token is a constant. */
    constant?: boolean;
    /** Value of the token if it's a constant. */
    value?: string | number;
    /** Indicates if token is an operator. */
    operator?: boolean;
}
