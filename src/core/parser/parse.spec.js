import { AST } from "./ast";
import { Lexer } from "./lexer";
import {
  forEach,
  isFunction,
  sliceArgs,
  csp,
  valueFn,
  extend,
  identity,
} from "../../shared/utils";
import { publishExternalAPI } from "../../public";
import { createInjector } from "../../injector";

describe("parser", () => {
  let $rootScope;
  let $parse;
  let scope;
  let logs = [];

  beforeEach(() => {
    publishExternalAPI().decorator("$exceptionHandler", function () {
      return (exception, cause) => {
        logs.push(exception);
        console.error(exception, cause);
      };
    });
    let injector = createInjector(["ng"]);
    $parse = injector.get("$parse");
    $rootScope = injector.get("$rootScope");
  });

  describe("lexer", () => {
    let lex;

    beforeEach(() => {
      lex = function () {
        const lexer = new Lexer({ csp: false });
        return lexer.lex.apply(lexer, arguments);
      };
    });

    it("should only match number chars with isNumber", () => {
      expect(Lexer.prototype.isNumber("0")).toBe(true);
      expect(Lexer.prototype.isNumber("")).toBeFalsy();
      expect(Lexer.prototype.isNumber(" ")).toBeFalsy();
      expect(Lexer.prototype.isNumber(0)).toBeFalsy();
      expect(Lexer.prototype.isNumber(false)).toBeFalsy();
      expect(Lexer.prototype.isNumber(true)).toBeFalsy();
      expect(Lexer.prototype.isNumber(undefined)).toBeFalsy();
      expect(Lexer.prototype.isNumber(null)).toBeFalsy();
    });

    it("should tokenize a string", () => {
      const tokens = lex("a.bc[22]+1.3|f:'a\\'c':\"d\\\"e\"");
      let i = 0;
      expect(tokens[i].index).toEqual(0);
      expect(tokens[i].text).toEqual("a");

      i++;
      expect(tokens[i].index).toEqual(1);
      expect(tokens[i].text).toEqual(".");

      i++;
      expect(tokens[i].index).toEqual(2);
      expect(tokens[i].text).toEqual("bc");

      i++;
      expect(tokens[i].index).toEqual(4);
      expect(tokens[i].text).toEqual("[");

      i++;
      expect(tokens[i].index).toEqual(5);
      expect(tokens[i].text).toEqual("22");
      expect(tokens[i].value).toEqual(22);
      expect(tokens[i].constant).toEqual(true);

      i++;
      expect(tokens[i].index).toEqual(7);
      expect(tokens[i].text).toEqual("]");

      i++;
      expect(tokens[i].index).toEqual(8);
      expect(tokens[i].text).toEqual("+");

      i++;
      expect(tokens[i].index).toEqual(9);
      expect(tokens[i].text).toEqual("1.3");
      expect(tokens[i].value).toEqual(1.3);
      expect(tokens[i].constant).toEqual(true);

      i++;
      expect(tokens[i].index).toEqual(12);
      expect(tokens[i].text).toEqual("|");

      i++;
      expect(tokens[i].index).toEqual(13);
      expect(tokens[i].text).toEqual("f");

      i++;
      expect(tokens[i].index).toEqual(14);
      expect(tokens[i].text).toEqual(":");

      i++;
      expect(tokens[i].index).toEqual(15);
      expect(tokens[i].value).toEqual("a'c");

      i++;
      expect(tokens[i].index).toEqual(21);
      expect(tokens[i].text).toEqual(":");

      i++;
      expect(tokens[i].index).toEqual(22);
      expect(tokens[i].value).toEqual('d"e');
    });

    it("should tokenize identifiers with spaces around dots the same as without spaces", () => {
      function getText(t) {
        return t.text;
      }
      const spaces = lex("foo. bar . baz").map(getText);
      const noSpaces = lex("foo.bar.baz").map(getText);

      expect(spaces).toEqual(noSpaces);
    });

    it("should use callback functions to know when an identifier is valid", () => {
      function getText(t) {
        return t.text;
      }
      const isIdentifierStart = jasmine.createSpy("start");
      const isIdentifierContinue = jasmine.createSpy("continue");
      isIdentifierStart.and.returnValue(true);
      const lex = new Lexer({
        csp: false,
        isIdentifierStart,
        isIdentifierContinue,
      });

      isIdentifierContinue.and.returnValue(true);
      let tokens = lex.lex("πΣε").map(getText);
      expect(tokens).toEqual(["πΣε"]);

      isIdentifierContinue.and.returnValue(false);
      tokens = lex.lex("πΣε").map(getText);
      expect(tokens).toEqual(["π", "Σ", "ε"]);
    });

    it("should send the unicode characters and code points", () => {
      function getText(t) {
        return t.text;
      }
      const isIdentifierStart = jasmine.createSpy("start");
      const isIdentifierContinue = jasmine.createSpy("continue");
      isIdentifierStart.and.returnValue(true);
      isIdentifierContinue.and.returnValue(true);
      const lex = new Lexer({
        csp: false,
        isIdentifierStart,
        isIdentifierContinue,
      });
      const tokens = lex.lex("\uD801\uDC37\uD852\uDF62\uDBFF\uDFFF");
      expect(isIdentifierStart).toHaveBeenCalledTimes(1);
      expect(isIdentifierStart.calls.argsFor(0)).toEqual([
        "\uD801\uDC37",
        0x10437,
      ]);
      expect(isIdentifierContinue).toHaveBeenCalledTimes(2);
      expect(isIdentifierContinue.calls.argsFor(0)).toEqual([
        "\uD852\uDF62",
        0x24b62,
      ]);
      expect(isIdentifierContinue.calls.argsFor(1)).toEqual([
        "\uDBFF\uDFFF",
        0x10ffff,
      ]);
    });

    it("should tokenize undefined", () => {
      const tokens = lex("undefined");
      const i = 0;
      expect(tokens[i].index).toEqual(0);
      expect(tokens[i].text).toEqual("undefined");
    });

    it("should tokenize quoted string", () => {
      const str = "['\\'', \"\\\"\"]";
      const tokens = lex(str);

      expect(tokens[1].index).toEqual(1);
      expect(tokens[1].value).toEqual("'");

      expect(tokens[3].index).toEqual(7);
      expect(tokens[3].value).toEqual('"');
    });

    it("should tokenize escaped quoted string", () => {
      const str = '"\\"\\n\\f\\r\\t\\v\\u00A0"';
      const tokens = lex(str);

      expect(tokens[0].value).toEqual('"\n\f\r\t\v\u00A0');
    });

    it("should tokenize unicode", () => {
      const tokens = lex('"\\u00A0"');
      expect(tokens.length).toEqual(1);
      expect(tokens[0].value).toEqual("\u00a0");
    });

    it("should ignore whitespace", () => {
      const tokens = lex("a \t \n \r b");
      expect(tokens[0].text).toEqual("a");
      expect(tokens[1].text).toEqual("b");
    });

    it("should tokenize relation and equality", () => {
      const tokens = lex("! == != < > <= >= === !==");
      expect(tokens[0].text).toEqual("!");
      expect(tokens[1].text).toEqual("==");
      expect(tokens[2].text).toEqual("!=");
      expect(tokens[3].text).toEqual("<");
      expect(tokens[4].text).toEqual(">");
      expect(tokens[5].text).toEqual("<=");
      expect(tokens[6].text).toEqual(">=");
      expect(tokens[7].text).toEqual("===");
      expect(tokens[8].text).toEqual("!==");
    });

    it("should tokenize logical and ternary", () => {
      const tokens = lex("&& || ? :");
      expect(tokens[0].text).toEqual("&&");
      expect(tokens[1].text).toEqual("||");
      expect(tokens[2].text).toEqual("?");
      expect(tokens[3].text).toEqual(":");
    });

    it("should tokenize statements", () => {
      const tokens = lex("a;b;");
      expect(tokens[0].text).toEqual("a");
      expect(tokens[1].text).toEqual(";");
      expect(tokens[2].text).toEqual("b");
      expect(tokens[3].text).toEqual(";");
    });

    it("should tokenize function invocation", () => {
      const tokens = lex("a()");
      expect(tokens.map((t) => t.text)).toEqual(["a", "(", ")"]);
    });

    it("should tokenize method invocation", () => {
      const tokens = lex("a.b.c (d) - e.f()");
      expect(tokens.map((t) => t.text)).toEqual([
        "a",
        ".",
        "b",
        ".",
        "c",
        "(",
        "d",
        ")",
        "-",
        "e",
        ".",
        "f",
        "(",
        ")",
      ]);
    });

    it("should tokenize number", () => {
      const tokens = lex("0.5");
      expect(tokens[0].value).toEqual(0.5);
    });

    it("should tokenize negative number", () => {
      let value = $rootScope.$eval("-0.5");
      expect(value).toEqual(-0.5);

      value = $rootScope.$eval("{a:-0.5}");
      expect(value).toEqual({ a: -0.5 });
    });

    it("should tokenize number with exponent", () => {
      let tokens = lex("0.5E-10");
      expect(tokens[0].value).toEqual(0.5e-10);
      expect($rootScope.$eval("0.5E-10")).toEqual(0.5e-10);

      tokens = lex("0.5E+10");
      expect(tokens[0].value).toEqual(0.5e10);
    });

    it("should throws exception for invalid exponent", () => {
      expect(() => {
        lex("0.5E-");
      }).toThrowError(/lexerr/);

      expect(() => {
        lex("0.5E-A");
      }).toThrowError(/lexerr/);
    });

    it("should tokenize number starting with a dot", () => {
      const tokens = lex(".5");
      expect(tokens[0].value).toEqual(0.5);
    });

    it("should throw error on invalid unicode", () => {
      expect(() => {
        lex("'\\u1''bla'");
      }).toThrowError(/lexerr/);
    });
  });

  describe("ast", () => {
    let createAst;

    beforeEach(() => {
      /* global AST: false */
      createAst = function () {
        const lexer = new Lexer({ csp: false });
        const ast = new AST(lexer, {
          csp: false,
          literals: {
            true: true,
            false: false,
            undefined: undefined,
            null: null,
          },
        });
        return ast.ast.apply(ast, arguments);
      };
    });

    it("should handle an empty list of tokens", () => {
      expect(createAst("")).toEqual({ type: "Program", body: [] });
    });

    it("should understand identifiers", () => {
      expect(createAst("foo")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: { type: "Identifier", name: "foo" },
          },
        ],
      });
    });

    it("should understand non-computed member expressions", () => {
      expect(createAst("foo.bar")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "MemberExpression",
              object: { type: "Identifier", name: "foo" },
              property: { type: "Identifier", name: "bar" },
              computed: false,
            },
          },
        ],
      });
    });

    it("should associate non-computed member expressions left-to-right", () => {
      expect(createAst("foo.bar.baz")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "MemberExpression",
              object: {
                type: "MemberExpression",
                object: { type: "Identifier", name: "foo" },
                property: { type: "Identifier", name: "bar" },
                computed: false,
              },
              property: { type: "Identifier", name: "baz" },
              computed: false,
            },
          },
        ],
      });
    });

    it("should understand computed member expressions", () => {
      expect(createAst("foo[bar]")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "MemberExpression",
              object: { type: "Identifier", name: "foo" },
              property: { type: "Identifier", name: "bar" },
              computed: true,
            },
          },
        ],
      });
    });

    it("should associate computed member expressions left-to-right", () => {
      expect(createAst("foo[bar][baz]")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "MemberExpression",
              object: {
                type: "MemberExpression",
                object: { type: "Identifier", name: "foo" },
                property: { type: "Identifier", name: "bar" },
                computed: true,
              },
              property: { type: "Identifier", name: "baz" },
              computed: true,
            },
          },
        ],
      });
    });

    it("should understand call expressions", () => {
      expect(createAst("foo()")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "foo" },
              arguments: [],
            },
          },
        ],
      });
    });

    it("should parse call expression arguments", () => {
      expect(createAst("foo(bar, baz)")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "foo" },
              arguments: [
                { type: "Identifier", name: "bar" },
                { type: "Identifier", name: "baz" },
              ],
            },
          },
        ],
      });
    });

    it("should parse call expression left-to-right", () => {
      expect(createAst("foo(bar, baz)(man, shell)")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: {
                type: "CallExpression",
                callee: { type: "Identifier", name: "foo" },
                arguments: [
                  { type: "Identifier", name: "bar" },
                  { type: "Identifier", name: "baz" },
                ],
              },
              arguments: [
                { type: "Identifier", name: "man" },
                { type: "Identifier", name: "shell" },
              ],
            },
          },
        ],
      });
    });

    it("should keep the context when having superfluous parenthesis", () => {
      expect(createAst("(foo)(bar, baz)")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "foo" },
              arguments: [
                { type: "Identifier", name: "bar" },
                { type: "Identifier", name: "baz" },
              ],
            },
          },
        ],
      });
    });

    it("should treat member expressions and call expression with the same precedence", () => {
      expect(createAst("foo.bar[baz]()")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: {
                type: "MemberExpression",
                object: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "foo" },
                  property: { type: "Identifier", name: "bar" },
                  computed: false,
                },
                property: { type: "Identifier", name: "baz" },
                computed: true,
              },
              arguments: [],
            },
          },
        ],
      });
      expect(createAst("foo[bar]().baz")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "MemberExpression",
              object: {
                type: "CallExpression",
                callee: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "foo" },
                  property: { type: "Identifier", name: "bar" },
                  computed: true,
                },
                arguments: [],
              },
              property: { type: "Identifier", name: "baz" },
              computed: false,
            },
          },
        ],
      });
      expect(createAst("foo().bar[baz]")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "MemberExpression",
              object: {
                type: "MemberExpression",
                object: {
                  type: "CallExpression",
                  callee: { type: "Identifier", name: "foo" },
                  arguments: [],
                },
                property: { type: "Identifier", name: "bar" },
                computed: false,
              },
              property: { type: "Identifier", name: "baz" },
              computed: true,
            },
          },
        ],
      });
    });

    it("should understand literals", () => {
      // In a strict sense, `undefined` is not a literal but an identifier
      forEach(
        {
          123: 123,
          '"123"': "123",
          true: true,
          false: false,
          null: null,
          undefined: undefined,
        },
        (value, expression) => {
          expect(createAst(expression)).toEqual({
            type: "Program",
            body: [
              {
                type: "ExpressionStatement",
                expression: { type: "Literal", value },
              },
            ],
          });
        },
      );
    });

    it("should understand the `this` expression", () => {
      expect(createAst("this")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: { type: "ThisExpression" },
          },
        ],
      });
    });

    it("should understand the `$locals` expression", () => {
      expect(createAst("$locals")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: { type: "LocalsExpression" },
          },
        ],
      });
    });

    it("should not confuse `this`, `$locals`, `undefined`, `true`, `false`, `null` when used as identifiers", () => {
      forEach(
        ["this", "$locals", "undefined", "true", "false", "null"],
        (identifier) => {
          expect(createAst(`foo.${identifier}`)).toEqual({
            type: "Program",
            body: [
              {
                type: "ExpressionStatement",
                expression: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "foo" },
                  property: { type: "Identifier", name: identifier },
                  computed: false,
                },
              },
            ],
          });
        },
      );
    });

    it("should throw when trying to use non-identifiers as identifiers", () => {
      expect(() => {
        createAst("foo.)");
      }).toThrowError(/syntax/);
    });

    it("should throw when all tokens are not consumed", () => {
      expect(() => {
        createAst("foo bar");
      }).toThrowError(/syntax/);
    });

    it("should understand the unary operators `-`, `+` and `!`", () => {
      forEach(["-", "+", "!"], (operator) => {
        expect(createAst(`${operator}foo`)).toEqual({
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "UnaryExpression",
                operator,
                prefix: true,
                argument: { type: "Identifier", name: "foo" },
              },
            },
          ],
        });
      });
    });

    it("should handle all unary operators with the same precedence", () => {
      forEach(
        [
          ["+", "-", "!"],
          ["-", "!", "+"],
          ["!", "+", "-"],
        ],
        (operators) => {
          expect(createAst(`${operators.join("")}foo`)).toEqual({
            type: "Program",
            body: [
              {
                type: "ExpressionStatement",
                expression: {
                  type: "UnaryExpression",
                  operator: operators[0],
                  prefix: true,
                  argument: {
                    type: "UnaryExpression",
                    operator: operators[1],
                    prefix: true,
                    argument: {
                      type: "UnaryExpression",
                      operator: operators[2],
                      prefix: true,
                      argument: { type: "Identifier", name: "foo" },
                    },
                  },
                },
              },
            ],
          });
        },
      );
    });

    it("should be able to understand binary operators", () => {
      forEach(
        [
          "*",
          "/",
          "%",
          "+",
          "-",
          "<",
          ">",
          "<=",
          ">=",
          "==",
          "!=",
          "===",
          "!==",
        ],
        (operator) => {
          expect(createAst(`foo${operator}bar`)).toEqual({
            type: "Program",
            body: [
              {
                type: "ExpressionStatement",
                expression: {
                  type: "BinaryExpression",
                  operator,
                  left: { type: "Identifier", name: "foo" },
                  right: { type: "Identifier", name: "bar" },
                },
              },
            ],
          });
        },
      );
    });

    it("should associate binary operators with the same precedence left-to-right", () => {
      const operatorsByPrecedence = [
        ["*", "/", "%"],
        ["+", "-"],
        ["<", ">", "<=", ">="],
        ["==", "!=", "===", "!=="],
      ];
      forEach(operatorsByPrecedence, (operators) => {
        forEach(operators, (op1) => {
          forEach(operators, (op2) => {
            expect(createAst(`foo${op1}bar${op2}baz`)).toEqual({
              type: "Program",
              body: [
                {
                  type: "ExpressionStatement",
                  expression: {
                    type: "BinaryExpression",
                    operator: op2,
                    left: {
                      type: "BinaryExpression",
                      operator: op1,
                      left: { type: "Identifier", name: "foo" },
                      right: { type: "Identifier", name: "bar" },
                    },
                    right: { type: "Identifier", name: "baz" },
                  },
                },
              ],
            });
          });
        });
      });
    });

    it("should give higher precedence to member calls than to unary expressions", () => {
      forEach(["!", "+", "-"], (operator) => {
        expect(createAst(`${operator}foo()`)).toEqual({
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "UnaryExpression",
                operator,
                prefix: true,
                argument: {
                  type: "CallExpression",
                  callee: { type: "Identifier", name: "foo" },
                  arguments: [],
                },
              },
            },
          ],
        });
        expect(createAst(`${operator}foo.bar`)).toEqual({
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "UnaryExpression",
                operator,
                prefix: true,
                argument: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "foo" },
                  property: { type: "Identifier", name: "bar" },
                  computed: false,
                },
              },
            },
          ],
        });
        expect(createAst(`${operator}foo[bar]`)).toEqual({
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "UnaryExpression",
                operator,
                prefix: true,
                argument: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "foo" },
                  property: { type: "Identifier", name: "bar" },
                  computed: true,
                },
              },
            },
          ],
        });
      });
    });

    it("should give higher precedence to unary operators over multiplicative operators", () => {
      forEach(["!", "+", "-"], (op1) => {
        forEach(["*", "/", "%"], (op2) => {
          expect(createAst(`${op1}foo${op2}${op1}bar`)).toEqual({
            type: "Program",
            body: [
              {
                type: "ExpressionStatement",
                expression: {
                  type: "BinaryExpression",
                  operator: op2,
                  left: {
                    type: "UnaryExpression",
                    operator: op1,
                    prefix: true,
                    argument: { type: "Identifier", name: "foo" },
                  },
                  right: {
                    type: "UnaryExpression",
                    operator: op1,
                    prefix: true,
                    argument: { type: "Identifier", name: "bar" },
                  },
                },
              },
            ],
          });
        });
      });
    });

    it("should give binary operators their right precedence", () => {
      const operatorsByPrecedence = [
        ["*", "/", "%"],
        ["+", "-"],
        ["<", ">", "<=", ">="],
        ["==", "!=", "===", "!=="],
      ];
      for (let i = 0; i < operatorsByPrecedence.length - 1; ++i) {
        forEach(operatorsByPrecedence[i], (op1) => {
          forEach(operatorsByPrecedence[i + 1], (op2) => {
            expect(createAst(`foo${op1}bar${op2}baz${op1}man`)).toEqual({
              type: "Program",
              body: [
                {
                  type: "ExpressionStatement",
                  expression: {
                    type: "BinaryExpression",
                    operator: op2,
                    left: {
                      type: "BinaryExpression",
                      operator: op1,
                      left: { type: "Identifier", name: "foo" },
                      right: { type: "Identifier", name: "bar" },
                    },
                    right: {
                      type: "BinaryExpression",
                      operator: op1,
                      left: { type: "Identifier", name: "baz" },
                      right: { type: "Identifier", name: "man" },
                    },
                  },
                },
              ],
            });
          });
        });
      }
    });

    it("should understand logical operators", () => {
      forEach(["||", "&&"], (operator) => {
        expect(createAst(`foo${operator}bar`)).toEqual({
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "LogicalExpression",
                operator,
                left: { type: "Identifier", name: "foo" },
                right: { type: "Identifier", name: "bar" },
              },
            },
          ],
        });
      });
    });

    it("should associate logical operators left-to-right", () => {
      forEach(["||", "&&"], (op) => {
        expect(createAst(`foo${op}bar${op}baz`)).toEqual({
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "LogicalExpression",
                operator: op,
                left: {
                  type: "LogicalExpression",
                  operator: op,
                  left: { type: "Identifier", name: "foo" },
                  right: { type: "Identifier", name: "bar" },
                },
                right: { type: "Identifier", name: "baz" },
              },
            },
          ],
        });
      });
    });

    it("should understand ternary operators", () => {
      expect(createAst("foo?bar:baz")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ConditionalExpression",
              test: { type: "Identifier", name: "foo" },
              alternate: { type: "Identifier", name: "bar" },
              consequent: { type: "Identifier", name: "baz" },
            },
          },
        ],
      });
    });

    it("should associate the conditional operator right-to-left", () => {
      expect(createAst("foo0?foo1:foo2?bar0?bar1:bar2:man0?man1:man2")).toEqual(
        {
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "ConditionalExpression",
                test: { type: "Identifier", name: "foo0" },
                alternate: { type: "Identifier", name: "foo1" },
                consequent: {
                  type: "ConditionalExpression",
                  test: { type: "Identifier", name: "foo2" },
                  alternate: {
                    type: "ConditionalExpression",
                    test: { type: "Identifier", name: "bar0" },
                    alternate: { type: "Identifier", name: "bar1" },
                    consequent: { type: "Identifier", name: "bar2" },
                  },
                  consequent: {
                    type: "ConditionalExpression",
                    test: { type: "Identifier", name: "man0" },
                    alternate: { type: "Identifier", name: "man1" },
                    consequent: { type: "Identifier", name: "man2" },
                  },
                },
              },
            },
          ],
        },
      );
    });

    it("should understand assignment operator", () => {
      // Currently, only `=` is supported
      expect(createAst("foo=bar")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "AssignmentExpression",
              left: { type: "Identifier", name: "foo" },
              right: { type: "Identifier", name: "bar" },
              operator: "=",
            },
          },
        ],
      });
    });

    it("should associate assignments right-to-left", () => {
      // Currently, only `=` is supported
      expect(createAst("foo=bar=man")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "AssignmentExpression",
              left: { type: "Identifier", name: "foo" },
              right: {
                type: "AssignmentExpression",
                left: { type: "Identifier", name: "bar" },
                right: { type: "Identifier", name: "man" },
                operator: "=",
              },
              operator: "=",
            },
          },
        ],
      });
    });

    it("should give higher precedence to equality than to the logical `and` operator", () => {
      forEach(["==", "!=", "===", "!=="], (operator) => {
        expect(createAst(`foo${operator}bar && man${operator}shell`)).toEqual({
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "LogicalExpression",
                operator: "&&",
                left: {
                  type: "BinaryExpression",
                  operator,
                  left: { type: "Identifier", name: "foo" },
                  right: { type: "Identifier", name: "bar" },
                },
                right: {
                  type: "BinaryExpression",
                  operator,
                  left: { type: "Identifier", name: "man" },
                  right: { type: "Identifier", name: "shell" },
                },
              },
            },
          ],
        });
      });
    });

    it("should give higher precedence to logical `and` than to logical `or`", () => {
      expect(createAst("foo&&bar||man&&shell")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "LogicalExpression",
              operator: "||",
              left: {
                type: "LogicalExpression",
                operator: "&&",
                left: { type: "Identifier", name: "foo" },
                right: { type: "Identifier", name: "bar" },
              },
              right: {
                type: "LogicalExpression",
                operator: "&&",
                left: { type: "Identifier", name: "man" },
                right: { type: "Identifier", name: "shell" },
              },
            },
          },
        ],
      });
    });

    it("should give higher precedence to the logical `or` than to the conditional operator", () => {
      expect(createAst("foo||bar?man:shell")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ConditionalExpression",
              test: {
                type: "LogicalExpression",
                operator: "||",
                left: { type: "Identifier", name: "foo" },
                right: { type: "Identifier", name: "bar" },
              },
              alternate: { type: "Identifier", name: "man" },
              consequent: { type: "Identifier", name: "shell" },
            },
          },
        ],
      });
    });

    it("should give higher precedence to the conditional operator than to assignment operators", () => {
      expect(createAst("foo=bar?man:shell")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "AssignmentExpression",
              left: { type: "Identifier", name: "foo" },
              right: {
                type: "ConditionalExpression",
                test: { type: "Identifier", name: "bar" },
                alternate: { type: "Identifier", name: "man" },
                consequent: { type: "Identifier", name: "shell" },
              },
              operator: "=",
            },
          },
        ],
      });
    });

    it("should understand array literals", () => {
      expect(createAst("[]")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ArrayExpression",
              elements: [],
            },
          },
        ],
      });
      expect(createAst("[foo]")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ArrayExpression",
              elements: [{ type: "Identifier", name: "foo" }],
            },
          },
        ],
      });
      expect(createAst("[foo,]")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ArrayExpression",
              elements: [{ type: "Identifier", name: "foo" }],
            },
          },
        ],
      });
      expect(createAst("[foo,bar,man,shell]")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ArrayExpression",
              elements: [
                { type: "Identifier", name: "foo" },
                { type: "Identifier", name: "bar" },
                { type: "Identifier", name: "man" },
                { type: "Identifier", name: "shell" },
              ],
            },
          },
        ],
      });
      expect(createAst("[foo,bar,man,shell,]")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ArrayExpression",
              elements: [
                { type: "Identifier", name: "foo" },
                { type: "Identifier", name: "bar" },
                { type: "Identifier", name: "man" },
                { type: "Identifier", name: "shell" },
              ],
            },
          },
        ],
      });
    });

    it("should understand objects", () => {
      expect(createAst("{}")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ObjectExpression",
              properties: [],
            },
          },
        ],
      });
      expect(createAst("{foo: bar}")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Identifier", name: "foo" },
                  computed: false,
                  value: { type: "Identifier", name: "bar" },
                },
              ],
            },
          },
        ],
      });
      expect(createAst("{foo: bar,}")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Identifier", name: "foo" },
                  computed: false,
                  value: { type: "Identifier", name: "bar" },
                },
              ],
            },
          },
        ],
      });
      expect(createAst('{foo: bar, "man": "shell", 42: 23}')).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Identifier", name: "foo" },
                  computed: false,
                  value: { type: "Identifier", name: "bar" },
                },
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Literal", value: "man" },
                  computed: false,
                  value: { type: "Literal", value: "shell" },
                },
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Literal", value: 42 },
                  computed: false,
                  value: { type: "Literal", value: 23 },
                },
              ],
            },
          },
        ],
      });
      expect(createAst('{foo: bar, "man": "shell", 42: 23,}')).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Identifier", name: "foo" },
                  computed: false,
                  value: { type: "Identifier", name: "bar" },
                },
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Literal", value: "man" },
                  computed: false,
                  value: { type: "Literal", value: "shell" },
                },
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Literal", value: 42 },
                  computed: false,
                  value: { type: "Literal", value: 23 },
                },
              ],
            },
          },
        ],
      });
    });

    it("should understand ES6 object initializer", () => {
      // Shorthand properties definitions.
      expect(createAst("{x, y, z}")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Identifier", name: "x" },
                  computed: false,
                  value: { type: "Identifier", name: "x" },
                },
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Identifier", name: "y" },
                  computed: false,
                  value: { type: "Identifier", name: "y" },
                },
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Identifier", name: "z" },
                  computed: false,
                  value: { type: "Identifier", name: "z" },
                },
              ],
            },
          },
        ],
      });
      expect(() => {
        createAst('{"foo"}');
      }).toThrow();

      // Computed properties
      expect(createAst("{[x]: x}")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Identifier", name: "x" },
                  computed: true,
                  value: { type: "Identifier", name: "x" },
                },
              ],
            },
          },
        ],
      });
      expect(createAst("{[x + 1]: x}")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  key: {
                    type: "BinaryExpression",
                    operator: "+",
                    left: { type: "Identifier", name: "x" },
                    right: { type: "Literal", value: 1 },
                  },
                  computed: true,
                  value: { type: "Identifier", name: "x" },
                },
              ],
            },
          },
        ],
      });
    });

    it("should understand multiple expressions", () => {
      expect(createAst("foo = bar; man = shell")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "AssignmentExpression",
              left: { type: "Identifier", name: "foo" },
              right: { type: "Identifier", name: "bar" },
              operator: "=",
            },
          },
          {
            type: "ExpressionStatement",
            expression: {
              type: "AssignmentExpression",
              left: { type: "Identifier", name: "man" },
              right: { type: "Identifier", name: "shell" },
              operator: "=",
            },
          },
        ],
      });
    });

    // This is non-standard syntax
    it("should understand filters", () => {
      expect(createAst("foo | bar")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "bar" },
              arguments: [{ type: "Identifier", name: "foo" }],
              filter: true,
            },
          },
        ],
      });
    });

    it("should understand filters with extra parameters", () => {
      expect(createAst("foo | bar:baz")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "bar" },
              arguments: [
                { type: "Identifier", name: "foo" },
                { type: "Identifier", name: "baz" },
              ],
              filter: true,
            },
          },
        ],
      });
    });

    it("should associate filters right-to-left", () => {
      expect(createAst("foo | bar:man | shell")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "shell" },
              arguments: [
                {
                  type: "CallExpression",
                  callee: { type: "Identifier", name: "bar" },
                  arguments: [
                    { type: "Identifier", name: "foo" },
                    { type: "Identifier", name: "man" },
                  ],
                  filter: true,
                },
              ],
              filter: true,
            },
          },
        ],
      });
    });

    it("should give higher precedence to assignments over filters", () => {
      expect(createAst("foo=bar | man")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "man" },
              arguments: [
                {
                  type: "AssignmentExpression",
                  left: { type: "Identifier", name: "foo" },
                  right: { type: "Identifier", name: "bar" },
                  operator: "=",
                },
              ],
              filter: true,
            },
          },
        ],
      });
    });

    it("should accept expression as filters parameters", () => {
      expect(createAst("foo | bar:baz=man")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "bar" },
              arguments: [
                { type: "Identifier", name: "foo" },
                {
                  type: "AssignmentExpression",
                  left: { type: "Identifier", name: "baz" },
                  right: { type: "Identifier", name: "man" },
                  operator: "=",
                },
              ],
              filter: true,
            },
          },
        ],
      });
    });

    it("should accept expression as computer members", () => {
      expect(createAst("foo[a = 1]")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "MemberExpression",
              object: { type: "Identifier", name: "foo" },
              property: {
                type: "AssignmentExpression",
                left: { type: "Identifier", name: "a" },
                right: { type: "Literal", value: 1 },
                operator: "=",
              },
              computed: true,
            },
          },
        ],
      });
    });

    it("should accept expression in function arguments", () => {
      expect(createAst("foo(a = 1)")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "foo" },
              arguments: [
                {
                  type: "AssignmentExpression",
                  left: { type: "Identifier", name: "a" },
                  right: { type: "Literal", value: 1 },
                  operator: "=",
                },
              ],
            },
          },
        ],
      });
    });

    it("should accept expression as part of ternary operators", () => {
      expect(createAst("foo || bar ? man = 1 : shell = 1")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ConditionalExpression",
              test: {
                type: "LogicalExpression",
                operator: "||",
                left: { type: "Identifier", name: "foo" },
                right: { type: "Identifier", name: "bar" },
              },
              alternate: {
                type: "AssignmentExpression",
                left: { type: "Identifier", name: "man" },
                right: { type: "Literal", value: 1 },
                operator: "=",
              },
              consequent: {
                type: "AssignmentExpression",
                left: { type: "Identifier", name: "shell" },
                right: { type: "Literal", value: 1 },
                operator: "=",
              },
            },
          },
        ],
      });
    });

    it("should accept expression as part of array literals", () => {
      expect(createAst("[foo = 1]")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ArrayExpression",
              elements: [
                {
                  type: "AssignmentExpression",
                  left: { type: "Identifier", name: "foo" },
                  right: { type: "Literal", value: 1 },
                  operator: "=",
                },
              ],
            },
          },
        ],
      });
    });

    it("should accept expression as part of object literals", () => {
      expect(createAst("{foo: bar = 1}")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  key: { type: "Identifier", name: "foo" },
                  computed: false,
                  value: {
                    type: "AssignmentExpression",
                    left: { type: "Identifier", name: "bar" },
                    right: { type: "Literal", value: 1 },
                    operator: "=",
                  },
                },
              ],
            },
          },
        ],
      });
    });

    it("should be possible to use parenthesis to indicate precedence", () => {
      expect(createAst("(foo + bar).man")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "MemberExpression",
              object: {
                type: "BinaryExpression",
                operator: "+",
                left: { type: "Identifier", name: "foo" },
                right: { type: "Identifier", name: "bar" },
              },
              property: { type: "Identifier", name: "man" },
              computed: false,
            },
          },
        ],
      });
    });

    it("should skip empty expressions", () => {
      expect(createAst("foo;;;;bar")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: { type: "Identifier", name: "foo" },
          },
          {
            type: "ExpressionStatement",
            expression: { type: "Identifier", name: "bar" },
          },
        ],
      });
      expect(createAst(";foo")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: { type: "Identifier", name: "foo" },
          },
        ],
      });
      expect(createAst("foo;")).toEqual({
        type: "Program",
        body: [
          {
            type: "ExpressionStatement",
            expression: { type: "Identifier", name: "foo" },
          },
        ],
      });
      expect(createAst(";;;;")).toEqual({ type: "Program", body: [] });
      expect(createAst("")).toEqual({ type: "Program", body: [] });
    });
  });

  let filterProvider;

  forEach([true, false], (cspEnabled) => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider, $parseProvider) {
          filterProvider = $filterProvider;
          $parseProvider.addLiteral("Infinity", Infinity);
          csp().noUnsafeEval = cspEnabled;
        },
      ]).invoke((_$rootScope_) => {
        $rootScope = _$rootScope_;
      });
    });

    it(`should allow extending literals with csp ${cspEnabled}`, () => {
      expect($rootScope.$eval("Infinity")).toEqual(Infinity);
      expect($rootScope.$eval("-Infinity")).toEqual(-Infinity);
      expect(() => {
        $rootScope.$eval("Infinity = 1");
      }).toThrow();
      expect($rootScope.$eval("Infinity")).toEqual(Infinity);
    });
  });

  forEach([true, false], (cspEnabled) => {
    describe(`csp: ${cspEnabled}`, () => {
      beforeEach(() => {
        createInjector([
          "ng",
          function ($filterProvider) {
            filterProvider = $filterProvider;
            csp().noUnsafeEval = cspEnabled;
          },
        ]).invoke((_$rootScope_) => {
          scope = _$rootScope_;
        });
      });

      it("should parse expressions", () => {
        expect(scope.$eval("-1")).toEqual(-1);
        expect(scope.$eval("1 + 2.5")).toEqual(3.5);
        expect(scope.$eval("1 + -2.5")).toEqual(-1.5);
        expect(scope.$eval("1+2*3/4")).toEqual(1 + (2 * 3) / 4);
        expect(scope.$eval("0--1+1.5")).toEqual(0 - -1 + 1.5);
        expect(scope.$eval("-0--1++2*-3/-4")).toEqual(-0 - -1 + (+2 * -3) / -4);
        expect(scope.$eval("1/2*3")).toEqual((1 / 2) * 3);
      });

      it("should parse unary", () => {
        expect(scope.$eval("+1")).toEqual(+1);
        expect(scope.$eval("-1")).toEqual(-1);
        expect(scope.$eval("+'1'")).toEqual(+"1");
        expect(scope.$eval("-'1'")).toEqual(-"1");
        expect(scope.$eval("+undefined")).toEqual(0);

        // Note: don't change toEqual to toBe as toBe collapses 0 & -0.
        expect(scope.$eval("-undefined")).toEqual(-0);
        expect(scope.$eval("+null")).toEqual(+null);
        expect(scope.$eval("-null")).toEqual(-null);
        expect(scope.$eval("+false")).toEqual(+false);
        expect(scope.$eval("-false")).toEqual(-false);
        expect(scope.$eval("+true")).toEqual(+true);
        expect(scope.$eval("-true")).toEqual(-true);
      });

      it("should parse comparison", () => {
        /* eslint-disable eqeqeq, no-self-compare */
        expect(scope.$eval("false")).toBeFalsy();
        expect(scope.$eval("!true")).toBeFalsy();
        expect(scope.$eval("1==1")).toBeTruthy();
        expect(scope.$eval("1==true")).toBeTruthy();
        expect(scope.$eval("1!=true")).toBeFalsy();
        expect(scope.$eval("1===1")).toBeTruthy();
        expect(scope.$eval("1==='1'")).toBeFalsy();
        expect(scope.$eval("1===true")).toBeFalsy();
        expect(scope.$eval("'true'===true")).toBeFalsy();
        expect(scope.$eval("1!==2")).toBeTruthy();
        expect(scope.$eval("1!=='1'")).toBeTruthy();
        expect(scope.$eval("1!=2")).toBeTruthy();
        expect(scope.$eval("1<2")).toBeTruthy();
        expect(scope.$eval("1<=1")).toBeTruthy();
        expect(scope.$eval("1>2")).toEqual(1 > 2);
        expect(scope.$eval("2>=1")).toEqual(2 >= 1);
        expect(scope.$eval("true==2<3")).toEqual(2 < 3 == true);
        expect(scope.$eval("true===2<3")).toEqual(2 < 3 === true);

        expect(scope.$eval("true===3===3")).toEqual((true === 3) === 3);
        expect(scope.$eval("3===3===true")).toEqual((3 === 3) === true);
        expect(scope.$eval("3 >= 3 > 2")).toEqual(3 >= 3 > 2);
        /* eslint-enable */
      });

      it("should parse logical", () => {
        expect(scope.$eval("0&&2")).toEqual(0 && 2);
        expect(scope.$eval("0||2")).toEqual(0 || 2);
        expect(scope.$eval("0||1&&2")).toEqual(0 || (1 && 2));
        expect(scope.$eval("true&&a")).toEqual(true && undefined);
        expect(scope.$eval("true&&a()")).toEqual(true && undefined);
        expect(scope.$eval("true&&a()()")).toEqual(true && undefined);
        expect(scope.$eval("true&&a.b")).toEqual(true && undefined);
        expect(scope.$eval("true&&a.b.c")).toEqual(true && undefined);
        expect(scope.$eval("false||a")).toEqual(false || undefined);
        expect(scope.$eval("false||a()")).toEqual(false || undefined);
        expect(scope.$eval("false||a()()")).toEqual(false || undefined);
        expect(scope.$eval("false||a.b")).toEqual(false || undefined);
        expect(scope.$eval("false||a.b.c")).toEqual(false || undefined);
      });

      it("should parse ternary", () => {
        const returnTrue = (scope.returnTrue = function () {
          return true;
        });
        const returnFalse = (scope.returnFalse = function () {
          return false;
        });
        const returnString = (scope.returnString = function () {
          return "asd";
        });
        const returnInt = (scope.returnInt = function () {
          return 123;
        });
        const identity = (scope.identity = function (x) {
          return x;
        });

        // Simple.
        expect(scope.$eval("0?0:2")).toEqual(0 ? 0 : 2);
        expect(scope.$eval("1?0:2")).toEqual(1 ? 0 : 2);

        // Nested on the left.
        expect(scope.$eval("0?0?0:0:2")).toEqual(0 ? (0 ? 0 : 0) : 2);
        expect(scope.$eval("1?0?0:0:2")).toEqual(1 ? (0 ? 0 : 0) : 2);
        expect(scope.$eval("0?1?0:0:2")).toEqual(0 ? (1 ? 0 : 0) : 2);
        expect(scope.$eval("0?0?1:0:2")).toEqual(0 ? (0 ? 1 : 0) : 2);
        expect(scope.$eval("0?0?0:2:3")).toEqual(0 ? (0 ? 0 : 2) : 3);
        expect(scope.$eval("1?1?0:0:2")).toEqual(1 ? (1 ? 0 : 0) : 2);
        expect(scope.$eval("1?1?1:0:2")).toEqual(1 ? (1 ? 1 : 0) : 2);
        expect(scope.$eval("1?1?1:2:3")).toEqual(1 ? (1 ? 1 : 2) : 3);
        expect(scope.$eval("1?1?1:2:3")).toEqual(1 ? (1 ? 1 : 2) : 3);

        // Nested on the right.
        expect(scope.$eval("0?0:0?0:2")).toEqual(0 ? 0 : 0 ? 0 : 2);
        expect(scope.$eval("1?0:0?0:2")).toEqual(1 ? 0 : 0 ? 0 : 2);
        expect(scope.$eval("0?1:0?0:2")).toEqual(0 ? 1 : 0 ? 0 : 2);
        expect(scope.$eval("0?0:1?0:2")).toEqual(0 ? 0 : 1 ? 0 : 2);
        expect(scope.$eval("0?0:0?2:3")).toEqual(0 ? 0 : 0 ? 2 : 3);
        expect(scope.$eval("1?1:0?0:2")).toEqual(1 ? 1 : 0 ? 0 : 2);
        expect(scope.$eval("1?1:1?0:2")).toEqual(1 ? 1 : 1 ? 0 : 2);
        expect(scope.$eval("1?1:1?2:3")).toEqual(1 ? 1 : 1 ? 2 : 3);
        expect(scope.$eval("1?1:1?2:3")).toEqual(1 ? 1 : 1 ? 2 : 3);

        // Precedence with respect to logical operators.
        expect(scope.$eval("0&&1?0:1")).toEqual(0 && 1 ? 0 : 1);
        expect(scope.$eval("1||0?0:0")).toEqual(1 || 0 ? 0 : 0);

        expect(scope.$eval("0?0&&1:2")).toEqual(0 ? 0 && 1 : 2);
        expect(scope.$eval("0?1&&1:2")).toEqual(0 ? 1 && 1 : 2);
        expect(scope.$eval("0?0||0:1")).toEqual(0 ? 0 || 0 : 1);
        expect(scope.$eval("0?0||1:2")).toEqual(0 ? 0 || 1 : 2);

        expect(scope.$eval("1?0&&1:2")).toEqual(1 ? 0 && 1 : 2);
        expect(scope.$eval("1?1&&1:2")).toEqual(1 ? 1 && 1 : 2);
        expect(scope.$eval("1?0||0:1")).toEqual(1 ? 0 || 0 : 1);
        expect(scope.$eval("1?0||1:2")).toEqual(1 ? 0 || 1 : 2);

        expect(scope.$eval("0?1:0&&1")).toEqual(0 ? 1 : 0 && 1);
        expect(scope.$eval("0?2:1&&1")).toEqual(0 ? 2 : 1 && 1);
        expect(scope.$eval("0?1:0||0")).toEqual(0 ? 1 : 0 || 0);
        expect(scope.$eval("0?2:0||1")).toEqual(0 ? 2 : 0 || 1);

        expect(scope.$eval("1?1:0&&1")).toEqual(1 ? 1 : 0 && 1);
        expect(scope.$eval("1?2:1&&1")).toEqual(1 ? 2 : 1 && 1);
        expect(scope.$eval("1?1:0||0")).toEqual(1 ? 1 : 0 || 0);
        expect(scope.$eval("1?2:0||1")).toEqual(1 ? 2 : 0 || 1);

        // Function calls.
        expect(
          scope.$eval("returnTrue() ? returnString() : returnInt()"),
        ).toEqual(returnTrue() ? returnString() : returnInt());
        expect(
          scope.$eval("returnFalse() ? returnString() : returnInt()"),
        ).toEqual(returnFalse() ? returnString() : returnInt());
        expect(
          scope.$eval("returnTrue() ? returnString() : returnInt()"),
        ).toEqual(returnTrue() ? returnString() : returnInt());
        expect(
          scope.$eval("identity(returnFalse() ? returnString() : returnInt())"),
        ).toEqual(identity(returnFalse() ? returnString() : returnInt()));
      });

      it("should parse string", () => {
        expect(scope.$eval("'a' + 'b c'")).toEqual("ab c");
      });

      it("should parse filters", () => {
        filterProvider.register(
          "substring",
          valueFn((input, start, end) => input.substring(start, end)),
        );

        expect(() => {
          scope.$eval("1|nonexistent");
        }).toThrowError();

        scope.offset = 3;
        expect(scope.$eval("'abcd'|substring:1:offset")).toEqual("bc");
      });

      it("should access scope", () => {
        scope.a = 123;
        scope.b = { c: 456 };
        expect(scope.$eval("a", scope)).toEqual(123);
        expect(scope.$eval("b.c", scope)).toEqual(456);
        expect(scope.$eval("x.y.z", scope)).not.toBeDefined();
      });

      it("should handle white-spaces around dots in paths", () => {
        scope.a = { b: 4 };
        expect(scope.$eval("a . b", scope)).toEqual(4);
        expect(scope.$eval("a. b", scope)).toEqual(4);
        expect(scope.$eval("a .b", scope)).toEqual(4);
        expect(scope.$eval("a    . \nb", scope)).toEqual(4);
      });

      it("should handle white-spaces around dots in method invocations", () => {
        scope.a = {
          b() {
            return this.c;
          },
          c: 4,
        };
        expect(scope.$eval("a . b ()", scope)).toEqual(4);
        expect(scope.$eval("a. b ()", scope)).toEqual(4);
        expect(scope.$eval("a .b ()", scope)).toEqual(4);
        expect(scope.$eval("a  \n  . \nb   \n ()", scope)).toEqual(4);
      });

      it("should throw syntax error exception for identifiers ending with a dot", () => {
        scope.a = { b: 4 };

        expect(() => {
          scope.$eval("a.", scope);
        }).toThrowError(/ueoe/);

        expect(() => {
          scope.$eval("a .", scope);
        }).toThrowError(/ueoe/);
      });

      it("should resolve deeply nested paths (important for CSP mode)", () => {
        scope.a = {
          b: {
            c: {
              d: {
                e: {
                  f: {
                    g: { h: { i: { j: { k: { l: { m: { n: "nooo!" } } } } } } },
                  },
                },
              },
            },
          },
        };
        expect(scope.$eval("a.b.c.d.e.f.g.h.i.j.k.l.m.n", scope)).toBe("nooo!");
      });

      forEach([2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 42, 99], (pathLength) => {
        it(`should resolve nested paths of length ${pathLength}`, () => {
          // Create a nested object {x2: {x3: {x4: ... {x[n]: 42} ... }}}.
          let obj = 42;
          const locals = {};
          for (var i = pathLength; i >= 2; i--) {
            const newObj = {};
            newObj[`x${i}`] = obj;
            obj = newObj;
          }
          // Assign to x1 and build path 'x1.x2.x3. ... .x[n]' to access the final value.
          scope.x1 = obj;
          let path = "x1";
          for (i = 2; i <= pathLength; i++) {
            path += `.x${i}`;
          }
          expect(scope.$eval(path)).toBe(42);
          locals[`x${pathLength}`] = "not 42";
          expect(scope.$eval(path, locals)).toBe(42);
        });
      });

      it("should be forgiving", () => {
        scope.a = { b: 23 };
        expect(scope.$eval("b")).toBeUndefined();
        expect(scope.$eval("a.x")).toBeUndefined();
        expect(scope.$eval("a.b.c.d")).toBeUndefined();
        scope.a = undefined;
        expect(scope.$eval("a - b")).toBe(0);
        expect(scope.$eval("a + b")).toBeUndefined();
        scope.a = 0;
        expect(scope.$eval("a - b")).toBe(0);
        expect(scope.$eval("a + b")).toBe(0);
        scope.a = undefined;
        scope.b = 0;
        expect(scope.$eval("a - b")).toBe(0);
        expect(scope.$eval("a + b")).toBe(0);
      });

      it("should support property names that collide with native object properties", () => {
        // regression
        scope.watch = 1;
        scope.toString = function toString() {
          return "custom toString";
        };

        expect(scope.$eval("watch", scope)).toBe(1);
        expect(scope.$eval("toString()", scope)).toBe("custom toString");
      });

      it("should not break if hasOwnProperty is referenced in an expression", () => {
        scope.obj = { value: 1 };
        // By evaluating an expression that calls hasOwnProperty, the getterFnCache
        // will store a property called hasOwnProperty.  This is effectively:
        // getterFnCache['hasOwnProperty'] = null
        scope.$eval('obj.hasOwnProperty("value")');
        // If we rely on this property then evaluating any expression will fail
        // because it is not able to find out if obj.value is there in the cache
        expect(scope.$eval("obj.value")).toBe(1);
      });

      it('should not break if the expression is "hasOwnProperty"', () => {
        scope.fooExp = "barVal";
        // By evaluating hasOwnProperty, the $parse cache will store a getter for
        // the scope's own hasOwnProperty function, which will mess up future cache look ups.
        // i.e. cache['hasOwnProperty'] = function(scope) { return scope.hasOwnProperty; }
        scope.$eval("hasOwnProperty");
        expect(scope.$eval("fooExp")).toBe("barVal");
      });

      it("should evaluate grouped expressions", () => {
        expect(scope.$eval("(1+2)*3")).toEqual((1 + 2) * 3);
      });

      it("should evaluate assignments", () => {
        expect(scope.$eval("a=12")).toEqual(12);
        expect(scope.a).toEqual(12);

        expect(scope.$eval("x.y.z=123;")).toEqual(123);
        expect(scope.x.y.z).toEqual(123);

        expect(scope.$eval("a=123; b=234")).toEqual(234);
        expect(scope.a).toEqual(123);
        expect(scope.b).toEqual(234);
      });

      it("should throw with invalid left-val in assignments", () => {
        expect(() => {
          scope.$eval("1 = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("{} = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("[] = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("true = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("(a=b) = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("(1<2) = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("(1+2) = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("!v = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("this = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("+v = 1");
        }).toThrowError(/lval/);
        expect(() => {
          scope.$eval("(1?v1:v2) = 1");
        }).toThrowError(/lval/);
      });

      it("should evaluate assignments in ternary operator", () => {
        scope.$eval("a = 1 ? 2 : 3");
        expect(scope.a).toBe(2);

        scope.$eval("0 ? a = 2 : a = 3");
        expect(scope.a).toBe(3);

        scope.$eval("1 ? a = 2 : a = 3");
        expect(scope.a).toBe(2);
      });

      it("should evaluate function call without arguments", () => {
        scope.const = function (a, b) {
          return 123;
        };
        expect(scope.$eval("const()")).toEqual(123);
      });

      it("should evaluate function call with arguments", () => {
        scope.add = function (a, b) {
          return a + b;
        };
        expect(scope.$eval("add(1,2)")).toEqual(3);
      });

      it("should allow filter chains as arguments", () => {
        scope.concat = function (a, b) {
          return a + b;
        };
        scope.begin = 1;
        scope.limit = 2;
        expect(
          scope.$eval("concat('abcd'|limitTo:limit:begin,'abcd'|limitTo:2:1)"),
        ).toEqual("bcbc");
      });

      it("should evaluate function call from a return value", () => {
        scope.getter = function () {
          return function () {
            return 33;
          };
        };
        expect(scope.$eval("getter()()")).toBe(33);
      });

      it("should evaluate multiplication and division", () => {
        scope.taxRate = 8;
        scope.subTotal = 100;
        expect(scope.$eval("taxRate / 100 * subTotal")).toEqual(8);
        expect(scope.$eval("subTotal * taxRate / 100")).toEqual(8);
      });

      it("should evaluate array", () => {
        expect(scope.$eval("[]").length).toEqual(0);
        expect(scope.$eval("[1, 2]").length).toEqual(2);
        expect(scope.$eval("[1, 2]")[0]).toEqual(1);
        expect(scope.$eval("[1, 2]")[1]).toEqual(2);
        expect(scope.$eval("[1, 2,]")[1]).toEqual(2);
        expect(scope.$eval("[1, 2,]").length).toEqual(2);
      });

      it("should evaluate array access", () => {
        expect(scope.$eval("[1][0]")).toEqual(1);
        expect(scope.$eval("[[1]][0][0]")).toEqual(1);
        expect(scope.$eval("[].length")).toEqual(0);
        expect(scope.$eval("[1, 2].length")).toEqual(2);
      });

      it("should evaluate object", () => {
        expect(scope.$eval("{}")).toEqual({});
        expect(scope.$eval("{a:'b'}")).toEqual({ a: "b" });
        expect(scope.$eval("{'a':'b'}")).toEqual({ a: "b" });
        expect(scope.$eval("{\"a\":'b'}")).toEqual({ a: "b" });
        expect(scope.$eval("{a:'b',}")).toEqual({ a: "b" });
        expect(scope.$eval("{'a':'b',}")).toEqual({ a: "b" });
        expect(scope.$eval("{\"a\":'b',}")).toEqual({ a: "b" });
        expect(scope.$eval("{'0':1}")).toEqual({ 0: 1 });
        expect(scope.$eval("{0:1}")).toEqual({ 0: 1 });
        expect(scope.$eval("{1:1}")).toEqual({ 1: 1 });
        expect(scope.$eval("{null:1}")).toEqual({ null: 1 });
        expect(scope.$eval("{'null':1}")).toEqual({ null: 1 });
        expect(scope.$eval("{false:1}")).toEqual({ false: 1 });
        expect(scope.$eval("{'false':1}")).toEqual({ false: 1 });
        expect(scope.$eval("{'':1,}")).toEqual({ "": 1 });

        // ES6 object initializers.
        expect(scope.$eval("{x, y}", { x: "foo", y: "bar" })).toEqual({
          x: "foo",
          y: "bar",
        });
        expect(scope.$eval("{[x]: x}", { x: "foo" })).toEqual({ foo: "foo" });
        expect(scope.$eval('{[x + "z"]: x}', { x: "foo" })).toEqual({
          fooz: "foo",
        });
        expect(
          scope.$eval(
            "{x, 1: x, [x = x + 1]: x, 3: x + 1, [x = x + 2]: x, 5: x + 1}",
            { x: 1 },
          ),
        ).toEqual({ x: 1, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 });
      });

      it("should throw syntax error exception for non constant/identifier JSON keys", () => {
        expect(() => {
          scope.$eval("{[:0}");
        }).toThrowError(/syntax/);
        expect(() => {
          scope.$eval("{{:0}");
        }).toThrowError(/syntax/);
        expect(() => {
          scope.$eval("{?:0}");
        }).toThrowError(/syntax/);
        expect(() => {
          scope.$eval("{):0}");
        }).toThrowError(/syntax/);
      });

      it("should evaluate object access", () => {
        expect(scope.$eval("{false:'WC', true:'CC'}[false]")).toEqual("WC");
      });

      it("should evaluate JSON", () => {
        expect(scope.$eval("[{}]")).toEqual([{}]);
        expect(scope.$eval("[{a:[]}, {b:1}]")).toEqual([{ a: [] }, { b: 1 }]);
      });

      it("should evaluate multiple statements", () => {
        expect(scope.$eval("a=1;b=3;a+b")).toEqual(4);
        expect(scope.$eval(";;1;;")).toEqual(1);
      });

      it("should evaluate object methods in correct context (this)", () => {
        function C() {
          this.a = 123;
        }
        C.prototype.getA = function () {
          return this.a;
        };

        scope.obj = new C();
        expect(scope.$eval("obj.getA()")).toEqual(123);
        expect(scope.$eval("obj['getA']()")).toEqual(123);
      });

      it("should evaluate methods in correct context (this) in argument", () => {
        function C() {
          this.a = 123;
        }
        C.prototype.sum = function (value) {
          return this.a + value;
        };
        C.prototype.getA = function () {
          return this.a;
        };

        scope.obj = new C();
        expect(scope.$eval("obj.sum(obj.getA())")).toEqual(246);
        expect(scope.$eval("obj['sum'](obj.getA())")).toEqual(246);
      });

      it("should evaluate objects on scope context", () => {
        scope.a = "abc";
        expect(scope.$eval("{a:a}").a).toEqual("abc");
      });

      it("should evaluate field access on function call result", () => {
        scope.a = function () {
          return { name: "misko" };
        };
        expect(scope.$eval("a().name")).toEqual("misko");
      });

      it("should evaluate field access after array access", () => {
        scope.items = [{}, { name: "misko" }];
        expect(scope.$eval("items[1].name")).toEqual("misko");
      });

      it("should evaluate array assignment", () => {
        scope.items = [];

        expect(scope.$eval('items[1] = "abc"')).toEqual("abc");
        expect(scope.$eval("items[1]")).toEqual("abc");
        expect(scope.$eval('books[1] = "moby"')).toEqual("moby");
        expect(scope.$eval("books[1]")).toEqual("moby");
      });

      it("should evaluate grouped filters", () => {
        scope.name = "MISKO";
        expect(scope.$eval("n = (name|limitTo:2|limitTo:1)")).toEqual("M");
        expect(scope.$eval("n")).toEqual("M");
      });

      it("should evaluate remainder", () => {
        expect(scope.$eval("1%2")).toEqual(1);
      });

      it("should evaluate sum with undefined", () => {
        expect(scope.$eval("1+undefined")).toEqual(1);
        expect(scope.$eval("undefined+1")).toEqual(1);
      });

      it("should throw exception on non-closed bracket", () => {
        expect(() => {
          scope.$eval("[].count(");
        }).toThrowError(/ueoe/);
      });

      it("should evaluate double negation", () => {
        expect(scope.$eval("true")).toBeTruthy();
        expect(scope.$eval("!true")).toBeFalsy();
        expect(scope.$eval("!!true")).toBeTruthy();
        expect(scope.$eval('{true:"a", false:"b"}[!!true]')).toEqual("a");
      });

      it("should evaluate negation", () => {
        expect(scope.$eval("!false || true")).toEqual(!false || true);
        expect(scope.$eval("!11 == 10")).toEqual(!11 == 10);
        expect(scope.$eval("12/6/2")).toEqual(12 / 6 / 2);
      });

      it("should evaluate exclamation mark", () => {
        expect(scope.$eval('suffix = "!"')).toEqual("!");
      });

      it("should evaluate minus", () => {
        expect(scope.$eval("{a:'-'}")).toEqual({ a: "-" });
      });

      it("should evaluate undefined", () => {
        expect(scope.$eval("undefined")).not.toBeDefined();
        expect(scope.$eval("a=undefined")).not.toBeDefined();
        expect(scope.a).not.toBeDefined();
      });

      it("should allow assignment after array dereference", () => {
        scope.obj = [{}];
        scope.$eval("obj[0].name=1");
        expect(scope.obj.name).toBeUndefined();
        expect(scope.obj[0].name).toEqual(1);
      });

      it("should short-circuit AND operator", () => {
        scope.run = function () {
          throw new Error("IT SHOULD NOT HAVE RUN");
        };
        expect(scope.$eval("false && run()")).toBe(false);
        expect(scope.$eval("false && true && run()")).toBe(false);
      });

      it("should short-circuit OR operator", () => {
        scope.run = function () {
          throw new Error("IT SHOULD NOT HAVE RUN");
        };
        expect(scope.$eval("true || run()")).toBe(true);
        expect(scope.$eval("true || false || run()")).toBe(true);
      });

      it("should throw TypeError on using a 'broken' object as a key to access a property", () => {
        scope.object = {};
        forEach(
          [
            { toString: 2 },
            { toString: null },
            {
              toString() {
                return {};
              },
            },
          ],
          (brokenObject) => {
            scope.brokenObject = brokenObject;
            expect(() => {
              scope.$eval("object[brokenObject]");
            }).toThrow();
          },
        );
      });

      it("should support method calls on primitive types", () => {
        scope.empty = "";
        scope.zero = 0;
        scope.bool = false;

        expect(scope.$eval("empty.substr(0)")).toBe("");
        expect(scope.$eval("zero.toString()")).toBe("0");
        expect(scope.$eval("bool.toString()")).toBe("false");
      });

      it("should evaluate expressions with line terminators", () => {
        scope.a = "a";
        scope.b = { c: "bc" };
        expect(
          scope.$eval('a + \n b.c + \r "\td" + \t \r\n\r "\r\n\n"'),
        ).toEqual("abc\td\r\n\n");
      });

      // https://github.com/angular/angular.js/issues/10968
      it("should evaluate arrays literals initializers left-to-right", () => {
        const s = {
          c() {
            return { b: 1 };
          },
        };
        expect($parse("e=1;[a=c(),d=a.b+1]")(s)).toEqual([{ b: 1 }, 2]);
      });

      it("should evaluate function arguments left-to-right", () => {
        const s = {
          c() {
            return { b: 1 };
          },
          i(x, y) {
            return [x, y];
          },
        };
        expect($parse("e=1;i(a=c(),d=a.b+1)")(s)).toEqual([{ b: 1 }, 2]);
      });

      it("should evaluate object properties expressions left-to-right", () => {
        const s = {
          c() {
            return { b: 1 };
          },
        };
        expect($parse("e=1;{x: a=c(), y: d=a.b+1}")(s)).toEqual({
          x: { b: 1 },
          y: 2,
        });
      });

      it("should call the function from the received instance and not from a new one", () => {
        let n = 0;
        scope.fn = function () {
          const c = n++;
          return {
            c,
            anotherFn() {
              return this.c === c;
            },
          };
        };
        expect(scope.$eval("fn().anotherFn()")).toBe(true);
      });

      it("should call the function once when it is part of the context", () => {
        let count = 0;
        scope.fn = function () {
          count++;
          return {
            anotherFn() {
              return "lucas";
            },
          };
        };
        expect(scope.$eval("fn().anotherFn()")).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is not part of the context", () => {
        let count = 0;
        scope.fn = function () {
          count++;
          return function () {
            return "lucas";
          };
        };
        expect(scope.$eval("fn()()")).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is part of the context on assignments", () => {
        let count = 0;
        const element = {};
        scope.fn = function () {
          count++;
          return element;
        };
        expect(scope.$eval('fn().name = "lucas"')).toBe("lucas");
        expect(element.name).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is part of the context on array lookups", () => {
        let count = 0;
        const element = [];
        scope.fn = function () {
          count++;
          return element;
        };
        expect(scope.$eval('fn()[0] = "lucas"')).toBe("lucas");
        expect(element[0]).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is part of the context on array lookup function", () => {
        let count = 0;
        const element = [
          {
            anotherFn() {
              return "lucas";
            },
          },
        ];
        scope.fn = function () {
          count++;
          return element;
        };
        expect(scope.$eval("fn()[0].anotherFn()")).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is part of the context on property lookup function", () => {
        let count = 0;
        const element = {
          name: {
            anotherFn() {
              return "lucas";
            },
          },
        };
        scope.fn = function () {
          count++;
          return element;
        };
        expect(scope.$eval("fn().name.anotherFn()")).toBe("lucas");
        expect(count).toBe(1);
      });

      it("should call the function once when it is part of a sub-expression", () => {
        let count = 0;
        scope.element = [{}];
        scope.fn = function () {
          count++;
          return 0;
        };
        expect(scope.$eval('element[fn()].name = "lucas"')).toBe("lucas");
        expect(scope.element[0].name).toBe("lucas");
        expect(count).toBe(1);
      });
    });
  });

  describe("assignable", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]);
    });

    it("should expose assignment function", () => {
      const fn = $parse("a");
      expect(fn.assign).toBeTruthy();
      const scope = {};
      fn.assign(scope, 123);
      expect(scope).toEqual({ a: 123 });
    });

    it("should return the assigned value", () => {
      const fn = $parse("a");
      const scope = {};
      expect(fn.assign(scope, 123)).toBe(123);
      const someObject = {};
      expect(fn.assign(scope, someObject)).toBe(someObject);
    });

    it("should expose working assignment function for expressions ending with brackets", () => {
      const fn = $parse('a.b["c"]');
      expect(fn.assign).toBeTruthy();
      const scope = {};
      fn.assign(scope, 123);
      expect(scope.a.b.c).toEqual(123);
    });

    it("should expose working assignment function for expressions with brackets in the middle", () => {
      const fn = $parse('a["b"].c');
      expect(fn.assign).toBeTruthy();
      const scope = {};
      fn.assign(scope, 123);
      expect(scope.a.b.c).toEqual(123);
    });

    it("should create objects when finding a null", () => {
      const fn = $parse("foo.bar");
      const scope = { foo: null };
      fn.assign(scope, 123);
      expect(scope.foo.bar).toEqual(123);
    });

    it("should create objects when finding a null", () => {
      const fn = $parse('foo["bar"]');
      const scope = { foo: null };
      fn.assign(scope, 123);
      expect(scope.foo.bar).toEqual(123);
    });

    it("should create objects when finding a null", () => {
      const fn = $parse("foo.bar.baz");
      const scope = { foo: null };
      fn.assign(scope, 123);
      expect(scope.foo.bar.baz).toEqual(123);
    });
  });

  describe("one-time binding", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_) => {
        $rootScope = _$rootScope_;
      });
      logs = [];
    });

    it("should always use the cache", () => {
      expect($parse("foo")).toBe($parse("foo"));
      expect($parse("::foo")).toBe($parse("::foo"));
    });

    it("should not affect calling the parseFn directly", () => {
      const fn = $parse("::foo");
      $rootScope.$watch(fn);

      $rootScope.foo = "bar";
      expect($rootScope.$$watchers.length).toBe(1);
      expect(fn($rootScope)).toEqual("bar");

      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toBe(0);
      expect(fn($rootScope)).toEqual("bar");

      $rootScope.foo = "man";
      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toBe(0);
      expect(fn($rootScope)).toEqual("man");

      $rootScope.foo = "shell";
      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toBe(0);
      expect(fn($rootScope)).toEqual("shell");
    });

    it("should stay stable once the value defined", () => {
      const fn = $parse("::foo");
      $rootScope.$watch(fn, (value, old) => {
        if (value !== old) logs.push(value);
      });

      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toBe(1);

      $rootScope.foo = "bar";
      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toBe(0);
      expect(logs[0]).toEqual("bar");

      $rootScope.foo = "man";
      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toBe(0);
      expect(logs.length).toEqual(1);
    });

    it("should have a stable value if at the end of a $digest it has a defined value", () => {
      const fn = $parse("::foo");
      $rootScope.$watch(fn, (value, old) => {
        if (value !== old) logs.push(value);
      });
      $rootScope.$watch("foo", () => {
        if ($rootScope.foo === "bar") {
          $rootScope.foo = undefined;
        }
      });

      $rootScope.foo = "bar";
      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toBe(2);
      expect(logs[0]).toBeUndefined();

      $rootScope.foo = "man";
      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toBe(1);
      expect(logs[1]).toEqual("man");

      $rootScope.foo = "shell";
      $rootScope.$digest();
      expect($rootScope.$$watchers.length).toBe(1);
      expect(logs.length).toEqual(2);
    });

    it("should not throw if the stable value is `null`", () => {
      const fn = $parse("::foo");
      $rootScope.$watch(fn);
      $rootScope.foo = null;
      $rootScope.$digest();
      $rootScope.foo = "foo";
      $rootScope.$digest();
      expect(fn()).toEqual(undefined);
    });

    it("should invoke a stateless filter once when the parsed expression has an interceptor", () => {
      const countFilter = jasmine.createSpy();
      const interceptor = jasmine.createSpy();
      countFilter.and.returnValue(1);
      createInjector([
        "ng",
        function ($filterProvider) {
          $filterProvider.register("count", valueFn(countFilter));
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });

      scope.foo = function () {
        return 1;
      };
      scope.$watch($parse(":: foo() | count", interceptor));
      scope.$digest();
      expect(countFilter.calls.count()).toBe(1);
    });
  });

  describe("literal expressions", () => {
    it("should mark an empty expressions as literal", () => {
      expect($parse("").literal).toBe(true);
      expect($parse("   ").literal).toBe(true);
      expect($parse("::").literal).toBe(true);
      expect($parse("::    ").literal).toBe(true);
    });

    [true, false].forEach((isDeep) => {
      describe(isDeep ? "deepWatch" : "watch", () => {
        beforeEach(() => {
          logs = [];
        });

        it("should only become stable when all the properties of an object have defined values", () => {
          const fn = $parse("::{foo: foo, bar: bar}");
          $rootScope.$watch(
            fn,
            (value) => {
              logs.push(value);
            },
            isDeep,
          );

          expect(logs).toEqual([]);
          expect($rootScope.$$watchers.length).toBe(1);

          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(1);
          expect(logs[0]).toEqual({ foo: undefined, bar: undefined });

          $rootScope.foo = "foo";
          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(1);
          expect(logs[0]).toEqual({ foo: undefined, bar: undefined });

          $rootScope.foo = "foobar";
          $rootScope.bar = "bar";
          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(0);
          expect(logs[2]).toEqual({ foo: "foobar", bar: "bar" });

          $rootScope.foo = "baz";
          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(0);
          expect(logs[3]).toBeUndefined();
        });

        it("should only become stable when all the elements of an array have defined values", () => {
          const fn = $parse("::[foo,bar]");
          $rootScope.$watch(
            fn,
            (value) => {
              logs.push(value);
            },
            isDeep,
          );

          expect(logs.length).toEqual(0);
          expect($rootScope.$$watchers.length).toBe(1);

          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(1);
          expect(logs[0]).toEqual([undefined, undefined]);

          $rootScope.foo = "foo";
          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(1);
          expect(logs[1]).toEqual(["foo", undefined]);

          $rootScope.foo = "foobar";
          $rootScope.bar = "bar";
          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(0);
          expect(logs[2]).toEqual(["foobar", "bar"]);

          $rootScope.foo = "baz";
          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(0);
          expect(logs[3]).toBeUndefined();
        });

        it("should only become stable when all the elements of an array have defined values at the end of a $digest", () => {
          const fn = $parse("::[foo]");
          $rootScope.$watch(
            fn,
            (value) => {
              logs.push(value);
            },
            isDeep,
          );
          $rootScope.$watch("foo", () => {
            if ($rootScope.foo === "bar") {
              $rootScope.foo = undefined;
            }
          });

          $rootScope.foo = "bar";
          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(2);
          expect(logs[0]).toEqual(["bar"]);
          expect(logs[1]).toEqual([undefined]);

          $rootScope.foo = "baz";
          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(1);
          expect(logs[2]).toEqual(["baz"]);

          $rootScope.bar = "qux";
          $rootScope.$digest();
          expect($rootScope.$$watchers.length).toBe(1);
          expect(logs[3]).toBeUndefined();
        });
      });
    });
  });

  describe("watched $parse expressions", () => {
    beforeEach(() => {
      createInjector(["ng"]).invoke((_$rootScope_) => {
        scope = _$rootScope_;
      });
    });

    it("should respect short-circuiting AND if it could have side effects", () => {
      let bCalled = 0;
      scope.b = function () {
        bCalled++;
      };

      scope.$watch("a && b()");
      scope.$digest();
      scope.$digest();
      expect(bCalled).toBe(0);

      scope.a = true;
      scope.$digest();
      expect(bCalled).toBe(1);
      scope.$digest();
      expect(bCalled).toBe(2);
    });

    it("should respect short-circuiting OR if it could have side effects", () => {
      let bCalled = false;
      scope.b = function () {
        bCalled = true;
      };

      scope.$watch("a || b()");
      scope.$digest();
      expect(bCalled).toBe(true);

      bCalled = false;
      scope.a = true;
      scope.$digest();
      expect(bCalled).toBe(false);
    });

    it("should respect the branching ternary operator if it could have side effects", () => {
      let bCalled = false;
      scope.b = function () {
        bCalled = true;
      };

      scope.$watch("a ? b() : 1");
      scope.$digest();
      expect(bCalled).toBe(false);

      scope.a = true;
      scope.$digest();
      expect(bCalled).toBe(true);
    });
  });

  describe("filters", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    it("should not be invoked unless the input/arguments change", () => {
      let filterCalled = false;
      filterProvider.register(
        "foo",
        valueFn((input) => {
          filterCalled = true;
          return input;
        }),
      );

      scope.$watch("a | foo:b:1");
      scope.a = 0;
      scope.$digest();
      expect(filterCalled).toBe(true);

      filterCalled = false;
      scope.$digest();
      expect(filterCalled).toBe(false);

      scope.a++;
      scope.$digest();
      expect(filterCalled).toBe(true);
    });

    it("should not be invoked unless the input/arguments change within literals", () => {
      const filterCalls = [];
      filterProvider.register(
        "foo",
        valueFn((input) => {
          filterCalls.push(input);
          return input;
        }),
      );

      scope.$watch("[(a | foo:b:1), undefined]");
      scope.a = 0;
      scope.$digest();
      expect(filterCalls).toEqual([0]);

      scope.$digest();
      expect(filterCalls).toEqual([0]);

      scope.a++;
      scope.$digest();
      expect(filterCalls).toEqual([0, 1]);
    });

    it("should not be invoked unless the input/arguments change within literals (one-time)", () => {
      const filterCalls = [];
      filterProvider.register(
        "foo",
        valueFn((input) => {
          filterCalls.push(input);
          return input;
        }),
      );

      scope.$watch("::[(a | foo:b:1), undefined]");
      scope.a = 0;
      scope.$digest();
      expect(filterCalls).toEqual([0]);

      scope.$digest();
      expect(filterCalls).toEqual([0]);

      scope.a++;
      scope.$digest();
      expect(filterCalls).toEqual([0, 1]);
    });

    it("should always be invoked if they are marked as having $stateful", () => {
      let filterCalled = false;
      filterProvider.register(
        "foo",
        valueFn(
          extend(
            (input) => {
              filterCalled = true;
              return input;
            },
            { $stateful: true },
          ),
        ),
      );

      scope.$watch("a | foo:b:1");
      scope.a = 0;
      scope.$digest();
      expect(filterCalled).toBe(true);

      filterCalled = false;
      scope.$digest();
      expect(filterCalled).toBe(true);
    });

    it("should be treated as constant when input are constant", () => {
      let filterCalls = 0;
      filterProvider.register(
        "foo",
        valueFn((input) => {
          filterCalls++;
          return input;
        }),
      );

      const parsed = $parse("{x: 1} | foo:1");

      expect(parsed.constant).toBe(true);

      let watcherCalls = 0;
      scope.$watch(parsed, (input) => {
        expect(input).toEqual({ x: 1 });
        watcherCalls++;
      });

      scope.$digest();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);

      scope.$digest();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);
    });

    it("should ignore changes within nested objects", () => {
      const watchCalls = [];
      scope.$watch("[a]", (a) => {
        watchCalls.push(a[0]);
      });
      scope.a = 0;
      scope.$digest();
      expect(watchCalls).toEqual([0]);

      scope.$digest();
      expect(watchCalls).toEqual([0]);

      scope.a++;
      scope.$digest();
      expect(watchCalls).toEqual([0, 1]);

      scope.a = {};
      scope.$digest();
      expect(watchCalls).toEqual([0, 1, {}]);

      scope.a.foo = 42;
      scope.$digest();
      expect(watchCalls).toEqual([0, 1, { foo: 42 }]);
    });

    it("should ignore changes within nested objects (one-time)", () => {
      const watchCalls = [];
      scope.$watch("::[a, undefined]", (a) => {
        watchCalls.push(a[0]);
      });
      scope.a = 0;
      scope.$digest();
      expect(watchCalls).toEqual([0]);

      scope.$digest();
      expect(watchCalls).toEqual([0]);

      scope.a++;
      scope.$digest();
      expect(watchCalls).toEqual([0, 1]);

      scope.a = {};
      scope.$digest();
      expect(watchCalls).toEqual([0, 1, {}]);

      scope.a.foo = 42;
      scope.$digest();
      expect(watchCalls).toEqual([0, 1, { foo: 42 }]);
    });
  });

  describe("with non-primitive input", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    describe("that does NOT support valueOf()", () => {
      it("should always be reevaluated", () => {
        let filterCalls = 0;
        filterProvider.register(
          "foo",
          valueFn((input) => {
            filterCalls++;
            return input;
          }),
        );

        const parsed = $parse("obj | foo");
        const obj = (scope.obj = {});

        let watcherCalls = 0;
        scope.$watch(parsed, (input) => {
          expect(input).toBe(obj);
          watcherCalls++;
        });

        scope.$digest();
        expect(filterCalls).toBe(2);
        expect(watcherCalls).toBe(1);

        scope.$digest();
        expect(filterCalls).toBe(3);
        expect(watcherCalls).toBe(1);
      });

      it("should always be reevaluated in literals", () => {
        filterProvider.register(
          "foo",
          valueFn((input) => input.b > 0),
        );

        scope.$watch("[(a | foo)]", () => {});

        // Would be great if filter-output was checked for changes and this didn't throw...
        expect(() => {
          scope.$apply("a = {b: 1}");
        }).toThrowError(/infdig/);
      });

      it("should always be reevaluated when passed literals", () => {
        scope.$watch("[a] | filter", () => {});

        scope.$apply("a = 1");

        // Would be great if filter-output was checked for changes and this didn't throw...
        expect(() => {
          scope.$apply("a = {}");
        }).toThrowError(/infdig/);
      });
    });

    describe("that does support valueOf()", () => {
      it("should not be reevaluated", () => {
        let filterCalls = 0;
        filterProvider.register(
          "foo",
          valueFn((input) => {
            filterCalls++;
            expect(input instanceof Date).toBe(true);
            return input;
          }),
        );

        const parsed = $parse("date | foo:a");
        const date = (scope.date = new Date());

        let watcherCalls = 0;
        scope.$watch(parsed, (input) => {
          expect(input).toBe(date);
          watcherCalls++;
        });

        scope.$digest();
        expect(filterCalls).toBe(1);
        expect(watcherCalls).toBe(1);

        scope.$digest();
        expect(filterCalls).toBe(1);
        expect(watcherCalls).toBe(1);
      });

      it("should not be reevaluated in literals", () => {
        let filterCalls = 0;
        filterProvider.register(
          "foo",
          valueFn((input) => {
            filterCalls++;
            return input;
          }),
        );

        scope.date = new Date(1234567890123);

        let watcherCalls = 0;
        scope.$watch("[(date | foo)]", (input) => {
          watcherCalls++;
        });

        scope.$digest();
        expect(filterCalls).toBe(1);
        expect(watcherCalls).toBe(1);

        scope.$digest();
        expect(filterCalls).toBe(1);
        expect(watcherCalls).toBe(1);
      });

      it("should be reevaluated when valueOf() changes", () => {
        let filterCalls = 0;
        filterProvider.register(
          "foo",
          valueFn((input) => {
            filterCalls++;
            expect(input instanceof Date).toBe(true);
            return input;
          }),
        );

        const parsed = $parse("date | foo:a");
        const date = (scope.date = new Date());

        let watcherCalls = 0;
        scope.$watch(parsed, (input) => {
          expect(input).toBe(date);
          watcherCalls++;
        });

        scope.$digest();
        expect(filterCalls).toBe(1);
        expect(watcherCalls).toBe(1);

        date.setYear(1901);

        scope.$digest();
        expect(filterCalls).toBe(2);
        expect(watcherCalls).toBe(1);
      });

      it("should be reevaluated in literals when valueOf() changes", () => {
        let filterCalls = 0;
        filterProvider.register(
          "foo",
          valueFn((input) => {
            filterCalls++;
            return input;
          }),
        );

        scope.date = new Date(1234567890123);

        let watcherCalls = 0;
        scope.$watch("[(date | foo)]", (input) => {
          watcherCalls++;
        });

        scope.$digest();
        expect(filterCalls).toBe(1);
        expect(watcherCalls).toBe(1);

        scope.date.setTime(1234567890);

        scope.$digest();
        expect(filterCalls).toBe(2);
        expect(watcherCalls).toBe(2);
      });

      it("should not be reevaluated when the instance changes but valueOf() does not", () => {
        let filterCalls = 0;
        filterProvider.register(
          "foo",
          valueFn((input) => {
            filterCalls++;
            return input;
          }),
        );

        scope.date = new Date(1234567890123);

        let watcherCalls = 0;
        scope.$watch($parse("[(date | foo)]"), (input) => {
          watcherCalls++;
        });

        scope.$digest();
        expect(watcherCalls).toBe(1);
        expect(filterCalls).toBe(1);

        scope.date = new Date(1234567890123);
        scope.$digest();
        expect(watcherCalls).toBe(1);
        expect(filterCalls).toBe(1);
      });
    });

    it("should not be reevaluated when input is simplified via unary operators", () => {
      let filterCalls = 0;
      filterProvider.register(
        "foo",
        valueFn((input) => {
          filterCalls++;
          return input;
        }),
      );

      scope.obj = {};

      let watcherCalls = 0;
      scope.$watch("!obj | foo:!obj", (input) => {
        watcherCalls++;
      });

      scope.$digest();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);

      scope.$digest();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);
    });

    it("should not be reevaluated when input is simplified via non-plus/concat binary operators", () => {
      let filterCalls = 0;
      filterProvider.register(
        "foo",
        valueFn((input) => {
          filterCalls++;
          return input;
        }),
      );

      scope.obj = {};

      let watcherCalls = 0;
      scope.$watch("1 - obj | foo:(1 * obj)", (input) => {
        watcherCalls++;
      });

      scope.$digest();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);

      scope.$digest();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);
    });

    it("should be reevaluated when input is simplified via plus/concat", () => {
      let filterCalls = 0;
      filterProvider.register(
        "foo",
        valueFn((input) => {
          filterCalls++;
          return input;
        }),
      );

      scope.obj = {};

      let watcherCalls = 0;
      scope.$watch("1 + obj | foo", (input) => {
        watcherCalls++;
      });

      scope.$digest();
      expect(filterCalls).toBe(2);
      expect(watcherCalls).toBe(1);

      scope.$digest();
      expect(filterCalls).toBe(3);
      expect(watcherCalls).toBe(1);
    });

    it("should reevaluate computed member expressions", () => {
      let toStringCalls = 0;

      scope.obj = {};
      scope.key = {
        toString() {
          toStringCalls++;
          return "foo";
        },
      };

      let watcherCalls = 0;
      scope.$watch("obj[key]", (input) => {
        watcherCalls++;
      });

      scope.$digest();
      expect(toStringCalls).toBe(2);
      expect(watcherCalls).toBe(1);

      scope.$digest();
      expect(toStringCalls).toBe(3);
      expect(watcherCalls).toBe(1);
    });

    it("should be reevaluated with input created with null prototype", () => {
      let filterCalls = 0;
      filterProvider.register(
        "foo",
        valueFn((input) => {
          filterCalls++;
          return input;
        }),
      );

      const parsed = $parse("obj | foo");
      const obj = (scope.obj = Object.create(null));

      let watcherCalls = 0;
      scope.$watch(parsed, (input) => {
        expect(input).toBe(obj);
        watcherCalls++;
      });

      scope.$digest();
      expect(filterCalls).toBe(2);
      expect(watcherCalls).toBe(1);

      scope.$digest();
      expect(filterCalls).toBe(3);
      expect(watcherCalls).toBe(1);
    });
  });

  describe("with primitive input", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    it("should not be reevaluated when passed literals", () => {
      let filterCalls = 0;
      filterProvider.register(
        "foo",
        valueFn((input) => {
          filterCalls++;
          return input;
        }),
      );

      let watcherCalls = 0;
      scope.$watch("[a] | foo", (input) => {
        watcherCalls++;
      });

      scope.$apply("a = 1");
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);

      scope.$apply("a = 2");
      expect(filterCalls).toBe(2);
      expect(watcherCalls).toBe(2);
    });

    it("should not be reevaluated in literals", () => {
      let filterCalls = 0;
      filterProvider.register(
        "foo",
        valueFn((input) => {
          filterCalls++;
          return input;
        }),
      );

      scope.prim = 1234567890123;

      let watcherCalls = 0;
      scope.$watch("[(prim | foo)]", (input) => {
        watcherCalls++;
      });

      scope.$digest();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);

      scope.$digest();
      expect(filterCalls).toBe(1);
      expect(watcherCalls).toBe(1);
    });
  });

  describe("interceptorFns", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    it("should only be passed the intercepted value", () => {
      let args;
      function interceptor(v) {
        args = sliceArgs(arguments);
        return v;
      }

      scope.$watch($parse("a", interceptor));

      scope.a = 1;
      scope.$digest();
      expect(args).toEqual([1]);
    });

    it("should only be passed the intercepted value when wrapping one-time", () => {
      let args;
      function interceptor(v) {
        args = sliceArgs(arguments);
        return v;
      }

      scope.$watch($parse("::a", interceptor));

      scope.a = 1;
      scope.$digest();
      expect(args).toEqual([1]);
    });

    it("should only be passed the intercepted value when double-intercepted", () => {
      let args1;
      function int1(v) {
        args1 = sliceArgs(arguments);
        return v + 2;
      }
      let args2;
      function int2(v) {
        args2 = sliceArgs(arguments);
        return v + 4;
      }

      scope.$watch($parse($parse("a", int1), int2));

      scope.a = 1;
      scope.$digest();
      expect(args1).toEqual([1]);
      expect(args2).toEqual([3]);
    });

    it("should support locals", () => {
      let args;
      function interceptor(v) {
        args = sliceArgs(arguments);
        return v + 4;
      }

      const exp = $parse("a + b", interceptor);
      scope.a = 1;

      expect(exp(scope, { b: 2 })).toBe(7);
      expect(args).toEqual([3]);
    });

    it("should support locals when double-intercepted", () => {
      let args1;
      function int1(v) {
        args1 = sliceArgs(arguments);
        return v + 4;
      }
      let args2;
      function int2(v) {
        args2 = sliceArgs(arguments);
        return v + 8;
      }

      const exp = $parse($parse("a + b", int1), int2);

      scope.a = 1;
      expect(exp(scope, { b: 2 })).toBe(15);
      expect(args1).toEqual([3]);
      expect(args2).toEqual([7]);
    });

    it("should always be invoked if they are flagged as having $stateful", () => {
      let called = false;
      function interceptor() {
        called = true;
      }
      interceptor.$stateful = true;

      scope.$watch($parse("a", interceptor));
      scope.a = 0;
      scope.$digest();
      expect(called).toBe(true);

      called = false;
      scope.$digest();
      expect(called).toBe(true);

      scope.a++;
      called = false;
      scope.$digest();
      expect(called).toBe(true);
    });

    it("should always be invoked if flagged as $stateful when wrapping one-time", () => {
      let interceptorCalls = 0;
      function interceptor() {
        interceptorCalls++;
        return 123;
      }
      interceptor.$stateful = true;

      scope.$watch($parse("::a", interceptor));

      interceptorCalls = 0;
      scope.$digest();
      expect(interceptorCalls).not.toBe(0);

      interceptorCalls = 0;
      scope.$digest();
      expect(interceptorCalls).not.toBe(0);
    });

    it("should always be invoked if flagged as $stateful when wrapping one-time with inputs", () => {
      filterProvider.register("identity", valueFn(identity));

      let interceptorCalls = 0;
      function interceptor() {
        interceptorCalls++;
        return 123;
      }
      interceptor.$stateful = true;

      scope.$watch($parse("::a | identity", interceptor));

      interceptorCalls = 0;
      scope.$digest();
      expect(interceptorCalls).not.toBe(0);

      interceptorCalls = 0;
      scope.$digest();
      expect(interceptorCalls).not.toBe(0);
    });

    it("should always be invoked if flagged as $stateful when wrapping one-time literal", () => {
      let interceptorCalls = 0;
      function interceptor() {
        interceptorCalls++;
        return 123;
      }
      interceptor.$stateful = true;

      scope.$watch($parse("::[a]", interceptor));

      interceptorCalls = 0;
      scope.$digest();
      expect(interceptorCalls).not.toBe(0);

      interceptorCalls = 0;
      scope.$digest();
      expect(interceptorCalls).not.toBe(0);
    });

    it("should not be invoked unless the input changes", () => {
      let called = false;
      function interceptor(v) {
        called = true;
        return v;
      }
      scope.$watch($parse("a", interceptor));
      scope.$watch($parse("a + b", interceptor));
      scope.a = scope.b = 0;
      scope.$digest();
      expect(called).toBe(true);

      called = false;
      scope.$digest();
      expect(called).toBe(false);

      scope.a++;
      scope.$digest();
      expect(called).toBe(true);
    });

    it("should always be invoked if inputs are non-primitive", () => {
      let called = false;
      function interceptor(v) {
        called = true;
        return v.sub;
      }

      scope.$watch($parse("[o]", interceptor));
      scope.o = { sub: 1 };

      called = false;
      scope.$digest();
      expect(called).toBe(true);

      called = false;
      scope.$digest();
      expect(called).toBe(true);
    });

    it("should not be invoked unless the input.valueOf() changes even if the instance changes", () => {
      let called = false;
      function interceptor(v) {
        called = true;
        return v;
      }
      scope.$watch($parse("a", interceptor));
      scope.a = new Date();
      scope.$digest();
      expect(called).toBe(true);

      called = false;
      scope.a = new Date(scope.a.valueOf());
      scope.$digest();
      expect(called).toBe(false);
    });

    it("should be invoked if input.valueOf() changes even if the instance does not", () => {
      let called = false;
      function interceptor(v) {
        called = true;
        return v;
      }
      scope.$watch($parse("a", interceptor));
      scope.a = new Date();
      scope.$digest();
      expect(called).toBe(true);

      called = false;
      scope.a.setTime(scope.a.getTime() + 1);
      scope.$digest();
      expect(called).toBe(true);
    });

    it("should be invoked when the expression is `undefined`", () => {
      let called = false;
      function interceptor(v) {
        called = true;
        return v;
      }
      scope.$watch($parse(undefined, interceptor));
      scope.$digest();
      expect(called).toBe(true);
    });

    it("should not affect when a one-time binding becomes stable", () => {
      scope.$watch($parse("::x"));
      scope.$watch($parse("::x", identity));
      scope.$watch($parse("::x", () => 1)); // interceptor that returns non-undefined

      scope.$digest();
      expect(scope.$$watchersCount).toBe(3);

      scope.x = 1;
      scope.$digest();
      expect(scope.$$watchersCount).toBe(0);
    });

    it("should not affect when a one-time literal binding becomes stable", () => {
      scope.$watch($parse("::[x]"));
      scope.$watch($parse("::[x]", identity));
      scope.$watch($parse("::[x]", () => 1)); // interceptor that returns non-literal

      scope.$digest();
      expect(scope.$$watchersCount).toBe(3);

      scope.x = 1;
      scope.$digest();
      expect(scope.$$watchersCount).toBe(0);
    });

    it("should watch the intercepted value of one-time bindings", () => {
      scope.$watch(
        $parse("::{x:x, y:y}", (lit) => lit.x),
        (val) => logs.push(val),
      );

      scope.$apply();
      expect(logs[0]).toBeUndefined();

      scope.$apply("x = 1");
      expect(logs[1]).toEqual(1);

      scope.$apply("x = 2; y=1");
      expect(logs[2]).toEqual(2);

      scope.$apply("x = 1; y=2");
      expect(logs[3]).toBeUndefined();
    });

    it("should watch the intercepted value of one-time bindings in nested interceptors", () => {
      scope.$watch(
        $parse(
          $parse("::{x:x, y:y}", (lit) => lit.x),
          identity,
        ),
        (val) => logs.push(val),
      );

      scope.$apply();
      expect(logs[0]).toBeUndefined();

      scope.$apply("x = 1");
      expect(logs[1]).toEqual(1);

      scope.$apply("x = 2; y=1");
      expect(logs[2]).toEqual(2);
      expect(logs[3]).toBeUndefined();
    });

    it("should nest interceptors around eachother, not around the intercepted", () => {
      function origin() {
        return 0;
      }

      let fn = origin;
      function addOne(n) {
        return n + 1;
      }

      fn = $parse(fn, addOne);
      expect(fn.$$intercepted).toBe(origin);
      expect(fn()).toBe(1);

      fn = $parse(fn, addOne);
      expect(fn.$$intercepted).toBe(origin);
      expect(fn()).toBe(2);

      fn = $parse(fn, addOne);
      expect(fn.$$intercepted).toBe(origin);
      expect(fn()).toBe(3);
    });

    it("should not propogate $$watchDelegate to the interceptor wrapped expression", () => {
      function getter(s) {
        return s.x;
      }
      getter.$$watchDelegate = getter;

      function doubler(v) {
        return 2 * v;
      }

      let lastValue;
      function watcher(val) {
        lastValue = val;
      }
      scope.$watch($parse(getter, doubler), watcher);

      scope.$apply("x = 1");
      expect(lastValue).toBe(2 * 1);

      scope.$apply("x = 123");
      expect(lastValue).toBe(2 * 123);
    });
  });

  describe("literals", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    it("should support watching", () => {
      let lastVal = NaN;
      let callCount = 0;
      const listener = function (val) {
        callCount++;
        lastVal = val;
      };

      scope.$watch("{val: val}", listener);

      scope.$apply("val = 1");
      expect(callCount).toBe(1);
      expect(lastVal).toEqual({ val: 1 });

      scope.$apply("val = []");
      expect(callCount).toBe(2);
      expect(lastVal).toEqual({ val: [] });

      scope.$apply("val = []");
      expect(callCount).toBe(3);
      expect(lastVal).toEqual({ val: [] });

      scope.$apply("val = {}");
      expect(callCount).toBe(4);
      expect(lastVal).toEqual({ val: {} });
    });

    it("should only watch the direct inputs", () => {
      let lastVal = NaN;
      let callCount = 0;
      const listener = function (val) {
        callCount++;
        lastVal = val;
      };

      scope.$watch("{val: val}", listener);

      scope.$apply("val = 1");
      expect(callCount).toBe(1);
      expect(lastVal).toEqual({ val: 1 });

      scope.$apply("val = [2]");
      expect(callCount).toBe(2);
      expect(lastVal).toEqual({ val: [2] });

      scope.$apply("val.push(3)");
      expect(callCount).toBe(2);

      scope.$apply("val.length = 0");
      expect(callCount).toBe(2);
    });

    it("should only watch the direct inputs when nested", () => {
      let lastVal = NaN;
      let callCount = 0;
      const listener = function (val) {
        callCount++;
        lastVal = val;
      };

      scope.$watch("[{val: [val]}]", listener);

      scope.$apply("val = 1");
      expect(callCount).toBe(1);
      expect(lastVal).toEqual([{ val: [1] }]);

      scope.$apply("val = [2]");
      expect(callCount).toBe(2);
      expect(lastVal).toEqual([{ val: [[2]] }]);

      scope.$apply("val.push(3)");
      expect(callCount).toBe(2);

      scope.$apply("val.length = 0");
      expect(callCount).toBe(2);
    });
  });

  describe("with non-primative input", () => {
    beforeEach(() => {
      createInjector([
        "ng",
        function ($filterProvider) {
          filterProvider = $filterProvider;
        },
      ]).invoke((_$rootScope_, _$parse_) => {
        scope = _$rootScope_;
        $parse = _$parse_;
      });
      logs = [];
    });

    describe("that does NOT support valueOf()", () => {
      it("should not be reevaluated", () => {
        const obj = (scope.obj = {});

        const parsed = $parse("[obj]");
        let watcherCalls = 0;
        scope.$watch(parsed, (input) => {
          expect(input[0]).toBe(obj);
          watcherCalls++;
        });

        scope.$digest();
        expect(watcherCalls).toBe(1);

        scope.$digest();
        expect(watcherCalls).toBe(1);
      });
    });

    describe("that does support valueOf()", () => {
      it("should not be reevaluated", () => {
        const date = (scope.date = new Date());

        const parsed = $parse("[date]");
        let watcherCalls = 0;
        scope.$watch(parsed, (input) => {
          expect(input[0]).toBe(date);
          watcherCalls++;
        });

        scope.$digest();
        expect(watcherCalls).toBe(1);

        scope.$digest();
        expect(watcherCalls).toBe(1);
      });

      it("should be reevaluated even when valueOf() changes", () => {
        const date = (scope.date = new Date());

        const parsed = $parse("[date]");
        let watcherCalls = 0;
        scope.$watch(parsed, (input) => {
          expect(input[0]).toBe(date);
          watcherCalls++;
        });

        scope.$digest();
        expect(watcherCalls).toBe(1);

        date.setYear(1901);

        scope.$digest();
        expect(watcherCalls).toBe(2);
      });

      it("should not be reevaluated when the instance changes but valueOf() does not", () => {
        scope.date = new Date(1234567890123);

        const parsed = $parse("[date]");
        let watcherCalls = 0;
        scope.$watch(parsed, (input) => {
          watcherCalls++;
        });

        scope.$digest();
        expect(watcherCalls).toBe(1);

        scope.date = new Date(1234567890123);
        scope.$digest();
        expect(watcherCalls).toBe(1);
      });

      it("should be reevaluated when the instance does not change but valueOf() does", () => {
        scope.date = new Date(1234567890123);

        const parsed = $parse("[date]");
        let watcherCalls = 0;
        scope.$watch(parsed, (input) => {
          watcherCalls++;
        });

        scope.$digest();
        expect(watcherCalls).toBe(1);

        scope.date.setTime(scope.date.getTime() + 1);
        scope.$digest();
        expect(watcherCalls).toBe(2);
      });
    });

    it("should continue with the evaluation of the expression without invoking computed parts", () => {
      let value = "foo";
      const spy = jasmine.createSpy();

      spy.and.callFake(() => value);
      scope.foo = spy;
      scope.$watch("foo()");
      scope.$digest();
      expect(spy).toHaveBeenCalledTimes(2);
      scope.$digest();
      expect(spy).toHaveBeenCalledTimes(3);
      value = "bar";
      scope.$digest();
      expect(spy).toHaveBeenCalledTimes(5);
    });

    it("should invoke all statements in multi-statement expressions", () => {
      let lastVal = NaN;
      const listener = function (val) {
        lastVal = val;
      };

      scope.setBarToOne = false;
      scope.bar = 0;
      scope.two = 2;
      scope.foo = function () {
        if (scope.setBarToOne) scope.bar = 1;
      };
      scope.$watch("foo(); bar + two", listener);

      scope.$digest();
      expect(lastVal).toBe(2);

      scope.bar = 2;
      scope.$digest();
      expect(lastVal).toBe(4);

      scope.setBarToOne = true;
      scope.$digest();
      expect(lastVal).toBe(3);
    });

    it("should watch the left side of assignments", () => {
      let lastVal = NaN;
      const listener = function (val) {
        lastVal = val;
      };

      const objA = {};
      const objB = {};

      scope.$watch("curObj.value = input", () => {});

      scope.curObj = objA;
      scope.input = 1;
      scope.$digest();
      expect(objA.value).toBe(scope.input);

      scope.curObj = objB;
      scope.$digest();
      expect(objB.value).toBe(scope.input);

      scope.input = 2;
      scope.$digest();
      expect(objB.value).toBe(scope.input);
    });

    it("should watch ES6 object computed property changes", () => {
      let count = 0;
      let lastValue;

      scope.$watch("{[a]: true}", (val) => {
        count++;
        lastValue = val;
      });

      scope.$digest();
      expect(count).toBe(1);
      expect(lastValue).toEqual({ undefined: true });

      scope.$digest();
      expect(count).toBe(1);
      expect(lastValue).toEqual({ undefined: true });

      scope.a = true;
      scope.$digest();
      expect(count).toBe(2);
      expect(lastValue).toEqual({ true: true });

      scope.a = "abc";
      scope.$digest();
      expect(count).toBe(3);
      expect(lastValue).toEqual({ abc: true });

      scope.a = undefined;
      scope.$digest();
      expect(count).toBe(4);
      expect(lastValue).toEqual({ undefined: true });
    });

    it("should not shallow-watch ES6 object computed properties in case of stateful toString", () => {
      let count = 0;
      let lastValue;

      scope.$watch("{[a]: true}", (val) => {
        count++;
        lastValue = val;
      });

      scope.a = {
        toString() {
          return this.b;
        },
      };
      scope.a.b = 1;

      // TODO: would be great if it didn't throw!
      expect(() => {
        scope.$apply();
      }).toThrowError(/infdig/);
      expect(lastValue).toEqual({ 1: true });

      expect(() => {
        scope.$apply("a.b = 2");
      }).toThrowError(/infdig/);
      expect(lastValue).toEqual({ 2: true });
    });

    describe("locals", () => {
      it("should expose local variables", () => {
        expect($parse("a")({ a: 0 }, { a: 1 })).toEqual(1);
        expect(
          $parse("add(a,b)")(
            {
              b: 1,
              add(a, b) {
                return a + b;
              },
            },
            { a: 2 },
          ),
        ).toEqual(3);
      });

      it("should expose traverse locals", () => {
        expect($parse("a.b")({ a: { b: 0 } }, { a: { b: 1 } })).toEqual(1);
        expect($parse("a.b")({ a: null }, { a: { b: 1 } })).toEqual(1);
        expect($parse("a.b")({ a: { b: 0 } }, { a: null })).toEqual(undefined);
        expect($parse("a.b.c")({ a: null }, { a: { b: { c: 1 } } })).toEqual(1);
      });

      it("should not use locals to resolve object properties", () => {
        expect($parse("a[0].b")({ a: [{ b: "scope" }] }, { b: "locals" })).toBe(
          "scope",
        );
        expect(
          $parse('a[0]["b"]')({ a: [{ b: "scope" }] }, { b: "locals" }),
        ).toBe("scope");
        expect(
          $parse("a[0][0].b")({ a: [[{ b: "scope" }]] }, { b: "locals" }),
        ).toBe("scope");
        expect(
          $parse("a[0].b.c")(
            { a: [{ b: { c: "scope" } }] },
            { b: { c: "locals" } },
          ),
        ).toBe("scope");
      });

      it("should assign directly to locals when the local property exists", () => {
        const s = {};
        const l = {};

        $parse("a = 1")(s, l);
        expect(s.a).toBe(1);
        expect(l.a).toBeUndefined();

        l.a = 2;
        $parse("a = 0")(s, l);
        expect(s.a).toBe(1);
        expect(l.a).toBe(0);

        $parse("toString = 1")(s, l);
        expect(isFunction(s.toString)).toBe(true);
        expect(l.toString).toBe(1);
      });

      it("should overwrite undefined / null scope properties when assigning", () => {
        let scope;

        scope = {};
        $parse("a.b = 1")(scope);
        $parse('c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: 1 }, c: { d: 2 } });

        scope = { a: {} };
        $parse("a.b.c = 1")(scope);
        $parse('a.c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: { c: 1 }, c: { d: 2 } } });

        scope = { a: undefined, c: undefined };
        $parse("a.b = 1")(scope);
        $parse('c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: 1 }, c: { d: 2 } });

        scope = { a: { b: undefined, c: undefined } };
        $parse("a.b.c = 1")(scope);
        $parse('a.c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: { c: 1 }, c: { d: 2 } } });

        scope = { a: null, c: null };
        $parse("a.b = 1")(scope);
        $parse('c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: 1 }, c: { d: 2 } });

        scope = { a: { b: null, c: null } };
        $parse("a.b.c = 1")(scope);
        $parse('a.c["d"] = 2')(scope);
        expect(scope).toEqual({ a: { b: { c: 1 }, c: { d: 2 } } });
      });

      [0, false, "", NaN].forEach((falsyValue) => {
        "should not overwrite $prop scope properties when assigning",
          () => {
            let scope;

            scope = { a: falsyValue, c: falsyValue };
            tryParseAndIgnoreException("a.b = 1");
            tryParseAndIgnoreException('c["d"] = 2');
            expect(scope).toEqual({ a: falsyValue, c: falsyValue });

            scope = { a: { b: falsyValue, c: falsyValue } };
            tryParseAndIgnoreException("a.b.c = 1");
            tryParseAndIgnoreException('a.c["d"] = 2');
            expect(scope).toEqual({ a: { b: falsyValue, c: falsyValue } });

            // Helpers
            //
            // Normally assigning property on a primitive should throw exception in strict mode
            // and silently fail in non-strict mode, IE seems to always have the non-strict-mode behavior,
            // so if we try to use 'expect(() => {$parse('a.b=1')({a:false});).toThrow()' for testing
            // the test will fail in case of IE because it will not throw exception, and if we just use
            // '$parse('a.b=1')({a:false})' the test will fail because it will throw exception in case of Chrome
            // so we use tryParseAndIgnoreException helper to catch the exception silently for all cases.
            //
            function tryParseAndIgnoreException(expression) {
              try {
                $parse(expression)(scope);
              } catch (error) {
                /* ignore exception */
              }
            }
          };
      });
    });

    describe("literal", () => {
      it("should mark scalar value expressions as literal", () => {
        expect($parse("0").literal).toBe(true);
        expect($parse('"hello"').literal).toBe(true);
        expect($parse("true").literal).toBe(true);
        expect($parse("false").literal).toBe(true);
        expect($parse("null").literal).toBe(true);
        expect($parse("undefined").literal).toBe(true);
      });

      it("should mark array expressions as literal", () => {
        expect($parse("[]").literal).toBe(true);
        expect($parse("[1, 2, 3]").literal).toBe(true);
        expect($parse("[1, identifier]").literal).toBe(true);
      });

      it("should mark object expressions as literal", () => {
        expect($parse("{}").literal).toBe(true);
        expect($parse("{x: 1}").literal).toBe(true);
        expect($parse("{foo: bar}").literal).toBe(true);
      });

      it("should not mark function calls or operator expressions as literal", () => {
        expect($parse("1 + 1").literal).toBe(false);
        expect($parse("call()").literal).toBe(false);
        expect($parse("[].length").literal).toBe(false);
      });
    });

    describe("constant", () => {
      it("should mark an empty expressions as constant", () => {
        expect($parse("").constant).toBe(true);
        expect($parse("   ").constant).toBe(true);
        expect($parse("::").constant).toBe(true);
        expect($parse("::    ").constant).toBe(true);
      });

      it("should mark scalar value expressions as constant", () => {
        expect($parse("12.3").constant).toBe(true);
        expect($parse('"string"').constant).toBe(true);
        expect($parse("true").constant).toBe(true);
        expect($parse("false").constant).toBe(true);
        expect($parse("null").constant).toBe(true);
        expect($parse("undefined").constant).toBe(true);
      });

      it("should mark arrays as constant if they only contain constant elements", () => {
        expect($parse("[]").constant).toBe(true);
        expect($parse("[1, 2, 3]").constant).toBe(true);
        expect($parse('["string", null]').constant).toBe(true);
        expect($parse("[[]]").constant).toBe(true);
        expect($parse("[1, [2, 3], {4: 5}]").constant).toBe(true);
      });

      it("should not mark arrays as constant if they contain any non-constant elements", () => {
        expect($parse("[foo]").constant).toBe(false);
        expect($parse("[x + 1]").constant).toBe(false);
        expect($parse("[bar[0]]").constant).toBe(false);
      });

      it("should mark complex expressions involving constant values as constant", () => {
        expect($parse("!true").constant).toBe(true);
        expect($parse("-42").constant).toBe(true);
        expect($parse("1 - 1").constant).toBe(true);
        expect($parse('"foo" + "bar"').constant).toBe(true);
        expect($parse("5 != null").constant).toBe(true);
        expect($parse("{standard: 4/3, wide: 16/9}").constant).toBe(true);
        expect($parse("{[standard]: 4/3, wide: 16/9}").constant).toBe(false);
        expect($parse('{["key"]: 1}').constant).toBe(true);
        expect($parse("[0].length").constant).toBe(true);
        expect($parse("[0][0]").constant).toBe(true);
        expect($parse("{x: 1}.x").constant).toBe(true);
        expect($parse('{x: 1}["x"]').constant).toBe(true);
      });

      it("should not mark any expression involving variables or function calls as constant", () => {
        expect($parse("true.toString()").constant).toBe(false);
        expect($parse("foo(1, 2, 3)").constant).toBe(false);
        expect($parse('"name" + id').constant).toBe(false);
      });
    });

    describe("null/undefined in expressions", () => {
      // simpleGetterFn1
      it("should return null for `a` where `a` is null", () => {
        $rootScope.a = null;
        expect($rootScope.$eval("a")).toBe(null);
      });

      it("should return undefined for `a` where `a` is undefined", () => {
        expect($rootScope.$eval("a")).toBeUndefined();
      });

      // simpleGetterFn2
      it("should return undefined for properties of `null` constant", () => {
        expect($rootScope.$eval("null.a")).toBeUndefined();
      });

      it("should return undefined for properties of `null` values", () => {
        $rootScope.a = null;
        expect($rootScope.$eval("a.b")).toBeUndefined();
      });

      it("should return null for `a.b` where `b` is null", () => {
        $rootScope.a = { b: null };
        expect($rootScope.$eval("a.b")).toBe(null);
      });

      // cspSafeGetter && pathKeys.length < 6 || pathKeys.length > 2
      it("should return null for `a.b.c.d.e` where `e` is null", () => {
        $rootScope.a = { b: { c: { d: { e: null } } } };
        expect($rootScope.$eval("a.b.c.d.e")).toBe(null);
      });

      it("should return undefined for `a.b.c.d.e` where `d` is null", () => {
        $rootScope.a = { b: { c: { d: null } } };
        expect($rootScope.$eval("a.b.c.d.e")).toBeUndefined();
      });

      // cspSafeGetter || pathKeys.length > 6
      it("should return null for `a.b.c.d.e.f.g` where `g` is null", () => {
        $rootScope.a = { b: { c: { d: { e: { f: { g: null } } } } } };
        expect($rootScope.$eval("a.b.c.d.e.f.g")).toBe(null);
      });

      it("should return undefined for `a.b.c.d.e.f.g` where `f` is null", () => {
        $rootScope.a = { b: { c: { d: { e: { f: null } } } } };
        expect($rootScope.$eval("a.b.c.d.e.f.g")).toBeUndefined();
      });

      it("should return undefined if the return value of a function invocation is undefined", () => {
        $rootScope.fn = function () {};
        expect($rootScope.$eval("fn()")).toBeUndefined();
      });

      it("should ignore undefined values when doing addition/concatenation", () => {
        $rootScope.fn = function () {};
        expect($rootScope.$eval('foo + "bar" + fn()')).toBe("bar");
      });

      it("should treat properties named null/undefined as normal properties", () => {
        expect(
          $rootScope.$eval("a.null.undefined.b", {
            a: { null: { undefined: { b: 1 } } },
          }),
        ).toBe(1);
      });

      it("should not allow overriding null/undefined keywords", () => {
        expect($rootScope.$eval("null.a", { null: { a: 42 } })).toBeUndefined();
      });

      it("should allow accessing null/undefined properties on `this`", () => {
        $rootScope.null = { a: 42 };
        expect($rootScope.$eval("this.null.a")).toBe(42);
      });

      it("should allow accessing $locals", () => {
        $rootScope.foo = "foo";
        $rootScope.bar = "bar";
        $rootScope.$locals = "foo";
        const locals = { foo: 42 };
        expect($rootScope.$eval("$locals")).toBeUndefined();
        expect($rootScope.$eval("$locals.foo")).toBeUndefined();
        expect($rootScope.$eval("this.$locals")).toBe("foo");
        expect(() => {
          $rootScope.$eval("$locals = {}");
        }).toThrow();
        expect(() => {
          $rootScope.$eval("$locals.bar = 23");
        }).toThrow();
        expect($rootScope.$eval("$locals", locals)).toBe(locals);
        expect($rootScope.$eval("$locals.foo", locals)).toBe(42);
        expect($rootScope.$eval("this.$locals", locals)).toBe("foo");
        expect(() => {
          $rootScope.$eval("$locals = {}", locals);
        }).toThrow();
        expect($rootScope.$eval("$locals.bar = 23", locals)).toEqual(23);
        expect(locals.bar).toBe(23);
      });
    });

    [true, false].forEach((cspEnabled) => {
      describe(`custom identifiers (csp: ${cspEnabled})`, () => {
        const isIdentifierStartRe = /[#a-z]/;
        const isIdentifierContinueRe = /[-a-z]/;
        let isIdentifierStartFn;
        let isIdentifierContinueFn;
        let scope;

        beforeEach(() => {
          createInjector([
            "ng",
            function ($parseProvider) {
              isIdentifierStartFn = jasmine
                .createSpy("isIdentifierStart")
                .and.callFake((ch, cp) => isIdentifierStartRe.test(ch));
              isIdentifierContinueFn = jasmine
                .createSpy("isIdentifierContinue")
                .and.callFake((ch, cp) => isIdentifierContinueRe.test(ch));

              $parseProvider.setIdentifierFns(
                isIdentifierStartFn,
                isIdentifierContinueFn,
              );
              csp().noUnsafeEval = cspEnabled;
            },
          ]).invoke((_$rootScope_) => {
            scope = _$rootScope_;
          });
        });

        it("should allow specifying a custom `isIdentifierStart/Continue` functions", () => {
          scope.x = {};

          scope["#foo"] = "foo";
          scope.x["#foo"] = "foo";
          expect(scope.$eval("#foo")).toBe("foo");
          expect(scope.$eval("x.#foo")).toBe("foo");

          scope["bar--"] = 42;
          scope.x["bar--"] = 42;
          expect(scope.$eval("bar--")).toBe(42);
          expect(scope.$eval("x.bar--")).toBe(42);
          expect(scope["bar--"]).toBe(42);
          expect(scope.x["bar--"]).toBe(42);

          scope["#-"] = "baz";
          scope.x["#-"] = "baz";
          expect(scope.$eval("#-")).toBe("baz");
          expect(scope.$eval("x.#-")).toBe("baz");

          expect(() => {
            scope.$eval("##");
          }).toThrow();
          expect(() => {
            scope.$eval("x.##");
          }).toThrow();

          expect(() => {
            scope.$eval("--");
          }).toThrow();
          expect(() => {
            scope.$eval("x.--");
          }).toThrow();
        });

        it("should pass the character and codepoint to the custom functions", () => {
          scope.$eval("#-");
          expect(isIdentifierStartFn).toHaveBeenCalledOnceWith(
            "#",
            "#".charCodeAt(0),
          );
          expect(isIdentifierContinueFn).toHaveBeenCalledOnceWith(
            "-",
            "-".charCodeAt(0),
          );

          isIdentifierStartFn.calls.reset();
          isIdentifierContinueFn.calls.reset();

          scope.$eval("#.foo.#-.bar-");
          expect(isIdentifierStartFn).toHaveBeenCalledTimes(7);
          expect(isIdentifierStartFn.calls.allArgs()).toEqual([
            ["#", "#".charCodeAt(0)],
            [".", ".".charCodeAt(0)],
            ["f", "f".charCodeAt(0)],
            [".", ".".charCodeAt(0)],
            ["#", "#".charCodeAt(0)],
            [".", ".".charCodeAt(0)],
            ["b", "b".charCodeAt(0)],
          ]);
          expect(isIdentifierContinueFn).toHaveBeenCalledTimes(9);
          expect(isIdentifierContinueFn.calls.allArgs()).toEqual([
            [".", ".".charCodeAt(0)],
            ["o", "o".charCodeAt(0)],
            ["o", "o".charCodeAt(0)],
            [".", ".".charCodeAt(0)],
            ["-", "-".charCodeAt(0)],
            [".", ".".charCodeAt(0)],
            ["a", "a".charCodeAt(0)],
            ["r", "r".charCodeAt(0)],
            ["-", "-".charCodeAt(0)],
          ]);
        });
      });
    });
  });
});
