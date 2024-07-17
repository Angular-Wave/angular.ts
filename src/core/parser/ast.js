import { $parseMinErr } from "./parse";
import { isAssignable } from "./shared";

/**
 * @typedef {("Program"|"ExpressionStatement"|"AssignmentExpression"|"ConditionalExpression"|"LogicalExpression"|"BinaryExpression"|"UnaryExpression"|"CallExpression"|"MemberExpression"|"Identifier"|"Literal"|"ArrayExpression"|"Property"|"ObjectExpression"|"ThisExpression"|"LocalsExpression"|"NGValueParameter")} ASTType
 */
export const ASTType = {
  Program: "Program",
  ExpressionStatement: "ExpressionStatement",
  AssignmentExpression: "AssignmentExpression",
  ConditionalExpression: "ConditionalExpression",
  LogicalExpression: "LogicalExpression",
  BinaryExpression: "BinaryExpression",
  UnaryExpression: "UnaryExpression",
  CallExpression: "CallExpression",
  MemberExpression: "MemberExpression",
  Identifier: "Identifier",
  Literal: "Literal",
  ArrayExpression: "ArrayExpression",
  Property: "Property",
  ObjectExpression: "ObjectExpression",
  ThisExpression: "ThisExpression",
  LocalsExpression: "LocalsExpression",
  NGValueParameter: "NGValueParameter",
};

export function AST(lexer, options) {
  this.lexer = lexer;
  this.options = options;
}

