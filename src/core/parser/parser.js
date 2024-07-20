import { AST } from "./ast";
import { ASTType } from "./ast-type";
import { ASTInterpreter } from "./interpreter";

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
  constructor(lexer, $filter, options) {
    /** @type {AST} */
    this.ast = new AST(lexer, options);

    /** @type {ASTInterpreter} */
    this.astCompiler = new ASTInterpreter($filter);
  }

  /**
   *
   * @param {string} exp - Expression to be parsed
   * @returns
   */
  parse(exp) {
    const { ast, oneTime } = this.getAst(exp);
    const fn = this.astCompiler.compile(ast);
    fn.literal = isLiteral(ast);
    fn.constant = isConstant(ast);
    fn.oneTime = oneTime;
    return fn;
  }

  /**
   * @param {string} exp - Expression to be parsed
   * @returns {ParsedAST}
   */
  getAst(exp) {
    let oneTime = false;
    exp = exp.trim();

    if (exp.startsWith("::")) {
      oneTime = true;
      exp = exp.substring(2);
    }
    return {
      ast: this.ast.ast(exp),
      oneTime,
    };
  }
}

function isLiteral(ast) {
  return (
    ast.body.length === 0 ||
    (ast.body.length === 1 &&
      (ast.body[0].expression.type === ASTType.Literal ||
        ast.body[0].expression.type === ASTType.ArrayExpression ||
        ast.body[0].expression.type === ASTType.ObjectExpression))
  );
}

function isConstant(ast) {
  return ast.constant;
}
