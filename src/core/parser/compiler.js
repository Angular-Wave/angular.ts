import {
  findConstantAndWatchExpressions,
  assignableAST,
  getInputs,
  ifDefined,
  getStringValue,
  plusFn,
} from "./shared";
import { forEach, isDefined, isNumber, isString } from "../../shared/utils";
import { ASTType } from "./ast-type";
import { $parseMinErr } from "./parse";

export function ASTCompiler($filter) {
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