AST.prototype = {
  ast(text) {
    this.text = text;
    this.tokens = this.lexer.lex(text);

    const value = this.program();

    if (this.tokens.length !== 0) {
      this.throwError("is an unexpected token", this.tokens[0]);
    }

    return value;
  },

  program() {
    const body = [];
    let hasMore = true;
    while (hasMore) {
      if (this.tokens.length > 0 && !this.peek("}", ")", ";", "]"))
        body.push(this.expressionStatement());
      if (!this.expect(";")) {
        hasMore = false;
      }
    }
    return { type: ASTType.Program, body };
  },

  expressionStatement() {
    return {
      type: ASTType.ExpressionStatement,
      expression: this.filterChain(),
    };
  },

  filterChain() {
    let left = this.expression();
    while (this.expect("|")) {
      left = this.filter(left);
    }
    return left;
  },

  expression() {
    return this.assignment();
  },

  assignment() {
    let result = this.ternary();
    if (this.expect("=")) {
      if (!isAssignable(result)) {
        throw $parseMinErr("lval", "Trying to assign a value to a non l-value");
      }

      result = {
        type: ASTType.AssignmentExpression,
        left: result,
        right: this.assignment(),
        operator: "=",
      };
    }
    return result;
  },

  ternary() {
    const test = this.logicalOR();
    let alternate;
    let consequent;
    if (this.expect("?")) {
      alternate = this.expression();
      if (this.consume(":")) {
        consequent = this.expression();
        return {
          type: ASTType.ConditionalExpression,
          test,
          alternate,
          consequent,
        };
      }
    }
    return test;
  },

  logicalOR() {
    let left = this.logicalAND();
    while (this.expect("||")) {
      left = {
        type: ASTType.LogicalExpression,
        operator: "||",
        left,
        right: this.logicalAND(),
      };
    }
    return left;
  },

  logicalAND() {
    let left = this.equality();
    while (this.expect("&&")) {
      left = {
        type: ASTType.LogicalExpression,
        operator: "&&",
        left,
        right: this.equality(),
      };
    }
    return left;
  },

  equality() {
    let left = this.relational();
    let token;
    while ((token = this.expect("==", "!=", "===", "!=="))) {
      left = {
        type: ASTType.BinaryExpression,
        operator: token.text,
        left,
        right: this.relational(),
      };
    }
    return left;
  },

  relational() {
    let left = this.additive();
    let token;
    while ((token = this.expect("<", ">", "<=", ">="))) {
      left = {
        type: ASTType.BinaryExpression,
        operator: token.text,
        left,
        right: this.additive(),
      };
    }
    return left;
  },

  additive() {
    let left = this.multiplicative();
    let token;
    while ((token = this.expect("+", "-"))) {
      left = {
        type: ASTType.BinaryExpression,
        operator: token.text,
        left,
        right: this.multiplicative(),
      };
    }
    return left;
  },

  multiplicative() {
    let left = this.unary();
    let token;
    while ((token = this.expect("*", "/", "%"))) {
      left = {
        type: ASTType.BinaryExpression,
        operator: token.text,
        left,
        right: this.unary(),
      };
    }
    return left;
  },

  unary() {
    let token;
    if ((token = this.expect("+", "-", "!"))) {
      return {
        type: ASTType.UnaryExpression,
        operator: token.text,
        prefix: true,
        argument: this.unary(),
      };
    }
    return this.primary();
  },

  primary() {
    let primary;
    if (this.expect("(")) {
      primary = this.filterChain();
      this.consume(")");
    } else if (this.expect("[")) {
      primary = this.arrayDeclaration();
    } else if (this.expect("{")) {
      primary = this.object();
    } else if (
      Object.prototype.hasOwnProperty.call(
        this.selfReferential,
        this.peek().text,
      )
    ) {
      primary = structuredClone(this.selfReferential[this.consume().text]);
    } else if (
      Object.prototype.hasOwnProperty.call(
        this.options.literals,
        this.peek().text,
      )
    ) {
      primary = {
        type: ASTType.Literal,
        value: this.options.literals[this.consume().text],
      };
    } else if (this.peek().identifier) {
      primary = this.identifier();
    } else if (this.peek().constant) {
      primary = this.constant();
    } else {
      this.throwError("not a primary expression", this.peek());
    }

    let next;
    while ((next = this.expect("(", "[", "."))) {
      if (next.text === "(") {
        primary = {
          type: ASTType.CallExpression,
          callee: primary,
          arguments: this.parseArguments(),
        };
        this.consume(")");
      } else if (next.text === "[") {
        primary = {
          type: ASTType.MemberExpression,
          object: primary,
          property: this.expression(),
          computed: true,
        };
        this.consume("]");
      } else if (next.text === ".") {
        primary = {
          type: ASTType.MemberExpression,
          object: primary,
          property: this.identifier(),
          computed: false,
        };
      } else {
        this.throwError("IMPOSSIBLE");
      }
    }
    return primary;
  },

  filter(baseExpression) {
    const args = [baseExpression];
    const result = {
      type: ASTType.CallExpression,
      callee: this.identifier(),
      arguments: args,
      filter: true,
    };

    while (this.expect(":")) {
      args.push(this.expression());
    }

    return result;
  },

  parseArguments() {
    const args = [];
    if (this.peekToken().text !== ")") {
      do {
        args.push(this.filterChain());
      } while (this.expect(","));
    }
    return args;
  },

  identifier() {
    const token = this.consume();
    if (!token.identifier) {
      this.throwError("is not a valid identifier", token);
    }
    return { type: ASTType.Identifier, name: token.text };
  },

  constant() {
    // TODO check that it is a constant
    return { type: ASTType.Literal, value: this.consume().value };
  },

  arrayDeclaration() {
    const elements = [];
    if (this.peekToken().text !== "]") {
      do {
        if (this.peek("]")) {
          // Support trailing commas per ES5.1.
          break;
        }
        elements.push(this.expression());
      } while (this.expect(","));
    }
    this.consume("]");

    return { type: ASTType.ArrayExpression, elements };
  },

  object() {
    const properties = [];
    let property;
    if (this.peekToken().text !== "}") {
      do {
        if (this.peek("}")) {
          // Support trailing commas per ES5.1.
          break;
        }
        property = { type: ASTType.Property, kind: "init" };
        if (this.peek().constant) {
          property.key = this.constant();
          property.computed = false;
          this.consume(":");
          property.value = this.expression();
        } else if (this.peek().identifier) {
          property.key = this.identifier();
          property.computed = false;
          if (this.peek(":")) {
            this.consume(":");
            property.value = this.expression();
          } else {
            property.value = property.key;
          }
        } else if (this.peek("[")) {
          this.consume("[");
          property.key = this.expression();
          this.consume("]");
          property.computed = true;
          this.consume(":");
          property.value = this.expression();
        } else {
          this.throwError("invalid key", this.peek());
        }
        properties.push(property);
      } while (this.expect(","));
    }
    this.consume("}");

    return { type: ASTType.ObjectExpression, properties };
  },

  throwError(msg, token) {
    throw $parseMinErr(
      "syntax",
      "Syntax Error: Token '{0}' {1} at column {2} of the expression [{3}] starting at [{4}].",
      token.text,
      msg,
      token.index + 1,
      this.text,
      this.text.substring(token.index),
    );
  },

  consume(e1) {
    if (this.tokens.length === 0) {
      throw $parseMinErr(
        "ueoe",
        "Unexpected end of expression: {0}",
        this.text,
      );
    }

    const token = this.expect(e1);
    if (!token) {
      this.throwError(`is unexpected, expecting [${e1}]`, this.peek());
    }
    return token;
  },

  peekToken() {
    if (this.tokens.length === 0) {
      throw $parseMinErr(
        "ueoe",
        "Unexpected end of expression: {0}",
        this.text,
      );
    }
    return this.tokens[0];
  },

  peek(e1, e2, e3, e4) {
    return this.peekAhead(0, e1, e2, e3, e4);
  },

  peekAhead(i, e1, e2, e3, e4) {
    if (this.tokens.length > i) {
      const token = this.tokens[i];
      const t = token.text;
      if (
        t === e1 ||
        t === e2 ||
        t === e3 ||
        t === e4 ||
        (!e1 && !e2 && !e3 && !e4)
      ) {
        return token;
      }
    }
    return false;
  },

  expect(e1, e2, e3, e4) {
    const token = this.peek(e1, e2, e3, e4);
    if (token) {
      this.tokens.shift();
      return token;
    }
    return false;
  },

  selfReferential: {
    this: { type: ASTType.ThisExpression },
    $locals: { type: ASTType.LocalsExpression },
  },
};
