import {
  csp,
  forEach,
  isDefined,
  isFunction,
  minErr,
  isString,
  isNumber,
} from "../../shared/utils";

const $parseMinErr = minErr("$parse");

const objectValueOf = {}.constructor.prototype.valueOf;

/**
 * Converts parameter to  strings property name for use  as keys in an object.
 * Any non-string object, including a number, is typecasted into a string via the toString method.
 * {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Property_accessors#Property_names}
 *
 * @param {!any} name
 * @returns {string}
 */
function getStringValue(name) {
  return `${name}`;
}

const OPERATORS = Object.create(null);

"+ - * / % === !== == != < > <= >= && || ! = |"
  .split(" ")
  .forEach((operator) => (OPERATORS[operator] = true));

const ESCAPE = {
  n: "\n",
  f: "\f",
  r: "\r",
  t: "\t",
  v: "\v",
  "'": "'",
  '"': '"',
};

/// //////////////////////////////////////

/**
 * @constructor
 */
export const Lexer = function Lexer(options) {
  this.options = options;
};

Lexer.prototype = {
  constructor: Lexer,

  lex(text) {
    this.text = text;
    this.index = 0;
    this.tokens = [];

    while (this.index < this.text.length) {
      const ch = this.text.charAt(this.index);
      if (ch === '"' || ch === "'") {
        this.readString(ch);
      } else if (
        this.isNumber(ch) ||
        (ch === "." && this.isNumber(this.peek()))
      ) {
        this.readNumber();
      } else if (this.isIdentifierStart(this.peekMultichar())) {
        this.readIdent();
      } else if (this.is(ch, "(){}[].,;:?")) {
        this.tokens.push({ index: this.index, text: ch });
        this.index++;
      } else if (this.isWhitespace(ch)) {
        this.index++;
      } else {
        const ch2 = ch + this.peek();
        const ch3 = ch2 + this.peek(2);
        const op1 = OPERATORS[ch];
        const op2 = OPERATORS[ch2];
        const op3 = OPERATORS[ch3];
        if (op1 || op2 || op3) {
          const token = op3 ? ch3 : op2 ? ch2 : ch;
          this.tokens.push({ index: this.index, text: token, operator: true });
          this.index += token.length;
        } else {
          this.throwError(
            "Unexpected next character ",
            this.index,
            this.index + 1,
          );
        }
      }
    }
    return this.tokens;
  },

  is(ch, chars) {
    return chars.indexOf(ch) !== -1;
  },

  peek(i) {
    const num = i || 1;
    return this.index + num < this.text.length
      ? this.text.charAt(this.index + num)
      : false;
  },

  isNumber(ch) {
    return ch >= "0" && ch <= "9" && typeof ch === "string";
  },

  isWhitespace(ch) {
    // IE treats non-breaking space as \u00A0
    return (
      ch === " " ||
      ch === "\r" ||
      ch === "\t" ||
      ch === "\n" ||
      ch === "\v" ||
      ch === "\u00A0"
    );
  },

  isIdentifierStart(ch) {
    return this.options.isIdentifierStart
      ? this.options.isIdentifierStart(ch, this.codePointAt(ch))
      : this.isValidIdentifierStart(ch);
  },

  isValidIdentifierStart(ch) {
    return (
      (ch >= "a" && ch <= "z") ||
      (ch >= "A" && ch <= "Z") ||
      ch === "_" ||
      ch === "$"
    );
  },

  isIdentifierContinue(ch) {
    return this.options.isIdentifierContinue
      ? this.options.isIdentifierContinue(ch, this.codePointAt(ch))
      : this.isValidIdentifierContinue(ch);
  },

  isValidIdentifierContinue(ch) {
    return this.isValidIdentifierStart(ch) || this.isNumber(ch);
  },

  codePointAt(ch) {
    if (ch.length === 1) return ch.charCodeAt(0);
    // eslint-disable-next-line no-bitwise
    return (ch.charCodeAt(0) << 10) + ch.charCodeAt(1) - 0x35fdc00;
  },

  peekMultichar() {
    const ch = this.text.charAt(this.index);
    const peek = this.peek();
    if (!peek) {
      return ch;
    }
    const cp1 = ch.charCodeAt(0);
    const cp2 = peek.charCodeAt(0);
    if (cp1 >= 0xd800 && cp1 <= 0xdbff && cp2 >= 0xdc00 && cp2 <= 0xdfff) {
      return ch + peek;
    }
    return ch;
  },

  isExpOperator(ch) {
    return ch === "-" || ch === "+" || this.isNumber(ch);
  },

  throwError(error, start, end) {
    end = end || this.index;
    const colStr = isDefined(start)
      ? `s ${start}-${this.index} [${this.text.substring(start, end)}]`
      : ` ${end}`;
    throw $parseMinErr(
      "lexerr",
      "Lexer Error: {0} at column{1} in expression [{2}].",
      error,
      colStr,
      this.text,
    );
  },

  readNumber() {
    let number = "";
    const start = this.index;
    while (this.index < this.text.length) {
      const ch = this.text.charAt(this.index).toLowerCase();
      if (ch === "." || this.isNumber(ch)) {
        number += ch;
      } else {
        const peekCh = this.peek();
        if (ch === "e" && this.isExpOperator(peekCh)) {
          number += ch;
        } else if (
          this.isExpOperator(ch) &&
          peekCh &&
          this.isNumber(peekCh) &&
          number.charAt(number.length - 1) === "e"
        ) {
          number += ch;
        } else if (
          this.isExpOperator(ch) &&
          (!peekCh || !this.isNumber(peekCh)) &&
          number.charAt(number.length - 1) === "e"
        ) {
          this.throwError("Invalid exponent");
        } else {
          break;
        }
      }
      this.index++;
    }
    this.tokens.push({
      index: start,
      text: number,
      constant: true,
      value: Number(number),
    });
  },

  readIdent() {
    const start = this.index;
    this.index += this.peekMultichar().length;
    while (this.index < this.text.length) {
      const ch = this.peekMultichar();
      if (!this.isIdentifierContinue(ch)) {
        break;
      }
      this.index += ch.length;
    }
    this.tokens.push({
      index: start,
      text: this.text.slice(start, this.index),
      identifier: true,
    });
  },

  readString(quote) {
    const start = this.index;
    this.index++;
    let string = "";
    let rawString = quote;
    let escape = false;
    while (this.index < this.text.length) {
      const ch = this.text.charAt(this.index);
      rawString += ch;
      if (escape) {
        if (ch === "u") {
          const hex = this.text.substring(this.index + 1, this.index + 5);
          if (!hex.match(/[\da-f]{4}/i)) {
            this.throwError(`Invalid unicode escape [\\u${hex}]`);
          }
          this.index += 4;
          string += String.fromCharCode(parseInt(hex, 16));
        } else {
          const rep = ESCAPE[ch];
          string += rep || ch;
        }
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === quote) {
        this.index++;
        this.tokens.push({
          index: start,
          text: rawString,
          constant: true,
          value: string,
        });
        return;
      } else {
        string += ch;
      }
      this.index++;
    }
    this.throwError("Unterminated quote", start);
  },
};

