import { AST } from "./ast";
import { isLiteral, isConstant } from "./shared";
import { ASTInterpreter } from "./interpreter";
import { ASTCompiler } from "./compiler";

/**
 * @constructor
 */
export class Parser {
  constructor(lexer, $filter, options) {
    this.ast = new AST(lexer, options);
    this.astCompiler = options.csp
      ? new ASTInterpreter($filter)
      : new ASTCompiler($filter);
  }

  parse(text) {
    const { ast, oneTime } = this.getAst(text);
    const fn = this.astCompiler.compile(ast);
    fn.literal = isLiteral(ast);
    fn.constant = isConstant(ast);
    fn.oneTime = oneTime;
    return fn;
  }

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