/**
 * @typedef {("Program"|"ExpressionStatement"|"AssignmentExpression"|"ConditionalExpression"|"LogicalExpression"|"BinaryExpression"|"UnaryExpression"|"CallExpression"|"MemberExpression"|"Identifier"|"Literal"|"ArrayExpression"|"Property"|"ObjectExpression"|"ThisExpression"|"LocalsExpression"|"NGValueParameter")} ASTType
 */
const ASTType = {
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

function ifDefined(v, d) {
  return typeof v !== "undefined" ? v : d;
}

function plusFn(l, r) {
  if (typeof l === "undefined") return r;
  if (typeof r === "undefined") return l;
  return l + r;
}

function isStateless($filter, filterName) {
  const fn = $filter(filterName);
  return !fn.$stateful;
}

const PURITY_ABSOLUTE = 1;
const PURITY_RELATIVE = 2;

// Detect nodes which could depend on non-shallow state of objects
function isPure(node, parentIsPure) {
  switch (node.type) {
    // Computed members might invoke a stateful toString()
    case ASTType.MemberExpression:
      if (node.computed) {
        return false;
      }
      break;

    // Unary always convert to primative
    case ASTType.UnaryExpression:
      return PURITY_ABSOLUTE;

    // The binary + operator can invoke a stateful toString().
    case ASTType.BinaryExpression:
      return node.operator !== "+" ? PURITY_ABSOLUTE : false;

    // Functions / filters probably read state from within objects
    case ASTType.CallExpression:
      return false;
  }

  return undefined === parentIsPure ? PURITY_RELATIVE : parentIsPure;
}

function findConstantAndWatchExpressions(ast, $filter, parentIsPure) {
  let allConstants;
  let argsToWatch;
  let isStatelessFilter;

  const astIsPure = (ast.isPure = isPure(ast, parentIsPure));

  switch (ast.type) {
    case ASTType.Program:
      allConstants = true;
      /** @type {[any]} */ (ast.body).forEach((expr) => {
        findConstantAndWatchExpressions(expr.expression, $filter, astIsPure);
        allConstants = allConstants && expr.expression.constant;
      });
      ast.constant = allConstants;
      break;
    case ASTType.Literal:
      ast.constant = true;
      ast.toWatch = [];
      break;
    case ASTType.UnaryExpression:
      findConstantAndWatchExpressions(ast.argument, $filter, astIsPure);
      ast.constant = ast.argument.constant;
      ast.toWatch = ast.argument.toWatch;
      break;
    case ASTType.BinaryExpression:
      findConstantAndWatchExpressions(ast.left, $filter, astIsPure);
      findConstantAndWatchExpressions(ast.right, $filter, astIsPure);
      ast.constant = ast.left.constant && ast.right.constant;
      ast.toWatch = ast.left.toWatch.concat(ast.right.toWatch);
      break;
    case ASTType.LogicalExpression:
      findConstantAndWatchExpressions(ast.left, $filter, astIsPure);
      findConstantAndWatchExpressions(ast.right, $filter, astIsPure);
      ast.constant = ast.left.constant && ast.right.constant;
      ast.toWatch = ast.constant ? [] : [ast];
      break;
    case ASTType.ConditionalExpression:
      findConstantAndWatchExpressions(ast.test, $filter, astIsPure);
      findConstantAndWatchExpressions(ast.alternate, $filter, astIsPure);
      findConstantAndWatchExpressions(ast.consequent, $filter, astIsPure);
      ast.constant =
        ast.test.constant && ast.alternate.constant && ast.consequent.constant;
      ast.toWatch = ast.constant ? [] : [ast];
      break;
    case ASTType.Identifier:
      ast.constant = false;
      ast.toWatch = [ast];
      break;
    case ASTType.MemberExpression:
      findConstantAndWatchExpressions(ast.object, $filter, astIsPure);
      if (ast.computed) {
        findConstantAndWatchExpressions(ast.property, $filter, astIsPure);
      }
      ast.constant =
        ast.object.constant && (!ast.computed || ast.property.constant);
      ast.toWatch = ast.constant ? [] : [ast];
      break;
    case ASTType.CallExpression:
      isStatelessFilter = ast.filter
        ? isStateless($filter, ast.callee.name)
        : false;
      allConstants = isStatelessFilter;
      argsToWatch = [];
      forEach(ast.arguments, (expr) => {
        findConstantAndWatchExpressions(expr, $filter, astIsPure);
        allConstants = allConstants && expr.constant;
        argsToWatch.push.apply(argsToWatch, expr.toWatch);
      });
      ast.constant = allConstants;
      ast.toWatch = isStatelessFilter ? argsToWatch : [ast];
      break;
    case ASTType.AssignmentExpression:
      findConstantAndWatchExpressions(ast.left, $filter, astIsPure);
      findConstantAndWatchExpressions(ast.right, $filter, astIsPure);
      ast.constant = ast.left.constant && ast.right.constant;
      ast.toWatch = [ast];
      break;
    case ASTType.ArrayExpression:
      allConstants = true;
      argsToWatch = [];
      forEach(ast.elements, (expr) => {
        findConstantAndWatchExpressions(expr, $filter, astIsPure);
        allConstants = allConstants && expr.constant;
        argsToWatch.push.apply(argsToWatch, expr.toWatch);
      });
      ast.constant = allConstants;
      ast.toWatch = argsToWatch;
      break;
    case ASTType.ObjectExpression:
      allConstants = true;
      argsToWatch = [];
      forEach(ast.properties, (property) => {
        findConstantAndWatchExpressions(property.value, $filter, astIsPure);
        allConstants = allConstants && property.value.constant;
        argsToWatch.push.apply(argsToWatch, property.value.toWatch);
        if (property.computed) {
          // `{[key]: value}` implicitly does `key.toString()` which may be non-pure
          findConstantAndWatchExpressions(
            property.key,
            $filter,
            /* parentIsPure= */ false,
          );
          allConstants = allConstants && property.key.constant;
          argsToWatch.push.apply(argsToWatch, property.key.toWatch);
        }
      });
      ast.constant = allConstants;
      ast.toWatch = argsToWatch;
      break;
    case ASTType.ThisExpression:
      ast.constant = false;
      ast.toWatch = [];
      break;
    case ASTType.LocalsExpression:
      ast.constant = false;
      ast.toWatch = [];
      break;
  }
}

function getInputs(body) {
  if (body.length !== 1) return;
  const lastExpression = body[0].expression;
  const candidate = lastExpression.toWatch;
  if (candidate.length !== 1) return candidate;
  return candidate[0] !== lastExpression ? candidate : undefined;
}

function isAssignable(ast) {
  return (
    ast.type === ASTType.Identifier || ast.type === ASTType.MemberExpression
  );
}

function assignableAST(ast) {
  if (ast.body.length === 1 && isAssignable(ast.body[0].expression)) {
    return {
      type: ASTType.AssignmentExpression,
      left: ast.body[0].expression,
      right: { type: ASTType.NGValueParameter },
      operator: "=",
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

function ASTCompiler($filter) {
  this.$filter = $filter;
}

ASTCompiler.prototype = {
  compile(ast) {
    const self = this;
    this.state = {
      nextId: 0,
      filters: {},
      fn: { vars: [], body: [], own: {} },
      assign: { vars: [], body: [], own: {} },
      inputs: [],
    };
    findConstantAndWatchExpressions(ast, self.$filter);
    let extra = "";
    let assignable;
    this.stage = "assign";
    if ((assignable = assignableAST(ast))) {
      this.state.computing = "assign";
      const result = this.nextId();
      this.recurse(assignable, result);
      this.return_(result);
      extra = `fn.assign=${this.generateFunction("assign", "s,v,l")}`;
    }
    const toWatch = getInputs(ast.body);
    self.stage = "inputs";
    forEach(toWatch, (watch, key) => {
      const fnKey = `fn${key}`;
      self.state[fnKey] = { vars: [], body: [], own: {} };
      self.state.computing = fnKey;
      const intoId = self.nextId();
      self.recurse(watch, intoId);
      self.return_(intoId);
      self.state.inputs.push({ name: fnKey, isPure: watch.isPure });
      watch.watchId = key;
    });
    this.state.computing = "fn";
    this.stage = "main";
    this.recurse(ast);
    const fnString = `\n${this.filterPrefix()}let fn=${this.generateFunction(
      "fn",
      "s,l,a,i",
    )}${extra}${this.watchFns()}return fn;`;

    // eslint-disable-next-line no-new-func
    const fn = new Function(
      "$filter",
      "getStringValue",
      "ifDefined",
      "plus",
      fnString,
    )(this.$filter, getStringValue, ifDefined, plusFn);
    this.state = this.stage = undefined;
    return fn;
  },

  watchFns() {
    const result = [];
    const { inputs } = this.state;
    const self = this;
    forEach(inputs, (input) => {
      result.push(
        `let ${input.name}=${self.generateFunction(input.name, "s")}`,
      );
      if (input.isPure) {
        result.push(input.name, `.isPure=${JSON.stringify(input.isPure)};`);
      }
    });
    if (inputs.length) {
      result.push(`fn.inputs=[${inputs.map((i) => i.name).join(",")}];`);
    }
    return result.join("");
  },

  generateFunction(name, params) {
    return `function(${params}){${this.varsPrefix(name)}${this.body(name)}};`;
  },

  filterPrefix() {
    const parts = [];
    const self = this;
    forEach(this.state.filters, (id, filter) => {
      parts.push(`${id}=$filter(${self.escape(filter)})`);
    });
    if (parts.length) return `let ${parts.join(",")};`;
    return "";
  },

  varsPrefix(section) {
    return this.state[section].vars.length
      ? `let ${this.state[section].vars.join(",")};`
      : "";
  },

  body(section) {
    return this.state[section].body.join("");
  },

  recurse(ast, intoId, nameId, recursionFn, create, skipWatchIdCheck) {
    let left;
    let right;
    const self = this;
    let args;
    let expression;
    let computed;
    recursionFn = recursionFn || (() => {});
    if (!skipWatchIdCheck && isDefined(ast.watchId)) {
      intoId = intoId || this.nextId();
      this.if_(
        "i",
        this.lazyAssign(intoId, this.computedMember("i", ast.watchId)),
        this.lazyRecurse(ast, intoId, nameId, recursionFn, create, true),
      );
      return;
    }
    switch (ast.type) {
      case ASTType.Program:
        forEach(ast.body, (expression, pos) => {
          self.recurse(expression.expression, undefined, undefined, (expr) => {
            right = expr;
          });
          if (pos !== ast.body.length - 1) {
            self.current().body.push(right, ";");
          } else {
            self.return_(right);
          }
        });
        break;
      case ASTType.Literal:
        expression = this.escape(ast.value);
        this.assign(intoId, expression);
        recursionFn(intoId || expression);
        break;
      case ASTType.UnaryExpression:
        this.recurse(ast.argument, undefined, undefined, (expr) => {
          right = expr;
        });
        expression = `${ast.operator}(${this.ifDefined(right, 0)})`;
        this.assign(intoId, expression);
        recursionFn(expression);
        break;
      case ASTType.BinaryExpression:
        this.recurse(ast.left, undefined, undefined, (expr) => {
          left = expr;
        });
        this.recurse(ast.right, undefined, undefined, (expr) => {
          right = expr;
        });
        if (ast.operator === "+") {
          expression = this.plus(left, right);
        } else if (ast.operator === "-") {
          expression =
            this.ifDefined(left, 0) + ast.operator + this.ifDefined(right, 0);
        } else {
          expression = `(${left})${ast.operator}(${right})`;
        }
        this.assign(intoId, expression);
        recursionFn(expression);
        break;
      case ASTType.LogicalExpression:
        intoId = intoId || this.nextId();
        self.recurse(ast.left, intoId);
        self.if_(
          ast.operator === "&&" ? intoId : self.not(intoId),
          self.lazyRecurse(ast.right, intoId),
        );
        recursionFn(intoId);
        break;
      case ASTType.ConditionalExpression:
        intoId = intoId || this.nextId();
        self.recurse(ast.test, intoId);
        self.if_(
          intoId,
          self.lazyRecurse(ast.alternate, intoId),
          self.lazyRecurse(ast.consequent, intoId),
        );
        recursionFn(intoId);
        break;
      case ASTType.Identifier:
        intoId = intoId || this.nextId();
        if (nameId) {
          nameId.context =
            self.stage === "inputs"
              ? "s"
              : this.assign(
                  this.nextId(),
                  `${this.getHasOwnProperty("l", ast.name)}?l:s`,
                );
          nameId.computed = false;
          nameId.name = ast.name;
        }
        self.if_(
          self.stage === "inputs" ||
            self.not(self.getHasOwnProperty("l", ast.name)),
          () => {
            self.if_(self.stage === "inputs" || "s", () => {
              if (create && create !== 1) {
                self.if_(
                  self.isNull(self.nonComputedMember("s", ast.name)),
                  self.lazyAssign(self.nonComputedMember("s", ast.name), "{}"),
                );
              }
              self.assign(intoId, self.nonComputedMember("s", ast.name));
            });
          },
          intoId &&
            self.lazyAssign(intoId, self.nonComputedMember("l", ast.name)),
        );
        recursionFn(intoId);
        break;
      case ASTType.MemberExpression:
        left = (nameId && (nameId.context = this.nextId())) || this.nextId();
        intoId = intoId || this.nextId();
        self.recurse(
          ast.object,
          left,
          undefined,
          () => {
            self.if_(
              self.notNull(left),
              () => {
                if (ast.computed) {
                  right = self.nextId();
                  self.recurse(ast.property, right);
                  self.getStringValue(right);
                  if (create && create !== 1) {
                    self.if_(
                      self.not(self.computedMember(left, right)),
                      self.lazyAssign(self.computedMember(left, right), "{}"),
                    );
                  }
                  expression = self.computedMember(left, right);
                  self.assign(intoId, expression);
                  if (nameId) {
                    nameId.computed = true;
                    nameId.name = right;
                  }
                } else {
                  if (create && create !== 1) {
                    self.if_(
                      self.isNull(
                        self.nonComputedMember(left, ast.property.name),
                      ),
                      self.lazyAssign(
                        self.nonComputedMember(left, ast.property.name),
                        "{}",
                      ),
                    );
                  }
                  expression = self.nonComputedMember(left, ast.property.name);
                  self.assign(intoId, expression);
                  if (nameId) {
                    nameId.computed = false;
                    nameId.name = ast.property.name;
                  }
                }
              },
              () => {
                self.assign(intoId, "undefined");
              },
            );
            recursionFn(intoId);
          },
          !!create,
        );
        break;
      case ASTType.CallExpression:
        intoId = intoId || this.nextId();
        if (ast.filter) {
          right = self.filter(ast.callee.name);
          args = [];
          forEach(ast.arguments, (expr) => {
            const argument = self.nextId();
            self.recurse(expr, argument);
            args.push(argument);
          });
          expression = `${right}(${args.join(",")})`;
          self.assign(intoId, expression);
          recursionFn(intoId);
        } else {
          right = self.nextId();
          left = {};
          args = [];
          self.recurse(ast.callee, right, left, () => {
            self.if_(
              self.notNull(right),
              () => {
                forEach(ast.arguments, (expr) => {
                  self.recurse(
                    expr,
                    ast.constant ? undefined : self.nextId(),
                    undefined,
                    (argument) => {
                      args.push(argument);
                    },
                  );
                });
                if (left.name) {
                  expression = `${self.member(
                    left.context,
                    left.name,
                    left.computed,
                  )}(${args.join(",")})`;
                } else {
                  expression = `${right}(${args.join(",")})`;
                }
                self.assign(intoId, expression);
              },
              () => {
                self.assign(intoId, "undefined");
              },
            );
            recursionFn(intoId);
          });
        }
        break;
      case ASTType.AssignmentExpression:
        right = this.nextId();
        left = {};
        this.recurse(
          ast.left,
          undefined,
          left,
          () => {
            self.if_(self.notNull(left.context), () => {
              self.recurse(ast.right, right);
              expression =
                self.member(left.context, left.name, left.computed) +
                ast.operator +
                right;
              self.assign(intoId, expression);
              recursionFn(intoId || expression);
            });
          },
          1,
        );
        break;
      case ASTType.ArrayExpression:
        args = [];
        forEach(ast.elements, (expr) => {
          self.recurse(
            expr,
            ast.constant ? undefined : self.nextId(),
            undefined,
            (argument) => {
              args.push(argument);
            },
          );
        });
        expression = `[${args.join(",")}]`;
        this.assign(intoId, expression);
        recursionFn(intoId || expression);
        break;
      case ASTType.ObjectExpression:
        args = [];
        computed = false;
        forEach(ast.properties, (property) => {
          if (property.computed) {
            computed = true;
          }
        });
        if (computed) {
          intoId = intoId || this.nextId();
          this.assign(intoId, "{}");
          forEach(ast.properties, (property) => {
            if (property.computed) {
              left = self.nextId();
              self.recurse(property.key, left);
            } else {
              left =
                property.key.type === ASTType.Identifier
                  ? property.key.name
                  : `${property.key.value}`;
            }
            right = self.nextId();
            self.recurse(property.value, right);
            self.assign(self.member(intoId, left, property.computed), right);
          });
        } else {
          forEach(ast.properties, (property) => {
            self.recurse(
              property.value,
              ast.constant ? undefined : self.nextId(),
              undefined,
              (expr) => {
                args.push(
                  `${self.escape(
                    property.key.type === ASTType.Identifier
                      ? property.key.name
                      : `${property.key.value}`,
                  )}:${expr}`,
                );
              },
            );
          });
          expression = `{${args.join(",")}}`;
          this.assign(intoId, expression);
        }
        recursionFn(intoId || expression);
        break;
      case ASTType.ThisExpression:
        this.assign(intoId, "s");
        recursionFn(intoId || "s");
        break;
      case ASTType.LocalsExpression:
        this.assign(intoId, "l");
        recursionFn(intoId || "l");
        break;
      case ASTType.NGValueParameter:
        this.assign(intoId, "v");
        recursionFn(intoId || "v");
        break;
    }
  },

  getHasOwnProperty(element, property) {
    const key = `${element}.${property}`;
    const { own } = this.current();
    if (!Object.prototype.hasOwnProperty.call(own, key)) {
      own[key] = this.nextId(
        false,
        `${element}&&(${this.escape(property)} in ${element})`,
      );
    }
    return own[key];
  },

  assign(id, value) {
    if (!id) return;
    this.current().body.push(id, "=", value, ";");
    return id;
  },

  filter(filterName) {
    if (!Object.prototype.hasOwnProperty.call(this.state.filters, filterName)) {
      this.state.filters[filterName] = this.nextId(true);
    }
    return this.state.filters[filterName];
  },

  ifDefined(id, defaultValue) {
    return `ifDefined(${id},${this.escape(defaultValue)})`;
  },

  plus(left, right) {
    return `plus(${left},${right})`;
  },

  return_(id) {
    this.current().body.push("return ", id, ";");
  },

  if_(test, alternate, consequent) {
    if (test === true) {
      alternate();
    } else {
      const { body } = this.current();
      body.push("if(", test, "){");
      alternate();
      body.push("}");
      if (consequent) {
        body.push("else{");
        consequent();
        body.push("}");
      }
    }
  },

  not(expression) {
    return `!(${expression})`;
  },

  isNull(expression) {
    return `${expression}==null`;
  },

  notNull(expression) {
    return `${expression}!=null`;
  },

  nonComputedMember(left, right) {
    const SAFE_IDENTIFIER = /^[$_a-zA-Z][$_a-zA-Z0-9]*$/;
    const UNSAFE_CHARACTERS = /[^$_a-zA-Z0-9]/g;
    if (SAFE_IDENTIFIER.test(right)) {
      return `${left}.${right}`;
    }
    return `${left}["${right.replace(
      UNSAFE_CHARACTERS,
      this.stringEscapeFn,
    )}"]`;
  },

  computedMember(left, right) {
    return `${left}[${right}]`;
  },

  member(left, right, computed) {
    if (computed) return this.computedMember(left, right);
    return this.nonComputedMember(left, right);
  },

  getStringValue(item) {
    this.assign(item, `getStringValue(${item})`);
  },

  lazyRecurse(ast, intoId, nameId, recursionFn, create, skipWatchIdCheck) {
    const self = this;
    return function () {
      self.recurse(ast, intoId, nameId, recursionFn, create, skipWatchIdCheck);
    };
  },

  lazyAssign(id, value) {
    const self = this;
    return function () {
      self.assign(id, value);
    };
  },

  stringEscapeRegex: /[^ a-zA-Z0-9]/g,

  stringEscapeFn(c) {
    return `\\u${`0000${c.charCodeAt(0).toString(16)}`.slice(-4)}`;
  },

  escape(value) {
    if (isString(value))
      return `'${value.replace(this.stringEscapeRegex, this.stringEscapeFn)}'`;
    if (isNumber(value)) return value.toString();
    if (value === true) return "true";
    if (value === false) return "false";
    if (value === null) return "null";
    if (typeof value === "undefined") return "undefined";

    throw $parseMinErr("esc", "IMPOSSIBLE");
  },

  nextId(skip, init) {
    const id = `v${this.state.nextId++}`;
    if (!skip) {
      this.current().vars.push(id + (init ? `=${init}` : ""));
    }
    return id;
  },

  current() {
    return this.state[this.state.computing];
  },
};

function ASTInterpreter($filter) {
  this.$filter = $filter;
}

ASTInterpreter.prototype = {
  compile(ast) {
    const self = this;
    findConstantAndWatchExpressions(ast, self.$filter);
    let assignable;
    let assign;
    if ((assignable = assignableAST(ast))) {
      assign = this.recurse(assignable);
    }
    const toWatch = getInputs(ast.body);
    let inputs;
    if (toWatch) {
      inputs = [];
      forEach(toWatch, (watch, key) => {
        const input = self.recurse(watch);
        input.isPure = watch.isPure;
        watch.input = input;
        inputs.push(input);
        watch.watchId = key;
      });
    }
    const expressions = [];
    forEach(ast.body, (expression) => {
      expressions.push(self.recurse(expression.expression));
    });
    const fn =
      ast.body.length === 0
        ? () => {}
        : ast.body.length === 1
          ? expressions[0]
          : function (scope, locals) {
              let lastValue;
              forEach(expressions, (exp) => {
                lastValue = exp(scope, locals);
              });
              return lastValue;
            };
    if (assign) {
      fn.assign = function (scope, value, locals) {
        return assign(scope, locals, value);
      };
    }
    if (inputs) {
      fn.inputs = inputs;
    }
    return fn;
  },

  recurse(ast, context, create) {
    let left;
    let right;
    const self = this;
    let args;
    if (ast.input) {
      return this.inputs(ast.input, ast.watchId);
    }
    switch (ast.type) {
      case ASTType.Literal:
        return this.value(ast.value, context);
      case ASTType.UnaryExpression:
        right = this.recurse(ast.argument);
        return this[`unary${ast.operator}`](right, context);
      case ASTType.BinaryExpression:
        left = this.recurse(ast.left);
        right = this.recurse(ast.right);
        return this[`binary${ast.operator}`](left, right, context);
      case ASTType.LogicalExpression:
        left = this.recurse(ast.left);
        right = this.recurse(ast.right);
        return this[`binary${ast.operator}`](left, right, context);
      case ASTType.ConditionalExpression:
        return this["ternary?:"](
          this.recurse(ast.test),
          this.recurse(ast.alternate),
          this.recurse(ast.consequent),
          context,
        );
      case ASTType.Identifier:
        return self.identifier(ast.name, context, create);
      case ASTType.MemberExpression:
        left = this.recurse(ast.object, false, !!create);
        if (!ast.computed) {
          right = ast.property.name;
        }
        if (ast.computed) right = this.recurse(ast.property);
        return ast.computed
          ? this.computedMember(left, right, context, create)
          : this.nonComputedMember(left, right, context, create);
      case ASTType.CallExpression:
        args = [];
        forEach(ast.arguments, (expr) => {
          args.push(self.recurse(expr));
        });
        if (ast.filter) right = this.$filter(ast.callee.name);
        if (!ast.filter) right = this.recurse(ast.callee, true);
        return ast.filter
          ? function (scope, locals, assign, inputs) {
              const values = [];
              for (let i = 0; i < args.length; ++i) {
                values.push(args[i](scope, locals, assign, inputs));
              }
              const value = right.apply(undefined, values, inputs);
              return context
                ? { context: undefined, name: undefined, value }
                : value;
            }
          : function (scope, locals, assign, inputs) {
              const rhs = right(scope, locals, assign, inputs);
              let value;
              if (rhs.value != null) {
                const values = [];
                for (let i = 0; i < args.length; ++i) {
                  values.push(args[i](scope, locals, assign, inputs));
                }
                value = rhs.value.apply(rhs.context, values);
              }
              return context ? { value } : value;
            };
      case ASTType.AssignmentExpression:
        left = this.recurse(ast.left, true, 1);
        right = this.recurse(ast.right);
        return function (scope, locals, assign, inputs) {
          const lhs = left(scope, locals, assign, inputs);
          const rhs = right(scope, locals, assign, inputs);
          lhs.context[lhs.name] = rhs;
          return context ? { value: rhs } : rhs;
        };
      case ASTType.ArrayExpression:
        args = [];
        forEach(ast.elements, (expr) => {
          args.push(self.recurse(expr));
        });
        return function (scope, locals, assign, inputs) {
          const value = [];
          for (let i = 0; i < args.length; ++i) {
            value.push(args[i](scope, locals, assign, inputs));
          }
          return context ? { value } : value;
        };
      case ASTType.ObjectExpression:
        args = [];
        forEach(ast.properties, (property) => {
          if (property.computed) {
            args.push({
              key: self.recurse(property.key),
              computed: true,
              value: self.recurse(property.value),
            });
          } else {
            args.push({
              key:
                property.key.type === ASTType.Identifier
                  ? property.key.name
                  : `${property.key.value}`,
              computed: false,
              value: self.recurse(property.value),
            });
          }
        });
        return function (scope, locals, assign, inputs) {
          const value = {};
          for (let i = 0; i < args.length; ++i) {
            if (args[i].computed) {
              value[args[i].key(scope, locals, assign, inputs)] = args[i].value(
                scope,
                locals,
                assign,
                inputs,
              );
            } else {
              value[args[i].key] = args[i].value(scope, locals, assign, inputs);
            }
          }
          return context ? { value } : value;
        };
      case ASTType.ThisExpression:
        return function (scope) {
          return context ? { value: scope } : scope;
        };
      case ASTType.LocalsExpression:
        return function (scope, locals) {
          return context ? { value: locals } : locals;
        };
      case ASTType.NGValueParameter:
        return function (scope, locals, assign) {
          return context ? { value: assign } : assign;
        };
    }
  },

  "unary+": function (argument, context) {
    return function (scope, locals, assign, inputs) {
      let arg = argument(scope, locals, assign, inputs);
      if (isDefined(arg)) {
        arg = +arg;
      } else {
        arg = 0;
      }
      return context ? { value: arg } : arg;
    };
  },
  "unary-": function (argument, context) {
    return function (scope, locals, assign, inputs) {
      let arg = argument(scope, locals, assign, inputs);
      if (isDefined(arg)) {
        arg = -arg;
      } else {
        arg = -0;
      }
      return context ? { value: arg } : arg;
    };
  },
  "unary!": function (argument, context) {
    return function (scope, locals, assign, inputs) {
      const arg = !argument(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary+": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const lhs = left(scope, locals, assign, inputs);
      const rhs = right(scope, locals, assign, inputs);
      const arg = plusFn(lhs, rhs);
      return context ? { value: arg } : arg;
    };
  },
  "binary-": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const lhs = left(scope, locals, assign, inputs);
      const rhs = right(scope, locals, assign, inputs);
      const arg = (isDefined(lhs) ? lhs : 0) - (isDefined(rhs) ? rhs : 0);
      return context ? { value: arg } : arg;
    };
  },
  "binary*": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) *
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary/": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) /
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary%": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) %
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary===": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) ===
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary!==": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) !==
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary==": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) ==
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary!=": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) !=
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary<": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) <
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary>": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) >
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary<=": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) <=
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary>=": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) >=
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary&&": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) &&
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "binary||": function (left, right, context) {
    return function (scope, locals, assign, inputs) {
      const arg =
        left(scope, locals, assign, inputs) ||
        right(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  "ternary?:": function (test, alternate, consequent, context) {
    return function (scope, locals, assign, inputs) {
      const arg = test(scope, locals, assign, inputs)
        ? alternate(scope, locals, assign, inputs)
        : consequent(scope, locals, assign, inputs);
      return context ? { value: arg } : arg;
    };
  },
  value(value, context) {
    return function () {
      return context ? { context: undefined, name: undefined, value } : value;
    };
  },
  identifier(name, context, create) {
    return function (scope, locals) {
      const base = locals && name in locals ? locals : scope;
      if (create && create !== 1 && base && base[name] == null) {
        base[name] = {};
      }
      const value = base ? base[name] : undefined;
      if (context) {
        return { context: base, name, value };
      }
      return value;
    };
  },
  computedMember(left, right, context, create) {
    return function (scope, locals, assign, inputs) {
      const lhs = left(scope, locals, assign, inputs);
      let rhs;
      let value;
      if (lhs != null) {
        rhs = right(scope, locals, assign, inputs);
        rhs = getStringValue(rhs);
        if (create && create !== 1) {
          if (lhs && !lhs[rhs]) {
            lhs[rhs] = {};
          }
        }
        value = lhs[rhs];
      }
      if (context) {
        return { context: lhs, name: rhs, value };
      }
      return value;
    };
  },
  nonComputedMember(left, right, context, create) {
    return function (scope, locals, assign, inputs) {
      const lhs = left(scope, locals, assign, inputs);
      if (create && create !== 1) {
        if (lhs && lhs[right] == null) {
          lhs[right] = {};
        }
      }
      const value = lhs != null ? lhs[right] : undefined;
      if (context) {
        return { context: lhs, name: right, value };
      }
      return value;
    };
  },
  inputs(input, watchId) {
    return function (scope, value, locals, inputs) {
      if (inputs) return inputs[watchId];
      return input(scope, value, locals);
    };
  },
};

/**
 * @constructor
 */
class Parser {
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

function getValueOf(value) {
  return isFunction(value.valueOf)
    ? value.valueOf()
    : objectValueOf.call(value);
}

/// ////////////////////////////////

/**
 * @ngdoc service
 * @name $parse
 * @kind function
 *
 * @description
 *
 * Converts AngularJS {@link guide/expression expression} into a function.
 *
 * ```js
 *   let getter = $parse('user.name');
 *   let setter = getter.assign;
 *   let context = {user:{name:'AngularJS'}};
 *   let locals = {user:{name:'local'}};
 *
 *   expect(getter(context)).toEqual('AngularJS');
 *   setter(context, 'newValue');
 *   expect(context.user.name).toEqual('newValue');
 *   expect(getter(context, locals)).toEqual('local');
 * ```
 *
 *
 * @param {string} expression String expression to compile.
 * @returns {function(context, locals)} a function which represents the compiled expression:
 *
 *    * `context` – `{object}` – an object against which any expressions embedded in the strings
 *      are evaluated against (typically a scope object).
 *    * `locals` – `{object=}` – local variables context object, useful for overriding values in
 *      `context`.
 *
 *    The returned function also has the following properties:
 *      * `literal` – `{boolean}` – whether the expression's top-level node is a JavaScript
 *        literal.
 *      * `constant` – `{boolean}` – whether the expression is made entirely of JavaScript
 *        constant literals.
 *      * `assign` – `{?function(context, value)}` – if the expression is assignable, this will be
 *        set to a function to change its value on the given context.
 *
 */

export const literals = {
  true: true,
  false: false,
  null: null,
  undefined,
};

/**
 * @ngdoc provider
 * @name $parseProvider
 *
 *
 * @description
 * `$parseProvider` can be used for configuring the default behavior of the {@link ng.$parse $parse}
 *  service.
 */
export function $ParseProvider() {
  const cache = Object.create(null);
  const literals = {
    true: true,
    false: false,
    null: null,
    undefined: undefined,
  };
  var identStart, identContinue;

  /**
   * @ngdoc method
   * @name $parseProvider#addLiteral
   * @description
   *
   * Configure $parse service to add literal values that will be present as literal at expressions.
   *
   * @param {string} literalName Token for the literal value. The literal name value must be a valid literal name.
   * @param {*} literalValue Value for this literal. All literal values must be primitives or `undefined`.
   *
   **/
  this.addLiteral = function (literalName, literalValue) {
    literals[literalName] = literalValue;
  };

  /**
   * @ngdoc method
   * @name $parseProvider#setIdentifierFns
   *
   * @description
   *
   * Allows defining the set of characters that are allowed in AngularJS expressions. The function
   * `identifierStart` will get called to know if a given character is a valid character to be the
   * first character for an identifier. The function `identifierContinue` will get called to know if
   * a given character is a valid character to be a follow-up identifier character. The functions
   * `identifierStart` and `identifierContinue` will receive as arguments the single character to be
   * identifier and the character code point. These arguments will be `string` and `numeric`. Keep in
   * mind that the `string` parameter can be two characters long depending on the character
   * representation. It is expected for the function to return `true` or `false`, whether that
   * character is allowed or not.
   *
   * Since this function will be called extensively, keep the implementation of these functions fast,
   * as the performance of these functions have a direct impact on the expressions parsing speed.
   *
   * @param {function=} identifierStart The function that will decide whether the given character is
   *   a valid identifier start character.
   * @param {function=} identifierContinue The function that will decide whether the given character is
   *   a valid identifier continue character.
   */
  this.setIdentifierFns = function (identifierStart, identifierContinue) {
    identStart = identifierStart;
    identContinue = identifierContinue;
    return this;
  };

  this.$get = [
    "$filter",
    function ($filter) {
      var noUnsafeEval = csp().noUnsafeEval;
      var $parseOptions = {
        csp: noUnsafeEval,
        literals: structuredClone(literals),
        isIdentifierStart: isFunction(identStart) && identStart,
        isIdentifierContinue: isFunction(identContinue) && identContinue,
      };
      $parse.$$getAst = $$getAst;
      return $parse;

      function $parse(exp, interceptorFn) {
        var parsedExpression, cacheKey;

        switch (typeof exp) {
          case "string":
            exp = exp.trim();
            cacheKey = exp;

            parsedExpression = cache[cacheKey];

            if (!parsedExpression) {
              var lexer = new Lexer($parseOptions);
              var parser = new Parser(lexer, $filter, $parseOptions);
              parsedExpression = parser.parse(exp);

              cache[cacheKey] = addWatchDelegate(parsedExpression);
            }
            return addInterceptor(parsedExpression, interceptorFn);

          case "function":
            return addInterceptor(exp, interceptorFn);

          default:
            return addInterceptor(() => {}, interceptorFn);
        }
      }

      function $$getAst(exp) {
        var lexer = new Lexer($parseOptions);
        var parser = new Parser(lexer, $filter, $parseOptions);
        return parser.getAst(exp).ast;
      }

      function expressionInputDirtyCheck(
        newValue,
        oldValueOfValue,
        compareObjectIdentity,
      ) {
        if (newValue == null || oldValueOfValue == null) {
          // null/undefined
          return newValue === oldValueOfValue;
        }

        if (typeof newValue === "object") {
          // attempt to convert the value to a primitive type
          // TODO(docs): add a note to docs that by implementing valueOf even objects and arrays can
          //             be cheaply dirty-checked
          newValue = getValueOf(newValue);

          if (typeof newValue === "object" && !compareObjectIdentity) {
            // objects/arrays are not supported - deep-watching them would be too expensive
            return false;
          }

          // fall-through to the primitive equality check
        }

        //Primitive or NaN
        // eslint-disable-next-line no-self-compare
        return (
          newValue === oldValueOfValue ||
          (newValue !== newValue && oldValueOfValue !== oldValueOfValue)
        );
      }

      function inputsWatchDelegate(
        scope,
        listener,
        objectEquality,
        parsedExpression,
      ) {
        var inputExpressions = parsedExpression.inputs;
        var lastResult;

        if (inputExpressions.length === 1) {
          var oldInputValueOf = expressionInputDirtyCheck; // init to something unique so that equals check fails
          inputExpressions = inputExpressions[0];
          return scope.$watch(
            function expressionInputWatch(scope) {
              var newInputValue = inputExpressions(scope);
              if (
                !expressionInputDirtyCheck(
                  newInputValue,
                  oldInputValueOf,
                  inputExpressions.isPure,
                )
              ) {
                lastResult = parsedExpression(scope, undefined, undefined, [
                  newInputValue,
                ]);
                oldInputValueOf = newInputValue && getValueOf(newInputValue);
              }
              return lastResult;
            },
            listener,
            objectEquality,
          );
        }

        var oldInputValueOfValues = [];
        var oldInputValues = [];
        for (var i = 0, ii = inputExpressions.length; i < ii; i++) {
          oldInputValueOfValues[i] = expressionInputDirtyCheck; // init to something unique so that equals check fails
          oldInputValues[i] = null;
        }

        return scope.$watch(
          function expressionInputsWatch(scope) {
            var changed = false;

            for (var i = 0, ii = inputExpressions.length; i < ii; i++) {
              var newInputValue = inputExpressions[i](scope);
              if (
                changed ||
                (changed = !expressionInputDirtyCheck(
                  newInputValue,
                  oldInputValueOfValues[i],
                  inputExpressions[i].isPure,
                ))
              ) {
                oldInputValues[i] = newInputValue;
                oldInputValueOfValues[i] =
                  newInputValue && getValueOf(newInputValue);
              }
            }

            if (changed) {
              lastResult = parsedExpression(
                scope,
                undefined,
                undefined,
                oldInputValues,
              );
            }

            return lastResult;
          },
          listener,
          objectEquality,
        );
      }

      function oneTimeWatchDelegate(
        scope,
        listener,
        objectEquality,
        parsedExpression,
      ) {
        var isDone = parsedExpression.literal ? isAllDefined : isDefined;
        var unwatch, lastValue;

        var exp = parsedExpression.$$intercepted || parsedExpression;
        var post = parsedExpression.$$interceptor || ((x) => x);

        var useInputs = parsedExpression.inputs && !exp.inputs;

        // Propagate the literal/inputs/constant attributes
        // ... but not oneTime since we are handling it
        oneTimeWatch.literal = parsedExpression.literal;
        oneTimeWatch.constant = parsedExpression.constant;
        oneTimeWatch.inputs = parsedExpression.inputs;

        // Allow other delegates to run on this wrapped expression
        addWatchDelegate(oneTimeWatch);

        unwatch = scope.$watch(oneTimeWatch, listener, objectEquality);

        return unwatch;

        function unwatchIfDone() {
          if (isDone(lastValue)) {
            unwatch();
          }
        }

        function oneTimeWatch(scope, locals, assign, inputs) {
          lastValue =
            useInputs && inputs
              ? inputs[0]
              : exp(scope, locals, assign, inputs);
          if (isDone(lastValue)) {
            scope.$$postDigest(unwatchIfDone);
          }
          return post(lastValue);
        }
      }

      function isAllDefined(value) {
        var allDefined = true;
        forEach(value, function (val) {
          if (!isDefined(val)) allDefined = false;
        });
        return allDefined;
      }

      function constantWatchDelegate(
        scope,
        listener,
        objectEquality,
        parsedExpression,
      ) {
        var unwatch = scope.$watch(
          function constantWatch(scope) {
            unwatch();
            return parsedExpression(scope);
          },
          listener,
          objectEquality,
        );
        return unwatch;
      }

      function addWatchDelegate(parsedExpression) {
        if (parsedExpression.constant) {
          parsedExpression.$$watchDelegate = constantWatchDelegate;
        } else if (parsedExpression.oneTime) {
          parsedExpression.$$watchDelegate = oneTimeWatchDelegate;
        } else if (parsedExpression.inputs) {
          parsedExpression.$$watchDelegate = inputsWatchDelegate;
        }

        return parsedExpression;
      }

      function chainInterceptors(first, second) {
        function chainedInterceptor(value) {
          return second(first(value));
        }
        chainedInterceptor.$stateful = first.$stateful || second.$stateful;
        chainedInterceptor.$$pure = first.$$pure && second.$$pure;

        return chainedInterceptor;
      }

      function addInterceptor(parsedExpression, interceptorFn) {
        if (!interceptorFn) return parsedExpression;

        // Extract any existing interceptors out of the parsedExpression
        // to ensure the original parsedExpression is always the $$intercepted
        if (parsedExpression.$$interceptor) {
          interceptorFn = chainInterceptors(
            parsedExpression.$$interceptor,
            interceptorFn,
          );
          parsedExpression = parsedExpression.$$intercepted;
        }

        var useInputs = false;

        var fn = function interceptedExpression(scope, locals, assign, inputs) {
          var value =
            useInputs && inputs
              ? inputs[0]
              : parsedExpression(scope, locals, assign, inputs);
          return interceptorFn(value);
        };

        // Maintain references to the interceptor/intercepted
        fn.$$intercepted = parsedExpression;
        fn.$$interceptor = interceptorFn;

        // Propagate the literal/oneTime/constant attributes
        fn.literal = parsedExpression.literal;
        fn.oneTime = parsedExpression.oneTime;
        fn.constant = parsedExpression.constant;

        // Treat the interceptor like filters.
        // If it is not $stateful then only watch its inputs.
        // If the expression itself has no inputs then use the full expression as an input.
        if (!interceptorFn.$stateful) {
          useInputs = !parsedExpression.inputs;
          fn.inputs = parsedExpression.inputs
            ? parsedExpression.inputs
            : [parsedExpression];

          if (!interceptorFn.$$pure) {
            fn.inputs = fn.inputs.map(function (e) {
              // Remove the isPure flag of inputs when it is not absolute because they are now wrapped in a
              // non-pure interceptor function.
              if (e.isPure === PURITY_RELATIVE) {
                return function depurifier(s) {
                  return e(s);
                };
              }
              return e;
            });
          }
        }

        return addWatchDelegate(fn);
      }
    },
  ];
}

function constantWatchDelegate(
  scope,
  listener,
  objectEquality,
  parsedExpression,
) {
  const unwatch = scope.$watch(
    ($scope) => {
      unwatch();
      return parsedExpression($scope);
    },
    listener,
    objectEquality,
  );
  return unwatch;
}

function addWatchDelegate(parsedExpression) {
  if (parsedExpression.constant) {
    parsedExpression.$$watchDelegate = constantWatchDelegate;
  } else if (parsedExpression.oneTime) {
    parsedExpression.$$watchDelegate = oneTimeWatchDelegate;
  } else if (parsedExpression.inputs) {
    parsedExpression.$$watchDelegate = inputsWatchDelegate;
  }

  return parsedExpression;
}

export function inputsWatchDelegate(
  scope,
  listener,
  objectEquality,
  parsedExpression,
) {
  let inputExpressions = parsedExpression.inputs;
  let lastResult;

  if (inputExpressions.length === 1) {
    let oldInputValueOf = expressionInputDirtyCheck; // init to something unique so that equals check fails
    // eslint-disable-next-line prefer-destructuring
    inputExpressions = inputExpressions[0];
    return scope.$watch(
      ($scope) => {
        const newInputValue = inputExpressions($scope);
        if (
          !expressionInputDirtyCheck(
            newInputValue,
            oldInputValueOf,
            inputExpressions.isPure,
          )
        ) {
          lastResult = parsedExpression($scope, undefined, undefined, [
            newInputValue,
          ]);
          oldInputValueOf = newInputValue && getValueOf(newInputValue);
        }
        return lastResult;
      },
      listener,
      objectEquality,
    );
  }

  const oldInputValueOfValues = [];
  const oldInputValues = [];
  for (let i = 0, ii = inputExpressions.length; i < ii; i++) {
    oldInputValueOfValues[i] = expressionInputDirtyCheck; // init to something unique so that equals check fails
    oldInputValues[i] = null;
  }

  return scope.$watch(
    (scope) => {
      let changed = false;

      // eslint-disable-next-line no-plusplus
      for (let i = 0, ii = inputExpressions.length; i < ii; i++) {
        const newInputValue = inputExpressions[i](scope);
        if (
          changed ||
          // eslint-disable-next-line no-cond-assign
          (changed = !expressionInputDirtyCheck(
            newInputValue,
            oldInputValueOfValues[i],
            inputExpressions[i].isPure,
          ))
        ) {
          oldInputValues[i] = newInputValue;
          oldInputValueOfValues[i] = newInputValue && getValueOf(newInputValue);
        }
      }

      if (changed) {
        lastResult = parsedExpression(
          scope,
          undefined,
          undefined,
          oldInputValues,
        );
      }

      return lastResult;
    },
    listener,
    objectEquality,
  );
}

export function oneTimeWatchDelegate(
  scope,
  listener,
  objectEquality,
  parsedExpression,
) {
  const isDone = parsedExpression.literal ? isAllDefined : isDefined;

  let unwatch;
  let lastValue;

  const exp = parsedExpression.$$intercepted || parsedExpression;
  const post = parsedExpression.$$interceptor || ((x) => x);

  const useInputs = parsedExpression.inputs && !exp.inputs;

  // Propagate the literal/inputs/constant attributes
  // ... but not oneTime since we are handling it
  oneTimeWatch.literal = parsedExpression.literal;
  oneTimeWatch.constant = parsedExpression.constant;
  oneTimeWatch.inputs = parsedExpression.inputs;

  // Allow other delegates to run on this wrapped expression
  addWatchDelegate(oneTimeWatch);

  function unwatchIfDone() {
    if (isDone(lastValue)) {
      unwatch();
    }
  }

  function oneTimeWatch(scope, locals, assign, inputs) {
    lastValue =
      useInputs && inputs ? inputs[0] : exp(scope, locals, assign, inputs);
    if (isDone(lastValue)) {
      scope.$$postDigest(unwatchIfDone);
    }
    return post(lastValue);
  }

  unwatch = scope.$watch(oneTimeWatch, listener, objectEquality);

  return unwatch;
}

export function chainInterceptors(first, second) {
  function chainedInterceptor(value) {
    return second(first(value));
  }
  chainedInterceptor.$stateful = first.$stateful || second.$stateful;
  chainedInterceptor.$$pure = first.$$pure && second.$$pure;

  return chainedInterceptor;
}

export function expressionInputDirtyCheck(
  newValue,
  oldValueOfValue,
  compareObjectIdentity,
) {
  if (newValue == null || oldValueOfValue == null) {
    // null/undefined
    return newValue === oldValueOfValue;
  }

  if (typeof newValue === "object") {
    // attempt to convert the value to a primitive type
    // TODO(docs): add a note to docs that by implementing valueOf even objects and arrays can
    //             be cheaply dirty-checked
    newValue = getValueOf(newValue);

    if (typeof newValue === "object" && !compareObjectIdentity) {
      // objects/arrays are not supported - deep-watching them would be too expensive
      return false;
    }

    // fall-through to the primitive equality check
  }

  // Primitive or NaN
  // eslint-disable-next-line no-self-compare
  return (
    newValue === oldValueOfValue ||
    // eslint-disable-next-line no-self-compare
    (newValue !== newValue && oldValueOfValue !== oldValueOfValue)
  );
}

// eslint-disable-next-line class-methods-use-this
export function isAllDefined(value) {
  let allDefined = true;
  forEach(value, (val) => {
    if (!isDefined(val)) allDefined = false;
  });
  return allDefined;
}
